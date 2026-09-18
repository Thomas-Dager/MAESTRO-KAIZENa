import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL, Type } from "@/lib/gemini";
import type { ScaffoldingStep, ScaffoldingStepType } from "@/types";

export const dynamic = "force-dynamic";

const SCAFFOLDING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Título del escalón previo o micro-regresión de andamiaje.",
    },
    type: {
      type: Type.STRING,
      description: "Tipo de andamiaje: 'analogy', 'guided_example', 'concept', o 'reflection'.",
    },
    diagnosis: {
      type: Type.STRING,
      description: "Causa raíz identificada del bloqueo pedagógico o técnico.",
    },
    regressionExplanation: {
      type: Type.STRING,
      description: "Explicación de la regresión biomecánica o cognitiva adaptada.",
    },
    stepByStepInstructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Secuencia de 2 a 4 acciones atómicas para superar el bloqueo sin fricción.",
    },
    sensoryCheckpoint: {
      type: Type.STRING,
      description: "Señal sensorial o prueba de validación inmediata que confirma el desbloqueo.",
    },
    hint: {
      type: Type.STRING,
      description: "Consejo socrático breve para reducir la ansiedad del aprendiz.",
    },
    estimatedMinutes: {
      type: Type.INTEGER,
      description: "Minutos requeridos para la micro-práctica (ej: 5 a 10 min).",
    },
  },
  required: [
    "title",
    "type",
    "diagnosis",
    "regressionExplanation",
    "stepByStepInstructions",
    "sensoryCheckpoint",
    "hint",
    "estimatedMinutes",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customApiKey = req.headers.get("x-gemini-api-key") || body.customApiKey;
    const { aiClient, configured } = getGeminiClient(customApiKey);
    // Input sanitization and bounds enforcement
    const milestoneId = typeof body.milestoneId === "string" ? body.milestoneId.slice(0, 50) : "current-milestone";
    const milestoneTitle = typeof body.milestoneTitle === "string" && body.milestoneTitle.trim()
      ? body.milestoneTitle.trim().slice(0, 150)
      : "Hito de Aprendizaje";
    const milestoneTheory = typeof body.milestoneTheory === "string" ? body.milestoneTheory.slice(0, 500) : "";
    const difficulty = typeof body.difficulty === "string" ? body.difficulty.slice(0, 30) : "bloqueado";
    const comments = typeof body.comments === "string" 
      ? body.comments.trim().slice(0, 400) 
      : "Siento que el paso es demasiado complejo para mi nivel actual.";
    const blockers: string[] = Array.isArray(body.blockers)
      ? body.blockers.slice(0, 6).map((b: any) => String(b).slice(0, 100))
      : [];

    const getFallbackScaffolding = () => {
      const lowerComments = (comments + " " + blockers.join(" ")).toLowerCase();

      let fallbackTitle = `Escalón Previo: Micro-Regresión para "${milestoneTitle}"`;
      let fallbackDiagnosis = "Sobrecarga de variables simultáneas detectada.";
      let fallbackRegression = "Aislamiento temporal de la variable de mayor fricción para recuperar estado de flujo.";
      let fallbackContent = `Diagnóstico: Has experimentado un bloqueo en "${milestoneTitle}". Descomponemos el movimiento en una micro-práctica aislada:\n1. Elimina la velocidad o presión del resultado final.\n2. Aísla únicamente el primer movimiento o concepto clave durante 5 minutos.\n3. Observa tu respiración y valida la precisión antes de continuar.`;
      let fallbackCheckpoint = "Sensación de claridad y ausencia de tensión en hombros y manos.";
      let fallbackHint = "El método Kaizen consiste en reducir la dificultad hasta que sea imposible fallar.";

      if (lowerComments.includes("tobillo") || lowerComments.includes("talón") || lowerComments.includes("flexibilidad") || lowerComments.includes("bajar")) {
        fallbackTitle = "⚡ Escalón Previo: Elevación del Talón con Cuña y Movilización de Sóleo";
        fallbackDiagnosis = "Restricción en el rango de dorsiflexión del tobillo (acortamiento de sóleo/gemelo).";
        fallbackRegression = "Modificación biomecánica transitoria mediante elevación del talón para preservar el patrón de sentadilla profunda.";
        fallbackContent = `Diagnóstico: Has experimentado un bloqueo de dorsiflexión en el tobillo al descender.\n\nMicro-Regresión Inmediata:\n1. Coloca una elevación sólida (libro, disco o cuña de 2 a 3 cm) justo debajo de ambos talones.\n2. Realiza 2 series de 8 descensos lentos (3 segundos para bajar) manteniendo la espalda erguida.\n3. Realiza 45 segundos de estiramiento de sóleo contra la pared en cada pierna.`;
        fallbackCheckpoint = "Sentir los talones firmemente anclados a la cuña sin balanceo hacia la punta de los pies.";
        fallbackHint = "La elevación artificial del talón reduce en un 40% el requerimiento de movilidad mientras construyes flexibilidad a largo plazo.";
      } else if (lowerComments.includes("papel") || lowerComments.includes("pliegue") || lowerComments.includes("arruga")) {
        fallbackTitle = "⚡ Escalón Previo: Marcado de Pre-Pliegues en Cuadrante Aislado";
        fallbackDiagnosis = "Tensión asimétrica en el núcleo del papel por falta de pliegues preparatorios.";
        fallbackRegression = "Práctica deliberada del pliegue invertido en una hoja de borrador antes de tocar el modelo final.";
        fallbackContent = `Diagnóstico: El pliegue se arruga por exceso de capas acumuladas.\n\nMicro-Regresión Inmediata:\n1. Toma una tira o papel de prueba para no estropear tu figura.\n2. Marca las diagonales de valle y montaña en ambos sentidos antes de colapsar.\n3. Presiona con la yema del pulgar desde el centro hacia afuera.`;
        fallbackCheckpoint = "El papel colapsa naturalmente por la línea marcada sin resistencia mecánica.";
        fallbackHint = "Un pliegue nítido previo hace que el papel se doble solo.";
      }

      const fallbackStep: ScaffoldingStep = {
        id: `scaffold-${Date.now()}`,
        milestoneId,
        order: 0, // se inserta como escalón previo prioritario
        type: "guided_example",
        title: fallbackTitle,
        content: fallbackContent,
        hint: fallbackHint,
        isCompleted: false,
      };

      return {
        diagnosis: fallbackDiagnosis,
        regressionExplanation: fallbackRegression,
        sensoryCheckpoint: fallbackCheckpoint,
        scaffoldingStep: fallbackStep,
      };
    };

    // Si Gemini no está configurado, generar respuesta pedagógica determinista
    if (!configured) {
      return NextResponse.json(getFallbackScaffolding());
    }

    try {
      // Ejecución con Gemini 2.0 Flash
      const systemInstruction = `Eres Maestro Kaizen, especialista en andamiaje pedagógico adaptativo (Scaffolding y Vygotsky ZDP).
El aprendiz está intentando completar el hito: "${milestoneTitle}".
Teoría del hito: "${milestoneTheory}".
Estado reportado por el usuario: "${difficulty}".
Comentarios del aprendiz: "${comments}".
Bloqueos específicos: ${blockers.join(", ") || "No especificados"}.

REGLAS PEDAGÓGICAS KAIZEN:
1. NUNCA pospongas el objetivo general; descompón la habilidad en una REGRESIÓN inmediata (escalón previo).
2. Si el problema es biomecánico o técnico, aísla un solo sub-movimiento.
3. Si el problema es conceptual o abstracto, provee una analogía física o un ejemplo trabajado (worked example).
4. El micro-ejercicio no debe durar más de 5 a 10 minutos.`;

      const promptText = `Genera un ScaffoldingStep inmediato para desbloquear al aprendiz en "${milestoneTitle}".`;

      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: SCAFFOLDING_SCHEMA,
        },
      });

      const parsed = JSON.parse(response.text || "{}");

      const scaffoldingStep: ScaffoldingStep = {
        id: `scaffold-${Date.now()}`,
        milestoneId,
        order: 0,
        type: (parsed.type as ScaffoldingStepType) || "guided_example",
        title: parsed.title || `Escalón Previo: ${milestoneTitle}`,
        content: `${parsed.regressionExplanation}\n\nInstrucciones:\n${(parsed.stepByStepInstructions || [])
          .map((step: string, i: number) => `${i + 1}. ${step}`)
          .join("\n")}\n\nFoco sensorial: ${parsed.sensoryCheckpoint}`,
        hint: parsed.hint || "Avanza en incrementos de 1% sin juzgar el resultado.",
        isCompleted: false,
      };

      return NextResponse.json({
        diagnosis: parsed.diagnosis,
        regressionExplanation: parsed.regressionExplanation,
        sensoryCheckpoint: parsed.sensoryCheckpoint,
        scaffoldingStep,
      });
    } catch (geminiError) {
      console.warn("Gemini API no disponible o cuota agotada en scaffolding. Usando fallback pedagógico:", geminiError);
      return NextResponse.json(getFallbackScaffolding());
    }
  } catch (error) {
    console.error("Error inesperado en /api/ai/scaffolding:", error);
    return NextResponse.json(
      { error: "Error al generar el andamiaje pedagógico con IA." },
      { status: 500 }
    );
  }
}
