"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Eye,
  Search,
  ExternalLink,
  LifeBuoy,
  Sparkles,
  CheckCircle2,
  Check,
  AlertTriangle,
  Zap,
  Clock,
  Target,
} from "lucide-react";
import CheckInDialog from "./CheckInDialog";
import PracticeTimer from "./PracticeTimer";
import { generateYouTubeQueries } from "@/lib/youtubeQueryUtils";
import type { Milestone, ScaffoldingStep } from "@/types";

interface MilestoneDetailDrawerProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
  isCurrent: boolean;
  isCapstone?: boolean;
  notebookTopic?: string;
  onToggleStep: (milestoneId: string, stepId: string) => void;
  onCompleteMilestone: (milestoneId: string) => void;
  onInsertScaffolding: (milestoneId: string, step: ScaffoldingStep) => void;
  onTriggerMastery?: () => void;
}

export default function MilestoneDetailDrawer({
  milestone,
  isOpen,
  onClose,
  isCurrent,
  isCapstone = false,
  notebookTopic = "",
  onToggleStep,
  onCompleteMilestone,
  onInsertScaffolding,
  onTriggerMastery,
}: MilestoneDetailDrawerProps) {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInMode, setCheckInMode] = useState<"adecuado" | "bloqueado">("adecuado");

  // Close checkin when drawer closes
  useEffect(() => {
    if (!isOpen) setIsCheckInOpen(false);
  }, [isOpen]);

  if (!milestone) return null;

  const isCompleted = milestone.status === "completed" || milestone.status === "mastered";
  const scaffoldSteps = milestone.steps.filter(
    (s) => s.order === 0 || s.title.includes("Escalón Previo") || s.title.includes("⚡")
  );
  const regularSteps = milestone.steps.filter(
    (s) => s.order !== 0 && !s.title.includes("Escalón Previo") && !s.title.includes("⚡")
  );
  const isBlocked = scaffoldSteps.length > 0 && !isCompleted;

  // Sensory focus
  const sensoryFocusText = milestone.steps[0]?.content || "";
  let sensoryFocus = "Atención plena en cada detalle del proceso.";
  if (sensoryFocusText.includes("Foco sensorial:")) {
    sensoryFocus = sensoryFocusText.split("Foco sensorial:")[1]?.trim() || sensoryFocus;
  } else if (sensoryFocusText.includes("Foco:")) {
    sensoryFocus = sensoryFocusText.split("Foco:")[1]?.trim() || sensoryFocus;
  }

  // YouTube queries
  const ytQueries = generateYouTubeQueries(milestone.title, notebookTopic);

  const completedSteps = regularSteps.filter(s => s.isCompleted).length;
  const stepProgress = regularSteps.length > 0 ? Math.round((completedSteps / regularSteps.length) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-5 border-b border-zinc-800 shrink-0 ${
          isCapstone ? 'bg-gradient-to-r from-amber-500/10 to-transparent' :
          isCurrent ? 'bg-gradient-to-r from-emerald-500/10 to-transparent' : ''
        }`}>
          <div className="flex items-start gap-3">
            {/* Day number badge */}
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border font-black text-lg ${
              isCompleted
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : isCapstone
                ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 border-amber-300 shadow-md"
                : isBlocked
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : isCurrent
                ? "bg-emerald-50 text-zinc-950 border-emerald-400"
                : "bg-zinc-900 border-zinc-700 text-zinc-400"
            }`}>
              {isCompleted ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : isCapstone ? (
                <Sparkles className="h-6 w-6 fill-zinc-950" />
              ) : (
                <span>{milestone.order}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Día {milestone.order}
                </span>
                {isCapstone && (
                  <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black">
                    ★ Proyecto Final
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">
                    Completado
                  </span>
                )}
                {isCurrent && !isCompleted && !isCapstone && (
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                    Hito de Hoy
                  </span>
                )}
                {isBlocked && (
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Escalón Activo
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-zinc-100 leading-snug">{milestone.title}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                <span>{milestone.estimatedMinutes} min · {milestone.targetDifficulty}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0 mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* 🎯 Clave Técnica - PROMINENT at top */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono uppercase font-bold text-emerald-400 tracking-wide">
                🎯 Clave Técnica del Día
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed font-medium">{sensoryFocus}</p>
            </div>
          </div>

          {/* Micro-Teoría */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>El Porqué — Micro-Teoría Kaizen</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {milestone.description}
            </p>
          </div>

          {/* Escalón Previo (scaffolding) */}
          {scaffoldSteps.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-2 border-amber-500/40 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Zap className="h-4 w-4 fill-amber-400/20" />
                <span>⚡ Escalón Previo de Desbloqueo</span>
              </div>
              {scaffoldSteps.map((scaffold) => (
                <button
                  key={scaffold.id}
                  onClick={() => onToggleStep(milestone.id, scaffold.id)}
                  className={`w-full text-left p-3.5 rounded-xl flex items-start gap-3 border transition-all ${
                    scaffold.isCompleted
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                      : "bg-zinc-950/70 border-amber-500/30 text-zinc-200 hover:border-amber-400/50"
                  }`}
                >
                  <div className={`h-5 w-5 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                    scaffold.isCompleted
                      ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                      : "border-amber-500/60 bg-zinc-900"
                  }`}>
                    {scaffold.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-amber-300 text-sm">{scaffold.title}</span>
                    <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">{scaffold.content}</p>
                    {scaffold.hint && (
                      <span className="text-xs text-amber-400/90 italic mt-0.5">💡 {scaffold.hint}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Practice Timer */}
          {isCurrent && milestone.status !== 'completed' && milestone.status !== 'mastered' && (
            <PracticeTimer
              milestoneId={milestone.id}
              notebookId={milestone.notebookId}
              estimatedMinutes={milestone.estimatedMinutes}
            />
          )}

          {/* Steps */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-300">Objetivos del Día</span>
              </div>
              {regularSteps.length > 0 && (
                <span className="text-xs font-mono text-zinc-500">{completedSteps}/{regularSteps.length} completados</span>
              )}
            </div>

            {/* Step progress bar */}
            {regularSteps.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 mt-1">
              {regularSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => onToggleStep(milestone.id, step.id)}
                  className={`w-full text-left p-4 rounded-xl flex items-start gap-3 border transition-all ${
                    step.isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <div className={`h-5 w-5 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                    step.isCompleted
                      ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                      : "border-zinc-600 bg-zinc-900"
                  }`}>
                    {step.isCompleted
                      ? <Check className="h-3.5 w-3.5 stroke-[3]" />
                      : <span className="text-xs font-mono text-zinc-500">{index + 1}</span>
                    }
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-zinc-100 leading-tight">
                      Objetivo: {step.title}
                    </span>
                    <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                      {step.content}
                    </p>
                    {step.hint && (
                      <span className="text-xs text-amber-400/90 italic mt-0.5">💡 {step.hint}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* YouTube Links */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase text-zinc-500 font-medium">Recursos en YouTube</span>
            <div className="flex flex-col gap-1.5">
              {ytQueries.map((q, i) => (
                <a
                  key={i}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q.query)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">{q.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 ml-auto shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 flex items-center gap-2 shrink-0 bg-zinc-950">
          {!isCompleted ? (
            <>
              <button
                onClick={() => {
                  setCheckInMode("bloqueado");
                  setIsCheckInOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Estoy Bloqueado</span>
              </button>
              <button
                onClick={() => {
                  setCheckInMode("adecuado");
                  setIsCheckInOpen(true);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Completar Hito / Check-in</span>
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-emerald-400 py-1">
              <CheckCircle2 className="h-5 w-5" />
              <span>Hito Consolidado ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* CheckIn Dialog */}
      <CheckInDialog
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        milestone={milestone}
        initialDifficulty={checkInMode}
        notebookTopic={notebookTopic}
        onCompleteMilestone={(id) => {
          onCompleteMilestone(id);
          onClose();
          if (isCapstone) onTriggerMastery?.();
        }}
        onInsertScaffolding={onInsertScaffolding}
      />
    </>
  );
}
