import { Request, Response } from "express";
import { sheetsService } from "./sheet.service";

// POST
export const addData = async (req: Request, res: Response) => {
  try {
    const { values } = req.body;

    const response = await sheetsService.appendRow("Sheet1!A:Z", values);

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET
export const getData = async (_req: Request, res: Response) => {
  try {
    const data = await sheetsService.getRows("Sheet1!A:Z");

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT
export const updateData = async (req: Request, res: Response) => {
  try {
    const { range, values } = req.body;

    const response = await sheetsService.updateRow(range, values);

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const extractJobStructuredData = async (req: Request, res: Response) => {
  const { jobDescription } = req.body;
  const OLLAMA_API_KEY =
    "6940e750ce0e46f7818ae1275d04f9da.xAJtr0rEXjJVG0haDTjwIlHJ";
  if (!jobDescription || typeof jobDescription !== "string") {
    return res.status(400).json({ message: "jobDescription is required" });
  }

  if (!OLLAMA_API_KEY) {
    return res
      .status(500)
      .json({ message: "Ollama API key not configured on server" });
  }

  try {
    const ollamaRes = await fetch("https://ollama.com/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemma4:31b-cloud", // ← Smaller & faster model
        prompt: `This is a job description: ${jobDescription}

Return **ONLY** a valid JSON array with exactly these 9 fields in this exact order:

[
  "Job Title",
  "Company Name",
  "Category",
  "Category_1",
  "Location",
  "Work Type",
  "Experience",
  "Salary (BDT/mo)",
  "Skills Required"
]

Rules:
- Return only one array, nothing else. No explanation.
- If multiple jobs are mentioned, pick only the internship or entry-level one if available.
- Use "N/A" if information is missing.
- Salary must be converted/estimated in BDT per month.
- Skills Required: comma-separated string (max 15 skills).
- Do not include Posted date, Source, or Job URL.`,
        stream: false,
        think: false,
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      throw new Error(`Ollama API failed: ${ollamaRes.status} - ${errorText}`);
    }

    const data = await ollamaRes.json();
    // console.log(data)
    const content = data.response || data.message?.content || "";
   
    const structuredData = content;

    // // Ensure it's an array of 9 items
    // if (!Array.isArray(structuredData) || structuredData.length !== 9) {
    //   throw new Error("Invalid structured data format");
    // }

    return res.json(structuredData);
  } catch (error: any) {
    console.error("Extract job error:", error);
    return res.status(500).json({
      message: error.message || "Failed to extract structured data",
    });
  }
};

export const sheetsController = {
  addData,
  getData,
  updateData,
  extractJobStructuredData
};
