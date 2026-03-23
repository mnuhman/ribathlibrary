import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getLibraryTrends() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "What are the top 5 modern features for a library management system in 2026?",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text;
}
