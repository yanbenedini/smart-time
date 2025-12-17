
import { GoogleGenAI } from "@google/genai";
import { Absence, Employee } from '../types';

/**
 * Analyzes trends in employee absences using Google Gemini AI.
 * Uses gemini-3-flash-preview for efficient text analysis.
 */
export const analyzeAbsenceTrends = async (absences: Absence[], employees: Employee[]): Promise<string> => {
  try {
    // Correct initialization using named parameter and direct process.env.API_KEY access
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare data summary for the model
    const dataSummary = JSON.stringify({
      totalEmployees: employees.length,
      absences: absences.map(a => ({
        reason: a.reason,
        duration: a.durationMinutes,
        date: a.date
      }))
    });

    // Using recommended model for Basic Text Tasks: gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an HR data analyst for "Smart Time". Analyze the following absence data JSON and provide a 3-sentence summary highlighting any patterns, potential productivity risks, or positive notes. Keep it professional and neutral. Data: ${dataSummary}`,
    });

    // Access the text property directly (not a method) as per SDK guidelines
    return response.text || "Não foi possível gerar análise no momento.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Erro ao conectar com serviço de inteligência.";
  }
};
