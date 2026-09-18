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

async function runCulinaryTest() {
  console.log("\n=======================================================");
  console.log("🔪 TEST: CORTES CULINARIOS Y FILTRADO INTELIGENTE");
  console.log("=======================================================\n");

  const userInput = "Quiero aprender a hacer cortes culinarios a nivel profesional";

  console.log(`Entrada del usuario: "${userInput}"\n`);

  console.log("1. Probando Evaluación Diagnóstica Inicial...");
  const assessRes = await postJson("/api/ai/assessment", {
    interest: userInput,
    timeHorizonWeeks: 1,
    dailyMinutes: 30,
    conversationHistory: [],
  });

  console.log("Pregunta diagnóstica generada:");
  console.log(`"${assessRes.data.question}"`);
  console.log("Opciones rápidas:", assessRes.data.quickReplies);
  console.log();

  console.log("2. Probando Generación del Roadmap Kaizen...");
  const planRes = await postJson("/api/ai/generate-plan", {
    interest: userInput,
    timeHorizonWeeks: 1,
    dailyMinutes: 30,
    assessedLevel: "beginner",
    gapAnalysis: "Técnica de corte, seguridad en tabla y uniformidad geométrica",
  });

  console.log(`\n✓ Título del Plan: "${planRes.data.planTitle}"`);
  console.log(`✓ Resumen: "${planRes.data.overview}"\n`);

  console.log("Hitos Generados:");
  planRes.data.milestones.forEach((m) => {
    console.log(`\n--- [Día ${m.order}] ${m.title} (${m.estimatedMinutes}m) ---`);
    console.log(`  Teoría: ${m.description.slice(0, 120)}...`);
    console.log(`  Pasos:`);
    m.steps.forEach((s) => console.log(`    - ${s.title}`));
  });

  // Validaciones
  const hasColloquialInTitle = planRes.data.planTitle.toLowerCase().includes("quiero aprender");
  const hasGenericAtomicTitle = planRes.data.milestones.some((m) => m.title.includes("Fundamento Atómico"));
  const hasGenericDummyStep = planRes.data.milestones.some((m) => 
    m.steps.some((s) => s.title.includes("Delimitar el espacio de práctica"))
  );

  console.log("\n=======================================================");
  console.log("VALIDACIONES DE CALIDAD:");
  console.log(`- ¿Título libre de frases coloquiales ("Quiero aprender..."): ${!hasColloquialInTitle ? "SÍ (Aprobado)" : "FALLÓ"}`);
  console.log(`- ¿Sin títulos genéricos 'Fundamento Atómico #X': ${!hasGenericAtomicTitle ? "SÍ (Aprobado)" : "FALLÓ"}`);
  console.log(`- ¿Sin pasos vacíos 'Delimitar el espacio de práctica': ${!hasGenericDummyStep ? "SÍ (Aprobado)" : "FALLÓ"}`);

  if (hasColloquialInTitle || hasGenericAtomicTitle || hasGenericDummyStep) {
    console.error("\n❌ ERROR: Alguna validación falló.");
    process.exit(1);
  } else {
    console.log("\n🎉 ¡PLAN CULINARIO PERFECTO Y PROFESIONAL!");
    console.log("=======================================================\n");
  }
}

runCulinaryTest().catch((err) => {
  console.error("Error en test culinario:", err);
  process.exit(1);
});
