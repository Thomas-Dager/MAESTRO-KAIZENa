const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    console.log("Llamando a gemini-2.5-flash...");
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Diseña 3 hitos para aprender la técnica del palacio mental",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  theory: { type: Type.STRING }
                },
                required: ["dayNumber", "title", "theory"]
              }
            }
          },
          required: ["planTitle", "milestones"]
        }
      }
    });

    console.log("EXITO:", JSON.stringify(JSON.parse(r.text), null, 2));
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

main();
