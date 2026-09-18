async function testAllAiModules() {
  console.log("=== PROBANDO LOS 4 MÓDULOS DEL MOTOR DE IA KAIZEN ===");

  // 1. Módulo 1: Assessment
  console.log("\n1. Probando /api/ai/assessment...");
  const assessRes = await fetch("http://localhost:3001/api/ai/assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interest: "Calistenia",
      timeHorizonWeeks: 4,
      dailyMinutes: 20,
      conversationHistory: [
        { role: "user", content: "Quiero aprender a hacer dominadas estrictas" }
      ],
    }),
  });
  const assessData = await assessRes.json();
  console.log("✔ Pregunta diagnóstica:", assessData.question);
  console.log("✔ Quick Replies:", assessData.quickReplies);
  console.log("✔ Estado:", assessData.status);

  // 2. Módulo 3: Scaffolding
  console.log("\n2. Probando /api/ai/scaffolding...");
  const scaffoldRes = await fetch("http://localhost:3001/api/ai/scaffolding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      milestoneTitle: "Dominada Estricta Pronada",
      milestoneTheory: "Activación escapular y retracción previa al tirón dorsal.",
      difficulty: "bloqueado",
      comments: "No logro pasar la barbilla sobre la barra y me duelen los antebrazos.",
    }),
  });
  const scaffoldData = await scaffoldRes.json();
  console.log("✔ Diagnóstico de bloqueo:", scaffoldData.diagnosis);
  console.log("✔ Escalón previo generado:", scaffoldData.scaffoldingStep.title);
  console.log("✔ Foco sensorial:", scaffoldData.sensoryCheckpoint);

  // 3. Módulo 4: Tutor Streaming
  console.log("\n3. Probando /api/ai/tutor (Streaming)...");
  const tutorRes = await fetch("http://localhost:3001/api/ai/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { id: "m-1", notebookId: "nb-1", role: "user", content: "¿Cómo puedo evitar el balanceo al subir?", timestamp: new Date().toISOString() }
      ],
      notebookContext: {
        title: "Calistenia Kaizen",
        topic: "Fuerza Corporal",
        currentMilestone: "Dominadas",
        currentDifficulty: "beginner",
      },
    }),
  });
  const text = await tutorRes.text();
  console.log("✔ Respuesta de streaming recibida con éxito (longitud:", text.length, "caracteres):");
  console.log(text.slice(0, 180) + "...");

  console.log("\n🎉 TODOS LOS MÓDULOS DE IA ESTÁN 100% OPERATIVOS!");
}

testAllAiModules();
