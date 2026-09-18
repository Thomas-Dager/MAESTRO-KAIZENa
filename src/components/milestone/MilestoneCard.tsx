"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Eye,
  Search,
  ExternalLink,
  LifeBuoy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Check,
  AlertTriangle,
  Zap,
} from "lucide-react";
import CheckInDialog from "./CheckInDialog";
import PracticeTimer from "./PracticeTimer";
import type { Milestone, ScaffoldingStep } from "@/types";

interface MilestoneCardProps {
  milestone: Milestone;
  isCurrent: boolean;
  isCapstone?: boolean;
  onToggleStep: (milestoneId: string, stepId: string) => void;
  onCompleteMilestone: (milestoneId: string) => void;
  onInsertScaffolding: (milestoneId: string, step: ScaffoldingStep) => void;
  onTriggerMastery?: () => void;
  notebookTopic?: string;
}

export default function MilestoneCard({
  milestone,
  isCurrent,
  isCapstone = false,
  onToggleStep,
  onCompleteMilestone,
  onInsertScaffolding,
  onTriggerMastery,
  notebookTopic,
}: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInMode, setCheckInMode] = useState<"adecuado" | "bloqueado">("adecuado");

  const isCompleted = milestone.status === "completed" || milestone.status === "mastered";

  // Identificar pasos de escalón previo / regresión (order === 0 o con Escalón Previo en título)
  const scaffoldSteps = milestone.steps.filter(
    (s) => s.order === 0 || s.title.includes("Escalón Previo") || s.title.includes("⚡")
  );
  const regularSteps = milestone.steps.filter(
    (s) => s.order !== 0 && !s.title.includes("Escalón Previo") && !s.title.includes("⚡")
  );

  const isBlocked = scaffoldSteps.length > 0 && !isCompleted;

  const sensoryFocusText = milestone.steps[0]?.content || "";
  let sensoryFocus = "Atención plena en cada detalle del proceso.";
  if (sensoryFocusText.includes("Foco sensorial:")) {
    sensoryFocus = sensoryFocusText.split("Foco sensorial:")[1]?.trim() || sensoryFocus;
  } else if (sensoryFocusText.includes("Foco:")) {
    sensoryFocus = sensoryFocusText.split("Foco:")[1]?.trim() || sensoryFocus;
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
        isCapstone
          ? isCompleted
            ? "bg-gradient-to-b from-amber-500/10 via-zinc-950 to-emerald-500/10 border-2 border-emerald-500/60 shadow-xl shadow-emerald-500/10"
            : "bg-gradient-to-b from-amber-500/15 via-zinc-900/90 to-emerald-500/10 border-2 border-amber-500/70 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/40"
          : isBlocked
          ? "bg-amber-500/5 border-amber-500/50 shadow-md shadow-amber-500/5"
          : isCompleted
          ? "bg-zinc-950/40 border-emerald-500/30"
          : isCurrent
          ? "bg-card border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5"
          : "bg-card/40 border-border/70 opacity-75 hover:opacity-100 hover:border-zinc-700"
      }`}
    >
      {/* Header del Hito */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-start gap-3">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
              isCompleted
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : isCapstone
                ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 font-black border-amber-300 shadow-md shadow-amber-500/30"
                : isBlocked
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse"
                : isCurrent
                ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isCapstone ? (
              <Sparkles className="h-5 w-5 fill-zinc-950" />
            ) : isBlocked ? (
              <Zap className="h-4 w-4" />
            ) : (
              <span className="text-xs font-mono font-bold">{milestone.order}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                Día {milestone.order}
              </span>

              {isCapstone && (
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black shadow-sm flex items-center gap-1">
                  <span>★ Desafío Final Autónomo</span>
                </span>
              )}

              {isBlocked && !isCapstone && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>⚡ Escalón Previo Activo</span>
                </span>
              )}

              {isCompleted && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">
                  Completado
                </span>
              )}

              {isCurrent && !isCompleted && !isBlocked && !isCapstone && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  Hito de Hoy
                </span>
              )}

              <span className="text-[11px] font-mono text-zinc-500">
                {milestone.estimatedMinutes}m • {milestone.targetDifficulty}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
              {milestone.title}
            </h4>
          </div>
        </div>

        <button className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Contenido Expandible */}
      {isExpanded && (
        <div className="px-4 pb-5 sm:px-5 flex flex-col gap-4 border-t border-border/50 pt-4 animate-in fade-in duration-150">
          {/* Micro-Teoría Kaizen */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>Micro-Teoría Kaizen (El Porqué)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
              {milestone.description}
            </p>
          </div>

          {/* ⚡ Tarjeta Previa Destacada: Escalón Previo de Desbloqueo */}
          {scaffoldSteps.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-2 border-amber-500/40 shadow-lg shadow-amber-500/5 flex flex-col gap-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Zap className="h-3.5 w-3.5 fill-amber-400/20" />
                  </div>
                  <span>⚡ Escalón Previo de Desbloqueo</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-semibold">
                  Micro-Regresión Adaptativa
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {scaffoldSteps.map((scaffold) => (
                  <button
                    key={scaffold.id}
                    onClick={() => onToggleStep(milestone.id, scaffold.id)}
                    className={`w-full text-left p-3.5 rounded-xl text-xs flex items-start justify-between gap-3 border transition-all ${
                      scaffold.isCompleted
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                        : "bg-zinc-950/70 border-amber-500/30 text-zinc-200 hover:border-amber-400/50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                          scaffold.isCompleted
                            ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                            : "border-amber-500/60 bg-zinc-900"
                        }`}
                      >
                        {scaffold.isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-amber-300 text-xs">
                          {scaffold.title}
                        </span>
                        <p className="text-[11px] text-zinc-300 whitespace-pre-line leading-relaxed">
                          {scaffold.content}
                        </p>
                        {scaffold.hint && (
                          <span className="text-[10px] text-amber-400/90 italic mt-0.5">
                            💡 {scaffold.hint}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caja de Foco Sensorial / Clave Técnica */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Eye className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-mono uppercase font-bold text-emerald-400 tracking-wide">
                Foco Sensorial / Clave Técnica
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">{sensoryFocus}</p>
            </div>
          </div>

          {/* Timer de Práctica */}
          {isCurrent && milestone.status !== 'completed' && milestone.status !== 'mastered' && (
            <PracticeTimer
              milestoneId={milestone.id}
              notebookId={milestone.notebookId}
              estimatedMinutes={milestone.estimatedMinutes}
            />
          )}

          {/* Lista de Pasos Principales de Andamiaje */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-medium">
              Objetivo Principal: Pasos del Hito
            </span>

            <div className="flex flex-col gap-1.5">
              {regularSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => onToggleStep(milestone.id, step.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs flex items-start justify-between gap-3 border transition-all ${
                    step.isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                        step.isCompleted
                          ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                          : "border-zinc-600 bg-zinc-900"
                      }`}
                    >
                      {step.isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold leading-tight">{step.title}</span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line">
                        {step.content}
                      </p>
                      {step.hint && (
                        <span className="text-[10px] text-amber-400/90 italic mt-0.5">
                          💡 {step.hint}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Acciones y Recursos */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/40">
            {/* Botón directo a YouTube */}
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                `${milestone.title} tutorial paso a paso`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Buscar técnica en YouTube</span>
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>

            <div className="flex items-center gap-2">
              {/* Botón "¿Bloqueado? Pedir Escalón" */}
              {!isCompleted && (
                <button
                  onClick={() => {
                    setCheckInMode("bloqueado");
                    setIsCheckInOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <LifeBuoy className="h-3.5 w-3.5" />
                  <span>¿Bloqueado? Pedir Escalón</span>
                </button>
              )}

              {/* Botón Completar Hito / Check-in del Día */}
              {!isCompleted ? (
                <button
                  onClick={() => {
                    setCheckInMode("adecuado");
                    setIsCheckInOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Completar Hito / Check-in del Día</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 px-2 py-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Hito Consolidado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Check-in Diario */}
      <CheckInDialog
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        milestone={milestone}
        initialDifficulty={checkInMode}
        notebookTopic={notebookTopic}
        onCompleteMilestone={(id) => {
          onCompleteMilestone(id);
          if (isCapstone) {
            onTriggerMastery?.();
          }
        }}
        onInsertScaffolding={onInsertScaffolding}
      />
    </div>
  );
}
