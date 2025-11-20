import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Safely access environment variable without crashing if process is undefined
const getApiKey = (): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore reference errors
  }
  return undefined;
};

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeGameplay = async (
  secret: number,
  rangeMin: number,
  rangeMax: number,
  guesses: number[]
): Promise<AnalysisResult | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    const prompt = `
      You are a strict but encouraging math teacher analyzing a student's number guessing strategy.
      The secret number was ${secret}.
      The range was ${rangeMin} to ${rangeMax}.
      The student made these guesses in order: ${guesses.join(', ')}.
      
      Evaluate if they used an optimal Binary Search strategy. 
      Identify any wasted guesses (e.g., guessing 50 when they already knew it was > 60).
      Give a short constructive feedback paragraph (max 3 sentences).
      Rate their strategy from 1 to 5 stars.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            rating: { type: Type.NUMBER }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini analysis failed", error);
    return null;
  }
};

export const getMathFunFact = async (number: number): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Give me one fascinating, obscure mathematical property or fun fact about the number ${number}. Keep it strictly under 20 words.`,
    });
    return response.text || null;
  } catch (error) {
    console.error("Gemini fact failed", error);
    return null;
  }
};