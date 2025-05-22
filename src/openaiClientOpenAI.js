import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o";

export async function getCodeChangeFromPrompt(prompt) {
  try {
    const chatMessages = [
      {
        role: "system",
        content:
          "You are an expert developer skilled in Node.js, JavaScript, C#, CSS, and XAML. Given a user request and the content of multiple files, decide if the files need changes to satisfy the request. If yes, return the full updated file content with changes applied. If no changes are needed, reply exactly 'No changes needed.' Do not include explanations."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: chatMessages,
        max_tokens: 1500,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const result = await response.json();

    if (
      !result ||
      !result.choices ||
      result.choices.length === 0 ||
      !result.choices[0].message ||
      !result.choices[0].message.content
    ) {
      throw new Error("OpenAI returned an unexpected response format.");
    }

    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}
