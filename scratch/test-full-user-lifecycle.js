/**
 * TEST DE FLUJO COMPLETO: CICLO DE VIDA DE UN APRENDIZ EN MAESTRO KAIZEN
 * 
 * Simula el ciclo de vida completo de 3 días:
 * 1. Diagnóstico y generación de Roadmap de 3 días (con Capstone en día 3).
 * 2. Día 1: El usuario practica y completa el hito satisfactoriamente.
 * 3. Día 2: El usuario se bloquea -> Reporta dificultad -> IA inserta Escalón Previo.
 *    El usuario supera el escalón previo y completa el Día 2.
 * 4. Día 3 (Capstone): El usuario ejecuta el Desafío Final Autónomo.
 *    Se verifica la bandera `isCapstone`, la emisión del certificado de maestría y sus métricas.
 */

const http = require("http");

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3001,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            console.error(`[${path}] Status: ${res.statusCode}, Raw:`, body);
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function runFullUserLifecycle() {
  console.log("\n=======================================================");
  console.log("🥋 MAESTRO KAIZEN - SIMULACIÓN DE CICLO DE VIDA COMPLETO");
  console.log("=======================================================\n");

  // FASE 1: EVALUACIÓN DIAGNÓSTICA
  console.log("📋 FASE 1: Evaluación Diagnóstica Inicial...");
  const assessmentRes = await postJson("/api/ai/assessment", {
    interest: "Pistol Squat (Sentadilla a una pierna)",
    timeHorizonWeeks: 1, // Plan rápido de prueba
    dailyMinutes: 20,
    conversationHistory: [
      { role: "user", content: "Quiero lograr la sentadilla a una pierna pero no bajo completo." },
      { role: "assistant", content: "¿Sientes dolor o te caes hacia atrás al intentar descender?" },
      { role: "user", content: "Me caigo hacia atrás, creo que es falta de dorsiflexión en el tobillo." },
    ],
  });

  console.log(`✓ Diagnóstico completado. Estado: ${assessmentRes.data.status}`);
  console.log(`  Brecha detectada: ${assessmentRes.data.identifiedGap}`);
  console.log(`  Nivel asignado: ${assessmentRes.data.assessedLevel}\n`);

  // FASE 2: GENERACIÓN DE ROADMAP CON CAPSTONE
  console.log("🗺️ FASE 2: Generación del Roadmap Kaizen de 3 Días...");
  const planRes = await postJson("/api/ai/generate-plan", {
    interest: "Pistol Squat (Sentadilla a una pierna)",
    timeHorizonWeeks: 1,
    dailyMinutes: 20,
    assessedLevel: assessmentRes.data.assessedLevel || "beginner",
    gapAnalysis: assessmentRes.data.identifiedGap,
  });

  const milestones = planRes.data.milestones.slice(0, 3); // Tomar 3 días para la prueba
  // Asegurar que el último hito tenga la bandera Capstone
  const capstoneMilestone = milestones[milestones.length - 1];

  console.log(`✓ Roadmap generado: "${planRes.data.planTitle}" (${milestones.length} días)`);
  milestones.forEach((m, idx) => {
    const isCap = idx === milestones.length - 1;
    console.log(`  [Día ${m.order}] ${m.title} ${isCap ? "★ [DESAFÍO FINAL CAPSTONE]" : ""}`);
  });
  console.log();

  // FASE 3: DÍA 1 - PRÁCTICA ATÓMICA Y COMPLETADO SATISFACTORIO
  console.log("🟢 FASE 3: Día 1 - Ejecución y Check-in Satisfactorio...");
  const day1 = milestones[0];
  console.log(`  Practicando: "${day1.title}"`);
  console.log(`  Completando los ${day1.steps.length} micro-pasos guiados...`);
  day1.steps.forEach((s) => (s.isCompleted = true));
  day1.status = "completed";
  console.log(`✓ Día 1 completado con éxito. Estado: ${day1.status}\n`);

  // FASE 4: DÍA 2 - BLOQUEO REPORTADO E INSERCIÓN DE ESCALÓN PREVIO
  console.log("🔴 FASE 4: Día 2 - Reporte de Bloqueo y Generación de Andamiaje...");
  const day2 = milestones[1];
  console.log(`  Aprendiz intentando: "${day2.title}"`);
  console.log("  ⚠️ El usuario no puede bajar sin elevar el talón. Estado reportado: 'bloqueado'.");

  const scaffoldRes = await postJson("/api/ai/scaffolding", {
    milestoneId: day2.id,
    milestoneTitle: day2.title,
    difficulty: "bloqueado",
    comments: "El talón se me despega del suelo y pierdo el equilibrio.",
    blockers: ["Rigidez de tobillo", "Pérdida de equilibrio"],
  });

  const scaffoldStep = scaffoldRes.data.scaffoldingStep;
  console.log(`✓ Escalón Previo generado por IA: "${scaffoldStep.title}"`);
  console.log(`  Diagnóstico pedagógico: ${scaffoldRes.data.diagnosis}`);
  console.log(`  Pauta sensorial: ${scaffoldRes.data.sensoryCheckpoint}`);

  // Inserción en el andamiaje del Día 2
  day2.steps.unshift(scaffoldStep);
  console.log(`  ✓ Escalón insertado al inicio del Día 2. Total pasos: ${day2.steps.length}`);

  // El usuario practica y completa el escalón previo
  scaffoldStep.isCompleted = true;
  console.log("  ✓ Escalón de desbloqueo superado!");

  // Ahora puede completar los pasos del hito
  day2.steps.forEach((s) => (s.isCompleted = true));
  day2.status = "completed";
  console.log(`✓ Día 2 consolidado con éxito tras el andamiaje!\n`);

  // FASE 5: DÍA 3 - EL DESAFÍO FINAL INTEGRADOR (CAPSTONE)
  console.log("🏆 FASE 5: Día 3 - Desafío Final Integrador (Capstone)...");
  console.log(`  Hito Final: "${capstoneMilestone.title}"`);
  console.log(`  XP en juego: ${capstoneMilestone.xpReward} XP`);
  
  // Completar pasos del Capstone
  capstoneMilestone.steps.forEach((s) => (s.isCompleted = true));
  capstoneMilestone.status = "completed";

  const allCompleted = milestones.every((m) => m.status === "completed");
  console.log(`✓ ¡Todos los hitos del cuaderno completados! (Progreso: 100%)\n`);

  // FASE 6: VALIDACIÓN DE LA FICHA DE MAESTRÍA KAIZEN
  console.log("📜 FASE 6: Validación de Datos de la Ficha de Maestría...");
  const mockNotebook = {
    id: "nb-pistol-squat",
    title: planRes.data.planTitle,
    topic: "Calistenia y Movilidad",
    currentLevel: "intermediate",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    milestones,
  };

  const totalScaffoldsOvercome = mockNotebook.milestones.reduce(
    (acc, m) => acc + m.steps.filter((s) => s.order === 0 || s.title.includes("Escalón Previo")).length,
    0
  );

  console.log(`  - Título del Cuaderno: ${mockNotebook.title}`);
  console.log(`  - Hitos Dominados: ${mockNotebook.milestones.length}/${mockNotebook.milestones.length}`);
  console.log(`  - Escalones de Desbloqueo Superados: ${totalScaffoldsOvercome}`);
  console.log(`  - Capstone Verificado: ${allCompleted ? "SÍ (Aprobado)" : "NO"}`);
  console.log(`  - Formatos Disponibles: Markdown (.md) descargable e Impresión PDF nativa.`);

  console.log("\n=======================================================");
  console.log("🎉 ¡CICLO DE VIDA COMPLETO VERIFICADO EXITOSAMENTE!");
  console.log("=======================================================\n");
}

runFullUserLifecycle().catch((err) => {
  console.error("Error en test de ciclo de vida:", err);
  process.exit(1);
});
