async function testCheckInScaffolding() {
  console.log("=== VERIFICACIÓN DE PASO 5: CHECK-IN Y ESCALÓN PREVIO ===");
  const targetUrl = "http://localhost:3001/api/ai/scaffolding";

  const checkInPayload = {
    milestoneId: "ms-squat-1",
    milestoneTitle: "Sentadilla Profunda Libre",
    milestoneTheory: "Descenso controlado manteniendo la alineación del fémur y la estabilidad pélvica.",
    difficulty: "bloqueado",
    comments: "No tengo suficiente flexibilidad en el tobillo para bajar sin despegar el talón",
    blockers: ["Falta de flexibilidad / rango de movimiento", "Falta de equilibrio o balance"],
  };

  console.log("Enviando reporte de bloqueo en check-in diario:");
  console.log(`- Hito: "${checkInPayload.milestoneTitle}"`);
  console.log(`- Feedback: "${checkInPayload.comments}"`);
  console.log(`- Bloqueos: [${checkInPayload.blockers.join(", ")}]`);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkInPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("\n✔ Respuesta HTTP 200 recibida del Motor de Scaffolding.");
    console.log("✔ Diagnóstico de la IA:", data.diagnosis);
    console.log("✔ Explicación de la regresión:", data.regressionExplanation);
    console.log("✔ Foco de validación sensorial:", data.sensoryCheckpoint);

    const step = data.scaffoldingStep;
    if (!step) {
      throw new Error("No se devolvió un objeto scaffoldingStep");
    }

    console.log(`\n⚡ Escalón Previo Generado: "${step.title}"`);
    console.log("- Orden de prioridad:", step.order, "(0 = previo al objetivo principal)");
    console.log("- Tipo de andamiaje:", step.type);
    console.log("- Pista Kaizen:", step.hint);
    console.log("\nContenido de la micro-práctica:");
    console.log(step.content);

    // Validaciones semánticas del caso de tobillo/talón
    const textCombined = (step.title + " " + step.content + " " + data.diagnosis).toLowerCase();
    const hasAnkleKey =
      textCombined.includes("tobillo") ||
      textCombined.includes("talón") ||
      textCombined.includes("cuña") ||
      textCombined.includes("sóleo") ||
      textCombined.includes("dorsiflexión");

    if (!hasAnkleKey) {
      throw new Error("El escalón previo no abordó la causa raíz de movilidad de tobillo/talón.");
    }
    console.log("\n✔ Verificación de causa raíz confirmada: La IA adaptó biomecánicamente la solución (cuña/talón/sóleo/dorsiflexión).");

    // Simular inserción en el hito
    const initialMilestone = {
      id: checkInPayload.milestoneId,
      title: checkInPayload.milestoneTitle,
      steps: [
        { id: "step-1", title: "Descenso hasta romper el paralelo", isCompleted: false },
        { id: "step-2", title: "Pausa isométrica de 2 segundos", isCompleted: false }
      ]
    };

    const updatedMilestoneSteps = [step, ...initialMilestone.steps];
    console.log(`✔ Inserción reactiva en el hito: ahora contiene ${updatedMilestoneSteps.length} pasos.`);
    console.log(`  Paso prioritario #1: "${updatedMilestoneSteps[0].title}"`);

    console.log("\n🎉 VERIFICACIÓN DEL PASO 5 COMPLETADA EXITOSAMENTE AL 100%!");
  } catch (error) {
    console.error("❌ Error en la verificación:", error.message);
    process.exit(1);
  }
}

testCheckInScaffolding();
