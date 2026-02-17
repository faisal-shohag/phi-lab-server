import { GoogleGenAI } from "@google/genai";
import { envVars } from "./env";
export const genAI = new GoogleGenAI({apiKey: envVars.GEMINI_API_KEY as string});
