import { NextRequest } from "next/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import type { ChatMessage } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customApiKey = req.headers.get("x-gemini-api-key") || body.customApiKey;
    const { aiClient, configured } = getGeminiClient(customApiKey);
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages: ChatMessage[] = rawMessages.slice(-15).map((m: any) => ({
      id: String(m?.id || Date.now()),
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content || "").slice(0, 1000),
      timestamp: Number(m?.timestamp) || Date.now(),
    }));

    const rawContext = body.notebookContext || {};
    const notebookContext = {
      title: String(rawContext.title || "Cuaderno Kaizen").slice(0, 100),
      topic: String(rawContext.topic || "General").slice(0, 100),
      currentMilestone: String(rawContext.currentMilestone || "Fundamentos").slice(0, 150),
      currentDifficulty: String(rawContext.currentDifficulty || "beginner").slice(0, 30),
    };
    const userNotes = String(body.userNotes || "").slice(0, 1000);

    const createFallbackStream = () => {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "mi duda";
      const simulatedText = `Como tu Maestro Kaizen, observo tu inquietud sobre: *"recuerdo lo que preguntaste: ${lastUserMsg}"*.

En el contexto de **${notebookContext.title}**, la clave no radica en forzar la comprensión de golpe, sino en aislar el principio fundamental.

1. **Pregunta socrática:** ¿Qué parte exacta del hito actual (*${notebookContext.currentMilestone}*) sientes que te genera mayor fricción cognitiva?
2. **Micro-acción inmediata:** Dedica los próximos 3 minutos a escribir en tus propias palabras qué intentas lograr antes de seguir.

*El dominio no es la ausencia de errores, sino la velocidad a la que corriges el rumbo.*`;

      const encoder = new TextEncoder();
      const words = simulatedText.split(" ");

      return new ReadableStream({
        async start(controller) {
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          controller.close();
        },
      });
    };

    // Si Gemini no está configurado, transmitir chunks simulados
    if (!configured) {
      return new Response(createFallbackStream(), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const systemInstruction = `Eres Maestro Kaizen, un tutor socrático de élite en aprendizaje acelerado.
CONTEXTO DEL CUADERNO:
- Cuaderno activo: "${notebookContext.title}"
- Especialidad/Tema: "${notebookContext.topic}"
- Hito actual en curso: "${notebookContext.currentMilestone || "No especificado"}"
- Nivel de dificultad actual: "${notebookContext.currentDifficulty || "beginner"}"
- Notas personales del usuario: "${userNotes || "Sin notas registradas"}"

ESTILO DE RESPUESTA SOCRÁTICA:
1. Respuestas concisas, estimulantes y directas.
2. No resuelvas todo pasivamente; haz preguntas reflexivas que guíen al aprendiz a descubrir la solución por sí mismo.
3. Conecta las respuestas con el principio Kaizen: progreso continuo a través de micro-hábitos y retroalimentación sensorial inmediata.
4. Usa formato Markdown limpio.`;

    try {
      // Preparar el formato de contenidos para Gemini 2.0 Flash
      const formattedContents = messages.map((m: ChatMessage) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      if (formattedContents.length === 0) {
        return new Response(createFallbackStream(), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }

      const responseStream = await aiClient.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });

      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          } catch (err) {
            console.error("Error en el stream de Gemini:", err);
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (geminiError) {
      console.warn("Gemini stream no disponible. Usando fallback pedagógico:", geminiError);
      return new Response(createFallbackStream(), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }
  } catch (error) {
    console.error("Error inesperado en /api/ai/tutor:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar la tutoría socrática." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
