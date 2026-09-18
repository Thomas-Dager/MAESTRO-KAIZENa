"use client";

import React, { useState } from "react";
import {
  X,
  Smile,
  Zap,
  AlertCircle,
  XCircle,
  Loader2,
  LifeBuoy,
  CheckCircle2,
} from "lucide-react";
import type { Milestone, ScaffoldingStep } from "@/types";
import { saveSessionLocally, type KaizenSessionRecord } from "@/db/localDb";

export type CheckInDifficulty = "muy_facil" | "adecuado" | "dificil" | "bloqueado";

interface CheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone;
  onCompleteMilestone: (milestoneId: string) => void;
  onInsertScaffolding: (milestoneId: string, step: ScaffoldingStep) => void;
  initialDifficulty?: CheckInDifficulty;
  notebookTopic?: string;
}

const getBlockersForTopic = (topic?: string) => {
  if (!topic) return ["No entendí la instrucción", "Me siento abrumado/a", "Falta de concentración", "El paso es demasiado grande"];
  const t = topic.toLowerCase();
  if (/(cocina|corte|culinari|chef|cuchillo)/.test(t)) {
    return ["El cuchillo patina", "Cortes desiguales", "Inseguridad con la hoja"];
  }
  if (/(pistol|sentadilla|calistenia|fuerza|flexibilidad)/.test(t)) {
    return ["Falta de equilibrio", "Dolor o molestia en articulación", "Falta de flexibilidad", "No llego al fondo"];
  }
  if (/(palacio|memoria|loci|mnemo)/.test(t)) {
    return ["Las imágenes mentales se desvanecen", "Confundo el orden de los loci", "No logro asociaciones vívidas", "Olvido rápido tras la práctica"];
  }
  if (/(programar|código|software|web|app|python|javascript)/.test(t)) {
    return ["Error de sintaxis que no entiendo", "Lógica del algoritmo confusa", "No sé cómo depurar", "Documentación abrumadora"];
  }
  return ["No entendí la instrucción", "Me siento abrumado/a", "Falta de concentración", "El paso es demasiado grande"];
};

