"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  X,
  Award,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Zap,
  Calendar,
  Layers,
} from "lucide-react";
import type { Notebook } from "@/types";

interface MasteryCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
}

export default function MasteryCertificateModal({
  isOpen,
  onClose,
  notebook,
}: MasteryCertificateModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Disparo triunfal de confeti visual
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#f59e0b", "#34d399", "#fbbf24"],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#f59e0b", "#34d399", "#fbbf24"],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalMilestones = notebook.milestones.length;
  const completedMilestones = notebook.milestones.filter(
    (m) => m.status === "completed" || m.status === "mastered"
  ).length;

  // Extraer escalones previos superados
  const overcomeScaffolds = notebook.milestones
    .flatMap((m) => m.steps)
    .filter((s) => s.order === 0 || s.title.includes("Escalón Previo") || s.title.includes("⚡"));

  // Generar contenido Markdown descargable
  const handleDownloadMarkdown = () => {
    const mdContent = `# FICHA DE MAESTRÍA KAIZEN
## Proyecto: ${notebook.title}
- **Especialidad / Tema:** ${notebook.topic}
- **Nivel de Maestría:** ${notebook.currentLevel.toUpperCase()}
- **Fecha de Inicio:** ${new Date(notebook.createdAt).toLocaleDateString()}
- **Fecha de Culminación:** ${new Date().toLocaleDateString()}
- **Hitos Completados:** ${completedMilestones} de ${totalMilestones}

---

### MICRO-TEORÍAS DOMINADAS
${notebook.milestones
  .map(
    (m) => `#### Día ${m.order}: ${m.title}
> ${m.description}
`
  )
  .join("\n")}

---

### ESCALONES PREVIOS Y REGRESIONES SUPERADAS (${overcomeScaffolds.length})
${
  overcomeScaffolds.length > 0
    ? overcomeScaffolds
        .map(
          (s, i) => `**${i + 1}. ${s.title}**
${s.content}
`
        )
        .join("\n")
    : "_No se requirieron escalones previos durante este plan._"
}

---

### BITÁCORA Y NOTAS DEL APRENDIZ
${
  notebook.sources.length > 0
    ? notebook.sources
        .map(
          (src) => `#### 📝 ${src.title}
${src.content}
`
        )
        .join("\n")
    : "_Sin notas adicionales registradas._"
}

---
*Certificado emitido por Maestro Kaizen PWA - Aprendizaje Adaptativo Acelerado.*
`;

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ficha-Maestria-Kaizen-${notebook.title.replace(/\s+/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                Ficha de Maestría Kaizen
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold">
                  Completado
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Cierre triunfal y resumen de logros acumulados</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Certificate Printable Body */}
        <div id="mastery-certificate" className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col gap-6">
          {/* Hero Celebration Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-emerald-500/10 border border-amber-500/30 flex flex-col items-center text-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-zinc-950 shadow-xl shadow-amber-500/20">
              <Award className="h-8 w-8 stroke-[2.5]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
              ¡Has Conquistado el Desafío Capstone!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
              Has culminado exitosamente tu hoja de ruta en <strong>{notebook.title}</strong>, aplicando el principio Kaizen de mejora incremental atómica y andamiaje deliberado.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{completedMilestones} Hitos Dominados</span>
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span>{overcomeScaffolds.length} Escalones Superados</span>
              </span>
            </div>
          </div>

          {/* Micro-teorías Dominadas */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>Micro-Teorías Fundacionales Consolidadas</span>
            </h4>
            <div className="flex flex-col gap-2">
              {notebook.milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs flex flex-col gap-1"
                >
                  <span className="font-semibold text-zinc-200">
                    Día {m.order}: {m.title}
                  </span>
                  <p className="text-zinc-400 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Escalones Previos de Desbloqueo */}
          {overcomeScaffolds.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span>Escalones Previos Superados (Micro-Regresiones)</span>
              </h4>
              <div className="flex flex-col gap-2">
                {overcomeScaffolds.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col gap-1 text-amber-200"
                  >
                    <span className="font-bold text-amber-300">{s.title}</span>
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{s.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bitácora y Notas del Usuario */}
          {notebook.sources.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span>Notas Personales y Descubrimientos Registrados</span>
              </h4>
              <div className="flex flex-col gap-2">
                {notebook.sources.map((src) => (
                  <div
                    key={src.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs flex flex-col gap-1"
                  >
                    <span className="font-bold text-zinc-300">{src.title}</span>
                    <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{src.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-border bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono text-zinc-500">
            Completado el {new Date().toLocaleDateString()}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Ficha (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
