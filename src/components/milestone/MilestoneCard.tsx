"use client";

import React from "react";
import {
  CheckCircle2,
  Sparkles,
  Zap,
  AlertTriangle,
  Clock,
  Flame,
} from "lucide-react";
import type { Milestone } from "@/types";

interface MilestoneCardProps {
  milestone: Milestone;
  isCurrent: boolean;
  isCapstone?: boolean;
  onClick: () => void;
}

export default function MilestoneCard({
  milestone,
  isCurrent,
  isCapstone = false,
  onClick,
}: MilestoneCardProps) {
  const isCompleted = milestone.status === "completed" || milestone.status === "mastered";
  const scaffoldSteps = milestone.steps.filter(
    (s) => s.order === 0 || s.title.includes("Escalón Previo") || s.title.includes("⚡")
  );
  const regularSteps = milestone.steps.filter(
    (s) => s.order !== 0 && !s.title.includes("Escalón Previo") && !s.title.includes("⚡")
  );
  const isBlocked = scaffoldSteps.length > 0 && !isCompleted;
  const completedSteps = regularSteps.filter((s) => s.isCompleted).length;
  const stepProgress =
    regularSteps.length > 0
      ? Math.round((completedSteps / regularSteps.length) * 100)
      : isCompleted
      ? 100
      : 0;

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isCapstone
          ? isCompleted
            ? "bg-gradient-to-b from-amber-500/10 to-emerald-500/5 border-2 border-emerald-500/50 shadow-lg"
            : "bg-gradient-to-b from-amber-500/15 to-zinc-900 border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30"
          : isBlocked
          ? "bg-amber-500/5 border-amber-500/40 hover:border-amber-500/70"
          : isCompleted
          ? "bg-zinc-950/50 border-emerald-500/25 hover:border-emerald-500/50"
          : isCurrent
          ? "bg-zinc-900 border-emerald-500/70 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5 hover:border-emerald-500"
          : "bg-zinc-900/40 border-zinc-800/70 opacity-70 hover:opacity-100 hover:border-zinc-700"
      }`}
    >
      {/* Day number icon */}
      <div className="flex items-center justify-between">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border font-black ${
            isCompleted
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
              : isCapstone
              ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 border-amber-300 shadow-md"
              : isBlocked
              ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
              : isCurrent
              ? "bg-emerald-500 text-zinc-950 border-emerald-400"
              : "bg-zinc-800 border-zinc-700 text-zinc-400"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : isCapstone ? (
            <Sparkles className="h-5 w-5 fill-zinc-950" />
          ) : isBlocked ? (
            <Zap className="h-4 w-4" />
          ) : (
            <span className="text-sm font-mono">{milestone.order}</span>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-col items-end gap-1">
          {isCapstone && (
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Final
            </span>
          )}
          {isCurrent && !isCompleted && !isCapstone && (
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-0.5">
              <Flame className="h-2.5 w-2.5" /> Hoy
            </span>
          )}
          {isBlocked && (
            <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" /> Escalón
            </span>
          )}
          {isCompleted && (
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              ✓ Hecho
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4
        className={`text-base sm:text-lg font-bold leading-snug line-clamp-2 ${
          isCompleted ? "text-zinc-400" : "text-zinc-100"
        }`}
      >
        {milestone.title}
      </h4>

      {/* Progress bar + meta */}
      <div className="flex flex-col gap-1.5 mt-auto">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{milestone.estimatedMinutes}m</span>
          </div>
          <span>{stepProgress}%</span>
        </div>
        <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? "bg-emerald-500"
                : isCapstone
                ? "bg-gradient-to-r from-amber-500 to-emerald-500"
                : isCurrent
                ? "bg-emerald-500"
                : "bg-zinc-600"
            }`}
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      </div>
    </button>
  );
}
