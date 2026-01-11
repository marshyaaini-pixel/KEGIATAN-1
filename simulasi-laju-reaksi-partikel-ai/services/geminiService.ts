
import { GoogleGenAI, Type } from "@google/genai";
import { StudentAnswers, ParticleState } from "../types";

// Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAnswersWithAI = async (
  answers: StudentAnswers, 
  particles: { t0: ParticleState; t10: ParticleState; t20: ParticleState }
) => {
  const prompt = `
    Evaluate the following student answers for a Chemistry simulation about Reaction Rates.
    The simulation involved biomass (red particles) turning into pollutants (blue particles).
    
    Simulation Data:
    - t=0s: ${particles.t0.red} red, ${particles.t0.blue} blue
    - t=10s: ${particles.t10.red} red, ${particles.t10.blue} blue
    - t=20s: ${particles.t20.red} red, ${particles.t20.blue} blue
    
    Student Answers:
    1. Reduction Rate Analysis: "${answers.reduction}"
    2. Formation Rate Analysis: "${answers.formation}"
    3. Positive/Negative Sign Explanation: "${answers.negative}"
    4. Environmental Impact: "${answers.air}"
    5. Definition of Reaction Rate: "${answers.definition}"
    
    Please provide:
    1. A numeric score (0-100).
    2. Detailed feedback in Indonesian (Bahasa Indonesia).
    3. An overall summary feedback.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["score", "feedback", "summary"]
        }
      }
    });

    // Guideline: The .text property (not a method) directly returns the string output.
    const text = response.text || '{}';
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      score: 0,
      feedback: "Gagal menganalisis jawaban menggunakan AI. Silakan periksa koneksi atau kunci API.",
      summary: "Error"
    };
  }
};