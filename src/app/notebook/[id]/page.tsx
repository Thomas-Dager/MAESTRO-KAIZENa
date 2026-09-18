"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";
import {
  getNotebookByIdLocally,
  saveNotebookLocally,
  updateMilestoneProgressLocally,
  insertScaffoldingLocally,
} from "@/db/localDb";
import MilestoneCard from "@/components/milestone/MilestoneCard";
import TutorSidebar from "@/components/tutor/TutorSidebar";
import NotebookNotes from "@/components/notebook/NotebookNotes";
import NotebookSources from "@/components/notebook/NotebookSources";
import MasteryCertificateModal from "@/components/milestone/MasteryCertificateModal";
import type { Notebook, Milestone, ScaffoldingStep } from "@/types";

export default function NotebookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params?.id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isMasteryModalOpen, setIsMasteryModalOpen] = useState(false);

  const loadNotebook = useCallback(async () => {
    if (!notebookId) return;
    try {
      const data = await getNotebookByIdLocally(notebookId);
      if (data) {
        setNotebook(data);
      } else {
        // Redirigir si no existe
        router.push("/");
      }
    } catch (err) {
      console.error("Error al cargar cuaderno:", err);
    } finally {
      setLoading(false);
    }
  }, [notebookId, router]);

  useEffect(() => {
    loadNotebook();
  }, [loadNotebook]);

  const handleToggleStep = async (milestoneId: string, stepId: string) => {
    if (!notebook) return;

    const targetMilestone = notebook.milestones.find((m) => m.id === milestoneId);
    if (!targetMilestone) return;

    // Prevent toggling steps on pending milestones (enforce sequential progression)
    if (targetMilestone.status === "pending") return;

    const currentStep = targetMilestone.steps.find((s) => s.id === stepId);
    const isNowCompleted = !currentStep?.isCompleted;

    const updatedSteps = targetMilestone.steps.map((s) =>
      s.id === stepId ? { ...s, isCompleted: isNowCompleted } : s
    );

    const completedCount = updatedSteps.filter((s) => s.isCompleted).length;
    const newStatus =
      completedCount === updatedSteps.length
        ? "completed"
      : completedCount > 0
      ? "in_progress"
      : "pending";

    try {
      await updateMilestoneProgressLocally(
        milestoneId,
        newStatus,
        updatedSteps.filter((s) => s.isCompleted).map((s) => s.id)
      );

      // If all steps completed, auto-activate the next milestone
      if (newStatus === "completed") {
        const milestoneIndex = notebook.milestones.findIndex((m) => m.id === milestoneId);
        if (milestoneIndex !== -1 && milestoneIndex + 1 < notebook.milestones.length) {
          const nextMilestone = notebook.milestones[milestoneIndex + 1];
          if (nextMilestone.status === "pending") {
            await updateMilestoneProgressLocally(nextMilestone.id, "in_progress");
          }
        }
      }
    } catch (err) {
      console.error("Error al actualizar el paso:", err);
    }

    await loadNotebook();
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!notebook) return;

    const milestoneIndex = notebook.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return;

    const targetMilestone = notebook.milestones[milestoneIndex];

    try {
      // Marcar todos los pasos de este hito como completados
      const allStepIds = targetMilestone.steps.map((s) => s.id);
      await updateMilestoneProgressLocally(milestoneId, "completed", allStepIds);

      // Si hay un siguiente hito, activarlo
      if (milestoneIndex + 1 < notebook.milestones.length) {
        const nextMilestone = notebook.milestones[milestoneIndex + 1];
        if (nextMilestone.status === "pending") {
          await updateMilestoneProgressLocally(nextMilestone.id, "in_progress");
        }
      }

      // Update notebook stats (XP, mastery, sessions)
      const totalMilestoneCount = notebook.milestones.length;
      const newCompletedCount = notebook.milestones.filter(
        (m) => m.status === "completed" || m.status === "mastered" || m.id === milestoneId
      ).length;

      const updatedNotebook: Notebook = {
        ...notebook,
        stats: {
          ...notebook.stats,
          completedMilestones: newCompletedCount,
          totalMilestones: totalMilestoneCount,
          masteryScore: Math.round((newCompletedCount / totalMilestoneCount) * 100),
          totalSessions: (notebook.stats.totalSessions || 0) + 1,
        },
        updatedAt: new Date().toISOString(),
      };
      await saveNotebookLocally(updatedNotebook);

      const allDone = updatedNotebook.milestones.every(
        (m) => m.status === "completed" || m.status === "mastered" || m.id === milestoneId
      );
      if (allDone) {
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ['#10b981', '#f59e0b', '#6366f1'] });
        setTimeout(() => setIsMasteryModalOpen(true), 1500);
      }
    } catch (err) {
      console.error("Error al completar el hito o actualizar stats:", err);
    }

    await loadNotebook();
  };

  const handleInsertScaffolding = async (milestoneId: string, step: ScaffoldingStep) => {
    if (!notebook) return;

    const targetMilestone = notebook.milestones.find((m) => m.id === milestoneId);
    if (!targetMilestone) return;

    // Prevent duplicate scaffolding steps from stacking
    const hasExistingScaffold = targetMilestone.steps.some(
      (s) => s.order === 0 || s.id === step.id
    );
    if (hasExistingScaffold) return;

    try {
      const updatedSteps = [step, ...targetMilestone.steps];
      await insertScaffoldingLocally(milestoneId, updatedSteps);
    } catch (err) {
      console.error("Error al insertar scaffolding:", err);
    }
    
    await loadNotebook();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-zinc-400 text-xs font-mono">
        Cargando cuaderno Kaizen...
      </div>
    );
  }

  if (!notebook) return null;

  const totalMilestones = notebook.milestones.length;
  const completedMilestones = notebook.milestones.filter(
    (m) => m.status === "completed" || m.status === "mastered"
  ).length;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const currentMilestoneIndex = notebook.milestones.findIndex((m) => m.status === "in_progress");
  const allCompleted = notebook.milestones.every(
    (m) => m.status === "completed" || m.status === "mastered"
  );
  const activeMilestone = allCompleted
    ? notebook.milestones[notebook.milestones.length - 1] // Show the last (capstone) milestone
    : currentMilestoneIndex !== -1
      ? notebook.milestones[currentMilestoneIndex]
      : notebook.milestones[0];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100 truncate max-w-[240px] sm:max-w-md">
                {notebook.title}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                {notebook.topic}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Progreso: {progressPercent}% dominado ({completedMilestones}/{totalMilestones} hitos)
            </span>
          </div>
        </div>

        {/* Action Buttons: Bitácora, Certificado & Tutor Socrático */}
        <div className="flex items-center gap-2 sm:gap-3">
          {progressPercent === 100 && (
            <button
              onClick={() => setIsMasteryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm shadow-amber-500/20"
              title="Ver Certificado y Ficha de Maestría"
            >
              <Sparkles className="h-3.5 w-3.5 fill-zinc-950" />
              <span className="hidden sm:inline">Ficha de Maestría</span>
            </button>
          )}

          <button
            onClick={() => setIsSourcesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-emerald-400 hover:bg-zinc-800/80 transition text-sm"
            title="Fuentes de referencia"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Fuentes</span>
          </button>

          <button
            onClick={() => setIsNotesOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Bitácora de Notas</span>
          </button>

          <button
            onClick={() => setIsTutorOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Brain className="h-3.5 w-3.5" />
            <span>Tutor 24/7</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Project Overview Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Nivel: {notebook.currentLevel}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {totalMilestones} días programados
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              {allCompleted ? (
                <span className="text-emerald-400">🎉 ¡Roadmap Completado!</span>
              ) : (
                <>
                  <Flame className="h-3.5 w-3.5 fill-amber-500/30" />
                  <span>Día actual: {activeMilestone?.order || 1}</span>
                </>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {notebook.description}
          </p>

          {/* Linear Progress Bar */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Camino a la Maestría</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline Vertical de Hitos */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>Hoja de Ruta Progresiva</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                (Andamiaje Diario)
              </span>
            </h2>
          </div>

          <div className="relative flex flex-col gap-6 pl-4 sm:pl-6 border-l-2 border-zinc-800/80 my-2">
            {notebook.milestones.map((m, index) => {
              const isCurrent = activeMilestone?.id === m.id;
              const isCompleted = m.status === "completed" || m.status === "mastered";
              const isCapstone = index === notebook.milestones.length - 1;

              return (
                <div key={m.id} className="relative">
                  {/* Nodo conector en la línea vertical */}
                  <div
                    className={`absolute -left-[23px] sm:-left-[31px] top-6 h-3.5 w-3.5 rounded-full border-2 transition-all ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 ring-4 ring-emerald-500/10"
                        : isCurrent
                        ? "bg-zinc-950 border-emerald-400 ring-4 ring-emerald-500/30 scale-125"
                        : "bg-zinc-900 border-zinc-700"
                    }`}
                  />

                  {/* Tarjeta del Hito */}
                  <MilestoneCard
                    milestone={m}
                    isCurrent={isCurrent}
                    isCapstone={isCapstone}
                    notebookTopic={notebook.topic}
                    onToggleStep={handleToggleStep}
                    onCompleteMilestone={handleCompleteMilestone}
                    onInsertScaffolding={handleInsertScaffolding}
                    onTriggerMastery={() => setIsMasteryModalOpen(true)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Certificado de Maestría Kaizen */}
      <MasteryCertificateModal
        isOpen={isMasteryModalOpen}
        onClose={() => setIsMasteryModalOpen(false)}
        notebook={notebook}
      />

      {/* Panel lateral deslizable del Tutor IA */}
      <TutorSidebar
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        notebook={notebook}
        activeMilestone={activeMilestone}
      />

      {/* Libreta de Notas y Bitácora */}
      <NotebookNotes
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notebook={notebook}
        onNotebookUpdate={(updated) => setNotebook(updated)}
      />

      {/* Fuentes de Referencia */}
      <NotebookSources
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        notebook={notebook}
        onNotebookUpdate={(updated) => setNotebook(updated)}
      />
    </main>
  );
}
