import AppError from "../../helpers/app-error";
import { GoogleGenAI } from "@google/genai";

// In your controller
export const geminiStream = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const { apiKey } = req.query;
  if (!apiKey) {
    throw new AppError(401, "Please provide apiKey!");
  }
  const genAI = new GoogleGenAI({ apiKey: apiKey as string });

  const { prompt, model } = req.query;

  // console.log(model)

  // Validate input
  if (!prompt || typeof prompt !== "string") {
    res.write(`data: ${JSON.stringify({ error: "Invalid prompt" })}\n\n`);
    res.end();
    return;
  }
  //   console.log(prompt)
  //	gemini-2.5-flash
  try {
    const result = await genAI.models.generateContentStream({
      model: model || "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    for await (const chunk of result) {
      const text = chunk.text;
      //   console.log(text)
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    // res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error: any) {
    // console.error(error);
    res.write(
      `data: ${JSON.stringify({ error: error?.message || "AI service error" })}\n\n`,
    );
    res.end();
  }
};

export const AiControllers = {
  geminiStream,
};
