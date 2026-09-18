import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL, Type } from "@/lib/gemini";
import { cleanSkillTopic } from "@/lib/topicUtils";

export const dynamic = "force-dynamic";

interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

const ASSESSMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question: {
      type: Type.STRING,
      description: "La pregunta incisiva y empática formulada por Maestro Kaizen.",
    },
    quickReplies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactamente 3 opciones breves y directas de respuesta rápida.",
    },
    status: {
      type: Type.STRING,
      description: "'EN_PROCESO' si se requiere más diagnóstico, o 'DIAGNOSTICO_COMPLETO' si ya se identificó la brecha y el nivel.",
    },
    identifiedGap: {
      type: Type.STRING,
      description: "Brecha principal detectada: técnica, fundamentos, constancia, flexibilidad, o fuerza.",
    },
    assessedLevel: {
      type: Type.STRING,
      description: "Nivel estimado: 'novice', 'beginner', 'intermediate', 'advanced', o 'master'.",
    },
    summary: {
      type: Type.STRING,
      description: "Síntesis pedagógica del diagnóstico para el usuario.",
    },
  },
  required: ["question", "quickReplies", "status", "identifiedGap", "assessedLevel", "summary"],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customApiKey = req.headers.get("x-gemini-api-key") || body.customApiKey;
    const { aiClient, configured } = getGeminiClient(customApiKey);

    // Input sanitization and bounds enforcement
    const rawInterest = typeof body.interest === "string" && body.interest.trim() 
      ? body.interest.trim().slice(0, 150) 
      : "Desarrollo Personal";
    const cleanTopic = cleanSkillTopic(rawInterest);

    const timeHorizonWeeks = Math.min(52, Math.max(1, Number(body.timeHorizonWeeks) || 2));
    const dailyMinutes = Math.min(480, Math.max(5, Number(body.dailyMinutes) || 30));
    const rawHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];
    const conversationHistory: ConversationTurn[] = rawHistory.slice(-10).map((turn: any) => ({
      role: turn?.role === "assistant" ? "assistant" : "user",
      content: String(turn?.content || "").slice(0, 500),
    }));

    const exchangeCount = conversationHistory.filter((m: ConversationTurn) => m.role === "user").length;
    const lowerInterest = rawInterest.toLowerCase();

    const getFallbackAssessment = () => {
      // Caso 1: Cocina y Cortes Culinarios
      if (lowerInterest.includes("corte") || lowerInterest.includes("culinari") || lowerInterest.includes("cocina") || lowerInterest.includes("cuchillo")) {
        if (exchangeCount >= 2) {
          return {
            question: `¡Excelente! He completado tu diagnóstico para "${cleanTopic}". Tu foco Kaizen será el dominio del agarre en pinza (pinch grip), la protección con garra de oso y la uniformidad geométrica en bastones y dados clásicos. ¿Generamos tu Roadmap?`,
            quickReplies: ["¡Sí, genera mi Roadmap de Cortes!", "Ajustar tiempo de práctica", "Repetir evaluación"],
            status: "DIAGNOSTICO_COMPLETO",
            identifiedGap: "Agarre biomecánico de pinza (pinch grip), mano guía en garra y consistencia geométrica.",
            assessedLevel: "beginner",
            summary: `Diagnóstico para "${cleanTopic}". Nivel: Principiante enfocado en seguridad y cortes clásicos.`,
          };
        }

        if (exchangeCount === 1) {
          return {
            question: `En la técnica de cuchillo profesional, el 80% de los errores provienen de la mano guía o de la fuerza innecesaria en la muñeca. ¿Dónde notas mayor fricción al cortar actualmente?`,
            quickReplies: [
              "Cortes desparejos y de diferente tamaño",
              "Fatiga o dolor en muñeca y hombro",
              "Inseguridad y miedo a cortarme los dedos",
            ],
            status: "EN_PROCESO",
            identifiedGap: "Control de mano guía y postura",
            assessedLevel: "novice",
            summary: "Evaluando técnica de agarre y control de mano guía.",
          };
        }

        return {
          question: `Hola, soy Maestro Kaizen. Veo que deseas dominar "${cleanTopic}" en ${timeHorizonWeeks} semanas dedicando ${dailyMinutes} minutos diarios. Para diseñar tu andamiaje: ¿qué cuchillo sueles usar y cuál es tu punto de partida?`,
          quickReplies: [
            "Cuchillo de chef básico / Cero técnica",
            "Pico verduras pero sin uniformidad ni velocidad",
            "He intentado cortes clásicos pero me cuesta la juliana/brunoise",
          ],
          status: "EN_PROCESO",
          identifiedGap: "Punto de partida y herramientas",
          assessedLevel: "novice",
          summary: "Iniciando diagnóstico para técnicas de corte culinario.",
        };
      }

      // Caso 2: Palacio Mental, Método de Loci y Mnemotecnia
      if (
        lowerInterest.includes("palacio") ||
        lowerInterest.includes("loci") ||
        lowerInterest.includes("memoria") ||
        lowerInterest.includes("mnemo")
      ) {
        if (exchangeCount >= 2) {
          return {
            question: `¡Excelente! He completado tu diagnóstico para "${cleanTopic}". Tu andamiaje Kaizen se enfocará en la cartografía de tu primer palacio (tu hogar con 10 loci), la técnica VIVID de imágenes absurdas/multisensoriales y la conversión fonética del Sistema Mayor. ¿Generamos tu Roadmap?`,
            quickReplies: ["¡Sí, genera mi Roadmap de Palacio Mental!", "Ajustar tiempo de práctica", "Repetir evaluación"],
            status: "DIAGNOSTICO_COMPLETO",
            identifiedGap: "Cartografía de rutas de loci sin cruces y codificación visual de imágenes insólitas (VIVID).",
            assessedLevel: "beginner",
            summary: `Diagnóstico para "${cleanTopic}". Nivel: Principiante enfocado en método de loci y Sistema Mayor.`,
          };
        }

        if (exchangeCount === 1) {
          return {
            question: `El secreto del palacio mental radica en no forzar la memoria bruta, sino en asociar ideas a objetos de tu entorno con imágenes insólitas, exageradas y dinámicas. ¿Cuál suele ser tu mayor fricción al intentar memorizar?`,
            quickReplies: [
              "Me cuesta convertir conceptos abstractos en imágenes nítidas",
              "Olvido el orden de las habitaciones o los objetos de apoyo",
              "Los números, fechas o datos densos se me escapan por completo",
            ],
            status: "EN_PROCESO",
            identifiedGap: "Codificación visual abstracta y orden espacial",
            assessedLevel: "novice",
            summary: "Evaluando estilo de codificación mental y debilidad de anclaje.",
          };
        }

        return {
          question: `Hola, soy Maestro Kaizen. Veo que deseas dominar "${cleanTopic}" en ${timeHorizonWeeks} semanas dedicando ${dailyMinutes} minutos diarios. Para calibrar tu entrenamiento mnemotécnico: ¿has utilizado alguna vez rutas espaciales de memoria o actualmente intentas memorizar por repetición mecánica?`,
          quickReplies: [
            "Cero experiencia / Repito mentalmente hasta agotarme",
            "Conozco la teoría del palacio mental pero nunca la apliqué",
            "He probado rutas cortas pero me cuesta recordar listas largas o números",
          ],
          status: "EN_PROCESO",
          identifiedGap: "Punto de partida mnemotécnico y experiencia con loci",
          assessedLevel: "novice",
          summary: "Iniciando diagnóstico para palacio mental y técnicas de loci.",
        };
      }

      // Caso 3: Calistenia y Pistol Squat
      if (
        lowerInterest.includes("pistol") ||
        lowerInterest.includes("sentadilla") ||
        lowerInterest.includes("calistenia") ||
        lowerInterest.includes("pierna")
      ) {
        if (exchangeCount >= 2) {
          return {
            question: `¡Excelente! He completado tu diagnóstico para "${cleanTopic}". Tu foco Kaizen será desbloquear la dorsiflexión del tobillo, construir fuerza excéntrica en cajón y controlar el psoas de la pierna libre. ¿Generamos tu Roadmap?`,
            quickReplies: ["¡Sí, genera mi Roadmap de Pistol Squat!", "Ajustar tiempo de práctica", "Repetir evaluación"],
            status: "DIAGNOSTICO_COMPLETO",
            identifiedGap: "Dorsiflexión de tobillo y fuerza excéntrica unilateral.",
            assessedLevel: "beginner",
            summary: `Diagnóstico para "${cleanTopic}". Nivel: Principiante enfocado en movilidad y progresiones asistidas.`,
          };
        }

        if (exchangeCount === 1) {
          return {
            question: `En la pistol squat hay tres factores limitantes: la flexión profunda del tobillo (para no caer hacia atrás), la fuerza del cuádriceps/glúteo, o mantener la pierna libre estirada en el aire. ¿Cuál sientes que es tu mayor freno hoy?`,
            quickReplies: [
              "Me caigo de espaldas si despego la otra pierna (falta de tobillo)",
              "No tengo suficiente fuerza para subir desde el fondo",
              "Siento calambre o debilidad al sostener la pierna extendida al frente",
            ],
            status: "EN_PROCESO",
            identifiedGap: "Restricción biomecánica específica",
            assessedLevel: "novice",
            summary: "Evaluando factor biomecánico limitante en pistol squat.",
          };
        }

        return {
          question: `Hola, soy Maestro Kaizen. Veo que deseas dominar "${cleanTopic}" en ${timeHorizonWeeks} semanas dedicando ${dailyMinutes} minutos diarios. Para calibrar tus progresiones: ¿cuántas sentadillas bilaterales profundas con peso corporal realizas con buena forma?`,
          quickReplies: [
            "Menos de 15 repeticiones / Apenas comienzo",
            "Entre 20 y 30 repeticiones profundas sin dolor",
            "Más de 30 repeticiones pero fallo completamente al pasar a una pierna",
          ],
          status: "EN_PROCESO",
          identifiedGap: "Fuerza de base y capacidad concéntrica",
          assessedLevel: "novice",
          summary: "Iniciando diagnóstico para pistol squat y calistenia.",
        };
      }

      // Caso General
      if (exchangeCount >= 2) {
        return {
          question: `¡Excelente! He completado tu diagnóstico para "${cleanTopic}". He detectado que tu principal foco debe ser la técnica atómica y la consistencia en bloques de ${dailyMinutes} minutos diarios. ¿Estás listo para generar tu Roadmap Kaizen?`,
          quickReplies: ["¡Sí, genera mi Roadmap!", "Ajustar tiempo disponible", "Repetir diagnóstico"],
          status: "DIAGNOSTICO_COMPLETO",
          identifiedGap: "Técnica y secuenciación neuromuscular de fundamentos.",
          assessedLevel: "beginner",
          summary: `Diagnóstico para "${cleanTopic}" en ${timeHorizonWeeks} semanas. Nivel evaluado: Principiante enfocado en hábitos atómicos.`,
        };
      }

      if (exchangeCount === 1) {
        return {
          question: `Entiendo tu punto de partida con "${cleanTopic}". Cuando has intentado aprender habilidades similares en el pasado, ¿dónde sueles encontrar mayor fricción?`,
          quickReplies: [
            "Falta de técnica inicial clara",
            "Mantener la disciplina diaria",
            "Miedo a cometer errores en lo complejo",
          ],
          status: "EN_PROCESO",
          identifiedGap: "Fundamentos en exploración",
          assessedLevel: "novice",
          summary: "Evaluando estilo de retención y puntos de fricción comunes.",
        };
      }

      return {
        question: `Hola, soy Maestro Kaizen. Veo que deseas dominar "${cleanTopic}" en ${timeHorizonWeeks} semanas dedicando ${dailyMinutes} minutos al día. Para diseñar tu andamiaje ideal: ¿cuál es tu experiencia previa o punto de contacto con este tema?`,
        quickReplies: [
          "Cero experiencia (Principiante absoluto)",
          "Tengo nociones básicas o teoría",
          "He practicado pero me estanqué",
        ],
        status: "EN_PROCESO",
        identifiedGap: "Punto de partida y experiencia previa",
        assessedLevel: "novice",
        summary: "Iniciando evaluación diagnóstica empática de 3 intercambios.",
      };
    };

    // Si no hay API key de Gemini configurada, retornar respuesta pedagógica estructurada
    if (!configured) {
      return NextResponse.json(getFallbackAssessment());
    }

    try {
      // Llamada real con Gemini (gemini-2.5-flash) y Structured Outputs
      const systemInstruction = `Eres Maestro Kaizen, un instructor de élite en aprendizaje acelerado y pedagogía adaptativa.
Tu objetivo es realizar una evaluación diagnóstica rápida y empática (máximo 3 intercambios en total) para identificar la brecha actual del usuario sobre el tema "${cleanTopic}".
Horizonte de tiempo del usuario: ${timeHorizonWeeks} semanas, ${dailyMinutes} minutos diarios.
Llevas actualmente ${exchangeCount} intercambios con el usuario.

INSTRUCCIONES CLAVE DE INDAGACIÓN SEGÚN EL TEMA:
- Si el tema es PALACIO MENTAL, LOCI O MEMORIA: Indaga sobre su experiencia con rutas espaciales de loci, qué tipo de información necesita recordar (listas, números densos, discursos sin notas), y su capacidad para crear imágenes visuales absurdas, exageradas y dinámicas.
- Si el tema es COCINA O CORTES: Indaga sobre su agarre del cuchillo (pinza/pinch grip), uso de mano guía en garra y cortes que le cuestan.
- Si el tema es MOVIMIENTO / CALISTENIA: Indaga sobre dorsiflexión, fuerza unilateral y movilidad articular.
- En cualquier otro tema: Haz preguntas técnicas y concretas sobre la jerga, herramientas y cuello de botella específico del dominio. NUNCA hagas preguntas genéricas o vacías.

REGLAS ESTRICTAS:
1. Haz una sola pregunta incisiva y técnica a la vez.
2. Ofrece siempre 3 opciones de respuesta rápida (quickReplies) realistas, bien diferenciadas y redactadas en primera persona.
3. Si el usuario ya respondió 2 o más veces o la información es suficiente para categorizar su nivel y brecha, emite status: 'DIAGNOSTICO_COMPLETO'.
4. Si falta información crucial, emite status: 'EN_PROCESO'.`;

      const promptText = `HISTORIAL DE LA CONVERSACIÓN:
${conversationHistory
  .map((msg: ConversationTurn) => `${msg.role === "user" ? "USUARIO" : "MAESTRO KAIZEN"}: ${msg.content}`)
  .join("\n")}

Genera la siguiente pregunta diagnóstica o el cierre con la brecha identificada para "${cleanTopic}".`;

      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: ASSESSMENT_SCHEMA,
        },
      });

      const parsedJson = JSON.parse(response.text || "{}");
      return NextResponse.json(parsedJson);
    } catch (geminiError) {
      console.warn("Gemini API no disponible o cuota agotada en assessment. Usando fallback pedagógico:", geminiError);
      return NextResponse.json(getFallbackAssessment());
    }
  } catch (error) {
    console.error("Error inesperado en /api/ai/assessment:", error);
    return NextResponse.json(
      { error: "Error al procesar la evaluación diagnóstica." },
      { status: 500 }
    );
  }
}
