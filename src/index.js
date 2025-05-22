import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { getCodeChangeFromPrompt } from "./openaiClient.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const codeBasePath = path.resolve(process.env.CODE_BASE_PATH || "./codebase");
const pendingDir = path.join(codeBasePath, "pending_changes");

app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), "src/public")));

// Ensure pending_changes folder exists
await fs.mkdir(pendingDir, { recursive: true });

async function backupFile(filePath) {
  const backupDir = path.join(path.dirname(filePath), "backups");
  await fs.mkdir(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${baseName}.${timestamp}.bak`);
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}

async function savePendingChange(relativeFilePath, content) {
  const safeFileName = relativeFilePath.replace(/[\\/]/g, "__");
  const pendingFile = path.join(pendingDir, safeFileName);
  await fs.writeFile(pendingFile, content, "utf8");
  return pendingFile;
}

async function listPendingChanges() {
  const files = await fs.readdir(pendingDir);
  const changes = [];
  for (const file of files) {
    const content = await fs.readFile(path.join(pendingDir, file), "utf8");
    changes.push({ file, content });
  }
  return changes;
}

async function applyApprovedChanges() {
  const files = await fs.readdir(pendingDir);
  for (const file of files) {
    const content = await fs.readFile(path.join(pendingDir, file), "utf8");
    const originalFilePath = path.join(codeBasePath, file.replace(/__/g, path.sep));
    await backupFile(originalFilePath);
    await fs.writeFile(originalFilePath, content, "utf8");
    await fs.unlink(path.join(pendingDir, file));
  }
}

function buildProject(solutionPath) {
  return new Promise((resolve, reject) => {
    exec(`dotnet build "${solutionPath}"`, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

// AI code generation: Save changes to pending folder instead of overwriting
app.post("/api/generate-code", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const fileExts = [".cs", ".xaml", ".js", ".css"];
    const maxFilesToProcess = 10;
    let filesProcessed = 0;
    const changedFiles = [];

    async function walk(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (filesProcessed >= maxFilesToProcess) break;
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (fileExts.includes(path.extname(entry.name))) {
          const relativeFilePath = path.relative(codeBasePath, fullPath);
          const content = await fs.readFile(fullPath, "utf8");

          const filePrompt = `
User request: ${prompt}

Here is the content of the file:

${content}

Respond with either the full updated file content with changes applied, or exactly "No changes needed."
`;

          const aiResponse = await getCodeChangeFromPrompt(filePrompt);

          if (aiResponse.toLowerCase() === "no changes needed.") {
            filesProcessed++;
            continue;
          }

          await savePendingChange(relativeFilePath, aiResponse);
          changedFiles.push({ file: relativeFilePath, changes: aiResponse });
          filesProcessed++;
        }
      }
    }

    await walk(codeBasePath);

    if (changedFiles.length === 0) {
      return res.json({ message: "No files needed changes based on the prompt." });
    }

    res.json({
      message: `Generated changes for ${changedFiles.length} file(s). Review and approve to apply.`,
      changedFiles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate code changes." });
  }
});

// Get pending changes for review
app.get("/api/pending-changes", async (req, res) => {
  try {
    const changes = await listPendingChanges();
    res.json(changes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to list pending changes." });
  }
});

// Approve changes: apply, build, deploy
app.post("/api/approve-changes", async (req, res) => {
  try {
    await applyApprovedChanges();

    // Update this path to your actual solution file
    const solutionPath = path.join(codeBasePath, "Unleashed.2010.sln");

    const buildOutput = await buildProject(solutionPath);

    // TODO: Trigger SaltStack deployment here if needed
    // Example: exec('salt ...', ...)

    res.json({
      message: "Changes applied, project built successfully.",
      buildOutput
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
