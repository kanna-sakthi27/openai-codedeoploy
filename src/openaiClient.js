import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;

const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

export async function getCodeChangeFromPrompt(prompt) {
  try {
    const chatMessages = [
      {
        role: "system",
        content:
              "You are an expert developer skilled in C#, JavaScript, CSS and XAML. Given a user request and the content of multiple files, decide if the files needs changes to satisfy the request. If yes, return the full updated file content with changes applied. If no changes are needed, reply exactly 'No changes needed.' Do not include explanations."      },
      {
        role: "user",
        content: prompt
      }
    ];

    const result = await client.getChatCompletions(deploymentName, chatMessages, {
      maxTokens: 1500,
      temperature: 0.2
    });

    if (
      !result ||
      !result.choices ||
      result.choices.length === 0 ||
      !result.choices[0].message ||
      !result.choices[0].message.content
    ) {
      throw new Error("Azure OpenAI returned an unexpected response format.");
    }

    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    throw error;
  }
}
