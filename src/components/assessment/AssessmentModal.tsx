"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, Send, Loader2, ArrowRight, CheckCircle2, ChevronRight, Brain } from "lucide-react";
import { saveNotebookLocally } from "@/db/localDb";
import { cleanSkillTopic } from "@/lib/topicUtils";
import type { Notebook, Milestone, DifficultyLevel } from "@/types";

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotebookCreated: (notebookId: string) => void;
  userId?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssessmentModal({
  isOpen,
  onClose,
  onNotebookCreated,
  userId = "local-user",
}: AssessmentModalProps) {
  const [interest, setInterest] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [timeHorizonWeeks, setTimeHorizonWeeks] = useState(2);
  const [dailyMinutes, setDailyMinutes] = useState(30);

  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizingPlan, setIsSynthesizingPlan] = useState(false);
  const [synthesisStep, setSynthesisStep] = useState("Analizando brecha diagnóstica...");
  const [canRetry, setCanRetry] = useState(false);
  const [lastPlanArgs, setLastPlanArgs] = useState<{level?: DifficultyLevel, gap?: string}>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  const getCustomApiKey = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("mk_gemini_api_key") || "";
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSynthesizingPlan]);

  if (!isOpen) return null;

  const handleStartAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interest.trim()) return;

    setIsStarted(true);
    setIsLoading(true);

    try {
      const customKey = getCustomApiKey();
      const res = await fetch("/api/ai/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customKey ? { "x-gemini-api-key": customKey } : {}),
        },
        body: JSON.stringify({
          interest,
          timeHorizonWeeks,
          dailyMinutes,
          conversationHistory: [],
        }),
      });
      const data = await res.json();

      setMessages([{ role: "assistant", content: data.question }]);
      setQuickReplies(data.quickReplies || []);
    } catch (err) {
      console.error("Error al iniciar evaluación:", err);
      const cleanTopic = cleanSkillTopic(interest);
      setMessages([
        {
          role: "assistant",
          content: `¡Bienvenido a Maestro Kaizen! Cuéntame, ¿cuál es tu punto de partida con "${cleanTopic}"?`,
        },
      ]);
      setQuickReplies(["Principiante absoluto", "Tengo conocimientos básicos", "Me he estancado"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userAnswer: string) => {
    if (!userAnswer.trim() || isLoading || isSynthesizingPlan) return;

    const newHistory = [...messages, { role: "user" as const, content: userAnswer }];
    setMessages(newHistory);
    setInputText("");
    setIsLoading(true);

    try {
      const customKey = getCustomApiKey();
      const res = await fetch("/api/ai/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customKey ? { "x-gemini-api-key": customKey } : {}),
        },
        body: JSON.stringify({
          interest,
          timeHorizonWeeks,
          dailyMinutes,
          conversationHistory: newHistory,
        }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.question }]);

      if (data.status === "DIAGNOSTICO_COMPLETO") {
        setQuickReplies([]);
        await triggerPlanGeneration(data.assessedLevel, data.identifiedGap);
      } else {
        setQuickReplies(data.quickReplies || []);
      }
    } catch (err) {
      console.error("Error en respuesta de diagnóstico:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, no pude procesar tu respuesta. Por favor intenta enviarla de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerPlanGeneration = async (
    assessedLevel: DifficultyLevel = "beginner",
    gapAnalysis = "Práctica deliberada con andamiaje progresivo"
  ) => {
    setCanRetry(false);
    setLastPlanArgs({ level: assessedLevel, gap: gapAnalysis });
    setIsSynthesizingPlan(true);
    setSynthesisStep("Kaizen está sintetizando tus puntos de fricción...");

    setTimeout(() => {
      setSynthesisStep("Descomponiendo hitos en micro-hábitos sensoriales...");
    }, 1200);

    setTimeout(() => {
      setSynthesisStep("Creando andamiaje pedagógico y desafío Capstone...");
    }, 2500);

    try {
      const customKey = getCustomApiKey();
      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customKey ? { "x-gemini-api-key": customKey } : {}),
        },
        body: JSON.stringify({
          interest,
          timeHorizonWeeks,
          dailyMinutes,
          assessedLevel,
          gapAnalysis,
        }),
      });

      if (!res.ok) {
        throw new Error(`Plan generation failed with status ${res.status}`);
      }

      const planData = await res.json();

      if (!planData.milestones || planData.milestones.length === 0) {
        throw new Error("No milestones were generated");
      }

      const newNotebookId = `nb-${Date.now()}`;
      const cleanTopic = cleanSkillTopic(interest);

      const newMilestones: Milestone[] = (planData.milestones || []).map(
        (m: Milestone, idx: number) => {
          const newMilestoneId = `ms-${Date.now()}-${idx + 1}`;
          return {
            ...m,
            id: newMilestoneId,
            notebookId: newNotebookId,
            status: idx === 0 ? "in_progress" : "pending",
            steps: (m.steps || []).map(step => ({
              ...step,
              milestoneId: newMilestoneId
            }))
          };
        }
      );

      const newNotebook: Notebook = {
        id: newNotebookId,
        userId,
        title: planData.planTitle || `${cleanTopic}: Maestría Kaizen`,
        topic: cleanTopic,
        description: planData.overview || `Plan adaptativo acelerado de ${timeHorizonWeeks * 7} días para ${cleanTopic}.`,
        currentLevel: assessedLevel,
        targetLevel: "master",
        sources: [
          {
            id: `src-${Date.now()}`,
            notebookId: newNotebookId,
            title: `Diagnóstico Inicial: ${cleanTopic}`,
            type: "manual_note",
            content: `Diagnóstico completado: ${gapAnalysis}. Dedicación: ${dailyMinutes} min/día por ${timeHorizonWeeks} semanas.`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        milestones: newMilestones,
        isArchived: false,
        stats: {
          totalSessions: 0,
          totalMinutesSpent: 0,
          masteryScore: 0,
          completedMilestones: 0,
          totalMilestones: newMilestones.length,
          flashcardsReviewed: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveNotebookLocally(newNotebook);
      onNotebookCreated(newNotebookId);
    } catch (err: any) {
      console.error("Error al generar el plan:", err);
      setIsSynthesizingPlan(false);
      setCanRetry(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Hubo un problema al generar tu roadmap. Puedes intentarlo de nuevo.",
        },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-border bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                Diagnóstico Guiado Kaizen
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Adaptativo
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">Evaluación socrática empática en 3 pasos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: Input de Habilidad e Información Inicial */}
        {!isStarted ? (
          <form onSubmit={handleStartAssessment} className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase text-zinc-400">
                ¿Qué habilidad o tema deseas dominar?
              </label>
              <input
                type="text"
                required
                autoFocus
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="ej: Aprender Origami, Calistenia, Rust, Pensamiento Crítico..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400">
                  Horizonte de Tiempo
                </label>
                <select
                  value={timeHorizonWeeks}
                  onChange={(e) => setTimeHorizonWeeks(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>1 semana (Sprint Intensivo de 7 días)</option>
                  <option value={2}>2 semanas (Roadmap Estándar de 14 días)</option>
                  <option value={4}>4 semanas (Inmersión de 28 días)</option>
                  <option value={8}>8 semanas (Maestría Profunda de 56 días)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400">
                  Práctica Diaria
                </label>
                <select
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value={15}>15 minutos / día (Hábito Atómico)</option>
                  <option value={30}>30 minutos / día (Recomendado Kaizen)</option>
                  <option value={45}>45 minutos / día (Foco Sostenido)</option>
                  <option value={60}>60 minutos / día (Alto Rendimiento)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!interest.trim()}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2 shadow-sm"
            >
              <span>Iniciar Entrevista Diagnóstica con el Maestro</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* Step 2: Chat Fluido de Diagnóstico */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Historial de Mensajes */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 min-h-[260px] max-h-[50vh]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[88%] ${
                    msg.role === "user"
                      ? "ml-auto bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 rounded-br-none"
                      : "mr-auto bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              ))}

              {/* Animación de Carga y Síntesis */}
              {isSynthesizingPlan && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-500/30 flex flex-col items-center gap-3 text-center animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-100">
                      Diseñando tu Roadmap Kaizen Personalizado
                    </h4>
                    <p className="text-xs text-emerald-400 mt-1">{synthesisStep}</p>
                  </div>
                </div>
              )}

              {isLoading && !isSynthesizingPlan && (
                <div className="mr-auto p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>Maestro Kaizen está analizando tu respuesta...</span>
                </div>
              )}

              {canRetry && (
                <div className="flex justify-center mt-2 mb-2">
                  <button
                    onClick={() => triggerPlanGeneration(lastPlanArgs.level, lastPlanArgs.gap)}
                    className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span>🔄 Reintentar generación</span>
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Replies Buttons (1-touch on mobile) */}
            {!isSynthesizingPlan && quickReplies.length > 0 && (
              <div className="p-3 bg-zinc-950/80 border-t border-border flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase text-zinc-500">
                  Respuestas Rápidas Sugeridas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(reply)}
                      disabled={isLoading}
                      className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-xs text-zinc-300 text-left transition-colors flex items-center justify-between gap-1 disabled:opacity-50"
                    >
                      <span className="truncate">{reply}</span>
                      <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Input Field */}
            {!isSynthesizingPlan && (
              <div className="p-3 border-t border-border bg-card flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                  placeholder="O escribe tu respuesta en tus propias palabras..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
