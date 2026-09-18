"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, Timer, CheckCircle2 } from "lucide-react";
import { saveSessionLocally, type KaizenSessionRecord } from "@/db/localDb";

interface PracticeTimerProps {
  milestoneId: string;
  notebookId: string;
  estimatedMinutes: number;
  onSessionComplete?: (xpEarned: number) => void;
}

export default function PracticeTimer({
  milestoneId,
  notebookId,
  estimatedMinutes,
  onSessionComplete,
}: PracticeTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const targetSeconds = estimatedMinutes * 60;
  const progress = Math.min(1, elapsedSeconds / targetSeconds);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (isCompleted) return;
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTimeRef.current) / 1000));
    }, 1000);
  }, [isCompleted, elapsedSeconds]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(async () => {
    pauseTimer();
    if (elapsedSeconds < 30) return; // Minimum 30 seconds to count

    const minutesPracticed = Math.round(elapsedSeconds / 60);
    const completionRatio = Math.min(1, elapsedSeconds / targetSeconds);
    const xpEarned = Math.round(completionRatio * 100);

    const session: KaizenSessionRecord = {
      id: `session-${Date.now()}`,
      notebookId,
      milestoneId,
      difficulty: "adecuado",
      blockers: [],
      notes: `Sesión de ${minutesPracticed} min`,
      xpEarned,
      completedAt: new Date().toISOString(),
    };

    try {
      await saveSessionLocally(session);
    } catch (err) {
      console.error("Error saving session:", err);
    }

    setIsCompleted(true);
    onSessionComplete?.(xpEarned);
  }, [pauseTimer, elapsedSeconds, targetSeconds, notebookId, milestoneId, onSessionComplete]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-emerald-300">
          Sesión registrada: {formatTime(elapsedSeconds)} practicados
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl">
      {/* Circular progress */}
      <div className="relative w-10 h-10 shrink-0">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={progress >= 1 ? "#34d399" : "#f59e0b"}
            strokeWidth="3"
            strokeDasharray={`${progress * 94.25} 94.25`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <Timer className="w-3.5 h-3.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400" />
      </div>

      {/* Time display */}
      <div className="flex-1 min-w-0">
        <span className={`font-mono text-lg tabular-nums ${isRunning ? 'text-white' : 'text-zinc-400'}`}>
          {formatTime(elapsedSeconds)}
        </span>
        <span className="text-xs text-zinc-500 ml-1.5">
          / {formatTime(targetSeconds)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="p-2 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-500 transition"
            title="Iniciar"
          >
            <Play className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-2 rounded-lg bg-amber-600/80 text-white hover:bg-amber-500 transition"
            title="Pausar"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        {elapsedSeconds > 0 && (
          <button
            onClick={stopTimer}
            className="p-2 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition"
            title="Terminar sesión"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
