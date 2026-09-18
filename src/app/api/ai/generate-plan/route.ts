import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL, Type } from "@/lib/gemini";
import { cleanSkillTopic, generateExpertCurriculum } from "@/lib/topicUtils";
import type { Milestone, DifficultyLevel } from "@/types";

export const dynamic = "force-dynamic";

export interface GeneratedMilestoneDto {
  dayNumber: number;
  title: string;
  theory: string;
  stepByStep: string[];
  sensoryKey: string;
  searchQuery: string;
  isCapstone: boolean;
  targetDifficulty: DifficultyLevel;
  estimatedMinutes: number;
}

const PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    planTitle: { 
      type: Type.STRING, 
      description: "Título formal, conciso y profesional del plan (máximo 4 a 6 palabras, ej: 'Cortes Culinarios de Precisión', 'Guitarra Clásica: Técnica Fundamental'). NUNCA usar frases coloquiales como 'Quiero aprender...'." 
    },
    overview: { 
      type: Type.STRING, 
      description: "Resumen metodológico y pedagógico de alto valor para el estudiante." 
    },
    totalDays: { type: Type.INTEGER, description: "Total de días planificados (ej: 7 o 14 días)." },
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.INTEGER, description: "Número del día progresivo (1 a N)." },
          title: { 
            type: Type.STRING, 
            description: "Título técnico, específico y motivador del hito diario (ej: 'Seguridad y Agarre en Pinza (Pinch Grip)', 'Corte Batonnet y Juliana Fina'). PROHIBIDO usar 'Fundamento Atómico #X'." 
          },
          theory: { 
            type: Type.STRING, 
            description: "Micro-teoría fundacional concisa explicando el porqué biomecánico o técnico (2 párrafos)." 
          },
          stepByStep: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Secuencia ordenada de 3 a 4 micro-pasos prácticos ejecutables con instrucciones concretas.",
          },
          sensoryKey: {
            type: Type.STRING,
            description: "Foco sensorial o técnico exacto (ej: 'Sentir el plano de la hoja descansando sobre los nudillos guía sin presionar').",
          },
          searchQuery: {
            type: Type.STRING,
            description: "Query de búsqueda altamente optimizada para video tutoriales en YouTube o recursos web.",
          },
          isCapstone: {
            type: Type.BOOLEAN,
            description: "true SOLAMENTE para el último hito integrador (Desafío Final), false en los demás.",
          },
          targetDifficulty: {
            type: Type.STRING,
            description: "Nivel de dificultad: 'novice', 'beginner', 'intermediate', 'advanced', o 'master'.",
          },
          estimatedMinutes: {
            type: Type.INTEGER,
            description: "Minutos de práctica diaria recomendados (ej: 25 a 45).",
          },
        },
        required: [
          "dayNumber",
          "title",
          "theory",
          "stepByStep",
          "sensoryKey",
          "searchQuery",
          "isCapstone",
          "targetDifficulty",
          "estimatedMinutes",
        ],
      },
    },
  },
  required: ["planTitle", "overview", "totalDays", "milestones"],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customApiKey = req.headers.get("x-gemini-api-key") || body.customApiKey;
    const { aiClient, configured } = getGeminiClient(customApiKey);

    // Sanitización y normalización del tema
    const rawInterest = typeof body.interest === "string" && body.interest.trim()
      ? body.interest.trim().slice(0, 150)
      : "Cortes Culinarios Profesionales";
    const cleanTopic = cleanSkillTopic(rawInterest);

    const timeHorizonWeeks = Math.min(12, Math.max(1, Number(body.timeHorizonWeeks) || 2));
    const dailyMinutes = Math.min(180, Math.max(10, Number(body.dailyMinutes) || 30));
    const assessedLevel = typeof body.assessedLevel === "string" ? body.assessedLevel.slice(0, 30) : "beginner";
    const gapAnalysis = typeof body.gapAnalysis === "string" 
      ? body.gapAnalysis.trim().slice(0, 300) 
      : "Práctica deliberada con andamiaje progresivo.";

    const totalDays = Math.max(3, timeHorizonWeeks * 7);

    // Motor de currículo experto (utilizado si no hay API key o si Gemini falla)
    const getExpertFallback = () => {
      const expertPlan = generateExpertCurriculum(
        rawInterest,
        totalDays,
        dailyMinutes,
        assessedLevel,
        gapAnalysis
      );

      const mappedMilestones: Milestone[] = expertPlan.rawMilestones.map((m, index) => {
        const isLast = index === expertPlan.rawMilestones.length - 1;
        return {
          id: `ms-day-${m.dayNumber}`,
          notebookId: "temp-notebook",
          order: m.dayNumber,
          title: m.title,
          description: m.theory,
          estimatedMinutes: m.estimatedMinutes,
          targetDifficulty: m.targetDifficulty,
          status: "pending",
          xpReward: isLast ? 500 : 100,
          steps: m.stepByStep.map((step, sIndex) => ({
            id: `step-${m.dayNumber}-${sIndex + 1}`,
            milestoneId: `ms-day-${m.dayNumber}`,
            order: sIndex + 1,
            type: sIndex === 0 ? "concept" : sIndex === 1 ? "guided_example" : "challenge",
            title: step,
            content: `${step}. Foco sensorial: ${m.sensoryKey}`,
            isCompleted: false,
          })),
        };
      });

      return {
        planTitle: expertPlan.planTitle,
        overview: expertPlan.overview,
        totalDays,
        rawMilestones: expertPlan.rawMilestones,
        milestones: mappedMilestones,
      };
    };

    // Si no está configurada la API key, devolver el currículo experto específico
    if (!configured) {
      return NextResponse.json(getExpertFallback());
    }

    try {
      // Llamada real a Gemini 2.0 Flash con Structured Output Schema
      const systemInstruction = `Eres Maestro Kaizen, maestro instructor y diseñador pedagógico de élite en aprendizaje acelerado.
Tu tarea es diseñar un Roadmap diario completo e ininterrumpido de exactamente ${totalDays} días para el estudiante.
DATOS DEL APRENDIZ:
- Solicitud textual del aprendiz: "${rawInterest}"
- Tema normalizado / dominio: "${cleanTopic}"
- Nivel evaluado: "${assessedLevel}"
- Tiempo diario disponible: ${dailyMinutes} minutos
- Horizonte temporal: ${timeHorizonWeeks} semanas (${totalDays} días en total)
- Brecha detectada en diagnóstico: "${gapAnalysis}"

REGLAS PEDAGÓGICAS ESTRICTAS:
1. DESTILACIÓN DEL TÍTULO: El planTitle DEBE ser un título profesional, conciso y formal (ej: 'Palacio Mental y Mnemotecnia Aplicada', 'Cortes Culinarios de Precisión y Técnicas de Cuchillo', o 'Pistol Squat: Fuerza y Movilidad Unilateral'). NUNCA repitas frases coloquiales como 'Quiero aprender...', 'A usar...', etc.
2. PROHIBICIÓN ABSOLUTA DE CAPSTONES DUPLICADOS: El hito número ${totalDays} (el último) es el ÚNICO que tiene 'isCapstone': true y lleva '★ Desafío Final Autónomo' en su título. ESTÁ TERMINANTEMENTE PROHIBIDO usar la palabra 'Capstone' o 'Desafío Final' en los días 1 a ${totalDays - 1}. Cada día intermedio debe ser una técnica, ejercicio o habilidad progresiva y distinta.
3. DOMINIO DE PALACIO MENTAL Y MEMORIA: Si el tema es sobre palacio mental o memoria, estructura un plan real de mnemotecnia técnica (Cartografía de rutas de loci sin cruces, Anclaje de objetos fijos, Principio VIVID de imágenes absurdas, Metáforas visuales para conceptos abstractos, Método de enlace en cadena, Sistema Mayor fonético para números, Memorización de discursos y oratoria sin notas, Velocidad de recuperación, y culminar en el Día ${totalDays} con el Desafío Final de memorizar autónomamente 50 datos o discurso complejo).
4. TÍTULOS DE HITOS TÉCNICOS Y ESPECÍFICOS: Cada hito diario debe nombrar la técnica, ejercicio o fundamento exacto de la disciplina (ej: 'Día 1: Cartografía del Hogar y Regla de No-Cruce', 'Día 2: Anclaje de 10 Micro-Loci Fijos'). ESTÁ TOTALMENTE PROHIBIDO generar títulos genéricos como 'Fundamento Atómico #X de [tema]'.
5. MICRO-TEORÍA REAL: Explica la biomecánica, geometría, ciencia cognitiva o principio técnico concreto del día.
6. FOCO SENSORIAL TÉCNICO: Describe la sensación táctil, auditiva, visual o propioceptiva que valida la buena técnica.`;

      const promptText = `Diseña el plan de maestría Kaizen de ${totalDays} días para: "${cleanTopic}". Asegura técnicas reales y nombres profesionales en cada día. Recuerda: SÓLO el día ${totalDays} es el Desafío Final Capstone.`;

      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: PLAN_SCHEMA,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const rawMilestones: GeneratedMilestoneDto[] = parsed.milestones || [];

      if (!rawMilestones.length) {
        return NextResponse.json(getExpertFallback());
      }

      // Sanitización defensiva estricta de Capstones e Hitos
      const sanitizedMilestones: GeneratedMilestoneDto[] = rawMilestones.map((m, index) => {
        const day = m.dayNumber || index + 1;
        const isLast = index === rawMilestones.length - 1 || day === totalDays;

        if (isLast) {
          const capstoneTitle = m.title.startsWith("★ Desafío Final")
            ? m.title
            : `★ Desafío Final Autónomo: ${m.title.replace(/^Día\s+\d+:\s*/i, "")}`;
          return {
            ...m,
            dayNumber: day,
            title: capstoneTitle,
            isCapstone: true,
          };
        }

        // Para cualquier día que no sea el último: eliminar etiquetas de Capstone si el modelo las incluyó por error
        let cleanTitle = m.title
          .replace(/^★\s*Desafío\s+Final[^:]*:\s*/i, "")
          .replace(/\bcapstone\b/gi, "")
          .trim();
        if (!cleanTitle.startsWith(`Día ${day}:`)) {
          cleanTitle = `Día ${day}: ${cleanTitle.replace(/^Día\s+\d+:\s*/i, "")}`;
        }

        return {
          ...m,
          dayNumber: day,
          title: cleanTitle,
          isCapstone: false,
        };
      });

      // Mapear a la interfaz Milestone[] del sistema
      const mappedMilestones: Milestone[] = sanitizedMilestones.map((m, index) => {
        const isLast = m.isCapstone || index === sanitizedMilestones.length - 1;
        return {
          id: `ms-day-${m.dayNumber}`,
          notebookId: "temp-notebook",
          order: m.dayNumber,
          title: m.title,
          description: m.theory,
          estimatedMinutes: m.estimatedMinutes || dailyMinutes,
          targetDifficulty: m.targetDifficulty || (isLast ? "advanced" : "beginner"),
          status: "pending",
          xpReward: isLast ? 500 : 100,
          steps: (m.stepByStep || []).map((step, sIndex) => ({
            id: `step-${m.dayNumber}-${sIndex + 1}`,
            milestoneId: `ms-day-${m.dayNumber}`,
            order: sIndex + 1,
            type: sIndex === 0 ? "concept" : sIndex === 1 ? "guided_example" : "challenge",
            title: step,
            content: `${step}. ${m.sensoryKey ? `Foco sensorial: ${m.sensoryKey}` : ""}`,
            isCompleted: false,
          })),
        };
      });

      return NextResponse.json({
        planTitle: cleanSkillTopic(parsed.planTitle || `${cleanTopic}: Maestría Kaizen`),
        overview: parsed.overview || "",
        totalDays: parsed.totalDays || sanitizedMilestones.length,
        rawMilestones: sanitizedMilestones,
        milestones: mappedMilestones,
      });
    } catch (geminiError) {
      console.warn("Gemini API no disponible o cuota agotada en generate-plan. Usando currículo experto:", geminiError);
      return NextResponse.json(getExpertFallback());
    }
  } catch (error) {
    console.error("Error inesperado en /api/ai/generate-plan:", error);
    return NextResponse.json(
      { error: "Error al generar el plan de aprendizaje acelerado." },
      { status: 500 }
    );
  }
}
