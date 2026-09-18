import { GoogleGenAI, Type } from "@google/genai";

export { Type };

export const GEMINI_MODEL = "gemini-2.5-flash";

const envApiKey = process.env.GEMINI_API_KEY || "";

/**
 * Retorna true si la clave de API de Gemini está configurada en entorno o provista por el usuario.
 */
export function isGeminiConfigured(customKey?: string | null): boolean {
  const candidate = (customKey && customKey.trim().length > 15) ? customKey.trim() : envApiKey.trim();
  return (
    candidate.length > 0 &&
    candidate !== "tu_api_key_aqui" &&
    !candidate.includes("dummy") &&
    !candidate.includes("GEMINI_API_KEY")
  );
}

/**
 * Obtiene una instancia de GoogleGenAI con la clave configurada o customKey.
 */
export function getGeminiClient(customKey?: string | null): { aiClient: GoogleGenAI; configured: boolean } {
  const configured = isGeminiConfigured(customKey);
  const keyToUse = configured
    ? (customKey && customKey.trim().length > 15 ? customKey.trim() : envApiKey.trim())
    : "dummy-dev-key";

  return {
    aiClient: new GoogleGenAI({ apiKey: keyToUse }),
    configured,
  };
}

/**
 * Instancia del cliente GoogleGenAI oficial por defecto.
 */
export const ai = new GoogleGenAI({
  apiKey: isGeminiConfigured() ? envApiKey.trim() : "dummy-dev-key",
});