export default function CheckInDialog({
  isOpen,
  onClose,
  milestone,
  onCompleteMilestone,
  onInsertScaffolding,
  initialDifficulty,
  notebookTopic,
}: CheckInDialogProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<CheckInDifficulty>(initialDifficulty || "adecuado");
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>([]);
  const [userComment, setUserComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<string | null>(null);
  const [showRefuerzoPrompt, setShowRefuerzoPrompt] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedDifficulty(initialDifficulty || "adecuado");
      setSelectedBlockers([]);
      setUserComment("");
      setIsSubmitting(false);
      setAnalyzingStep(null);
      setShowRefuerzoPrompt(false);
    }
  }, [isOpen, initialDifficulty]);

  if (!isOpen) return null;

  const toggleBlocker = (blocker: string) => {
    setSelectedBlockers((prev) =>
      prev.includes(blocker) ? prev.filter((b) => b !== blocker) : [...prev, blocker]
    );
  };

  const handleGenerateScaffolding = async () => {
    setAnalyzingStep("Maestro Kaizen está analizando la causa raíz...");
    setIsSubmitting(true);
    try {
      const customKey = typeof window !== "undefined"
        ? localStorage.getItem("mk_gemini_api_key") || ""
        : "";

      const res = await fetch("/api/ai/scaffolding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customKey ? { "x-gemini-api-key": customKey } : {}),
        },
        body: JSON.stringify({
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          milestoneTheory: milestone.description,
          difficulty: selectedDifficulty,
          comments: userComment || "Dificultad reportada en el check-in diario",
          blockers: selectedBlockers,
        }),
      });

      const data = await res.json();

      if (data.scaffoldingStep) {
        setAnalyzingStep("Insertando escalón previo de desbloqueo...");
        setTimeout(() => {
          onInsertScaffolding(milestone.id, data.scaffoldingStep);
          setIsSubmitting(false);
          setAnalyzingStep(null);
          onClose();
        }, 800);
        return;
      }
    } catch (err) {
      console.error("Error al generar scaffolding en check-in:", err);
    } finally {
      setIsSubmitting(false);
      setAnalyzingStep(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Always save the check-in session data to Dexie
    const sessionRecord: KaizenSessionRecord = {
      id: `ses-${Date.now()}-${milestone.id}`,
      notebookId: milestone.notebookId,
      milestoneId: milestone.id,
      difficulty: selectedDifficulty,
      blockers: selectedBlockers,
      notes: userComment,
      xpEarned: selectedDifficulty === "muy_facil" ? 120 : selectedDifficulty === "adecuado" ? 100 : 50,
      completedAt: new Date().toISOString(),
    };

    try {
      await saveSessionLocally(sessionRecord);
    } catch (err) {
      console.error("Error al guardar sesión de check-in:", err);
    }

    if (selectedDifficulty === "bloqueado") {
      await handleGenerateScaffolding();
    } else if (selectedDifficulty === "dificil") {
      setShowRefuerzoPrompt(true);
      setIsSubmitting(false);
    } else {
      // Muy fácil o Adecuado -> Completar hito
      onCompleteMilestone(milestone.id);
      setIsSubmitting(false);
      onClose();
    }
  };


  const showBlockerOptions = selectedDifficulty === "dificil" || selectedDifficulty === "bloqueado";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-zinc-950/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Día {milestone.order}
            </span>
            <h3 className="text-sm font-bold text-zinc-100 mt-1">
              Check-in Diario: {milestone.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* State of Analysis during Blocked Scaffolding */}
        {analyzingStep ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
              <LifeBuoy className="h-7 w-7 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">
                Respuesta Adaptativa Kaizen
              </h4>
              <p className="text-xs text-amber-400 mt-1">{analyzingStep}</p>
            </div>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              No posponemos tu meta: reducimos la fricción creando una micro-regresión para dominar la causa raíz.
            </p>
          </div>
        ) : showRefuerzoPrompt ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-5 animate-in fade-in">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">
                Has completado el hito con esfuerzo
              </h4>
              <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                ¿Deseas generar un escalón de refuerzo adicional para consolidar el aprendizaje, o prefieres continuar al siguiente hito?
              </p>
            </div>
            <div className="flex flex-col w-full gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleGenerateScaffolding()}
                className="w-full px-5 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Sí, generar refuerzo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onCompleteMilestone(milestone.id);
                  onClose();
                }}
                className="w-full px-5 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                <span>No, continuar al siguiente</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
            {/* 1. Selector Visual de Dificultad */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase text-zinc-400">
                ¿Cómo sentiste la sesión de hoy?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Muy Fácil */}
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("muy_facil")}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                    selectedDifficulty === "muy_facil"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <Smile className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-semibold">Muy Fácil</span>
                  <span className="text-[9px] text-zinc-500">Sin fricción</span>
                </button>

                {/* Adecuado / Buen Reto */}
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("adecuado")}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                    selectedDifficulty === "adecuado"
                      ? "bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <Zap className="h-5 w-5 text-blue-400" />
                  <span className="text-xs font-semibold">Buen Reto</span>
                  <span className="text-[9px] text-zinc-500">Zona de flujo</span>
                </button>

                {/* Difícil */}
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("dificil")}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                    selectedDifficulty === "dificil"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <span className="text-xs font-semibold">Difícil</span>
                  <span className="text-[9px] text-zinc-500">Mucho esfuerzo</span>
                </button>

                {/* Bloqueado */}
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty("bloqueado")}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                    selectedDifficulty === "bloqueado"
                      ? "bg-red-500/20 border-red-500 text-red-300 ring-1 ring-red-500/50"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-xs font-semibold">Bloqueado</span>
                  <span className="text-[9px] text-zinc-500">No pude</span>
                </button>
              </div>
            </div>

            {/* 2. Chips de Causas Comunes (si es difícil o bloqueado) */}
            {showBlockerOptions && (
              <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 animate-in fade-in">
                <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                  <LifeBuoy className="h-3.5 w-3.5" />
                  <span>¿Qué factor contribuyó al bloqueo o fricción?</span>
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {getBlockersForTopic(notebookTopic).map((blocker) => {
                    const active = selectedBlockers.includes(blocker);
                    return (
                      <button
                        key={blocker}
                        type="button"
                        onClick={() => toggleBlocker(blocker)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left border ${
                          active
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-200 font-medium"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {blocker}
                      </button>
                    );
                  })}
                </div>

                {/* 3. Campo de Texto Opcional */}
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[11px] text-zinc-400">
                    Detalle adicional (ej: sensaciones físicas, fallos específicos):
                  </label>
                  <textarea
                    rows={3}
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="ej: No tengo suficiente flexibilidad en el tobillo para bajar sin despegar el talón..."
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Botón de Envío */}
            <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-sm ${
                  selectedDifficulty === "bloqueado"
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                    : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                }`}
              >
                {selectedDifficulty === "bloqueado" ? (
                  <>
                    <LifeBuoy className="h-4 w-4" />
                    <span>Solicitar Escalón Previo y Guardar</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirmar Check-in del Día</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
