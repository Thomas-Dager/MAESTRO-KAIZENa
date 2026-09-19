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
  LayoutGrid,
} from "lucide-react";
import {
  getNotebookByIdLocally,
  saveNotebookLocally,
  updateMilestoneProgressLocally,
  insertScaffoldingLocally,
} from "@/db/localDb";
import MilestoneCard from "@/components/milestone/MilestoneCard";
import MilestoneDayView from "@/components/milestone/MilestoneDayView";
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
  const [tutorInitialMessage, setTutorInitialMessage] = useState<string | undefined>(undefined);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isMasteryModalOpen, setIsMasteryModalOpen] = useState(false);
  // Drawer state
  const [drawerMilestone, setDrawerMilestone] = useState<Milestone | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


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

  // Open drawer for a milestone tile click
  const openMilestoneDrawer = (m: Milestone) => {
    setDrawerMilestone(m);
    setIsDrawerOpen(true);
  };


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


        {/* Grid de Hitos */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-emerald-400" />
              <span>Hoja de Ruta</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                — {notebook.milestones.length} días
              </span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              Toca un día para verlo en detalle
            </span>
          </div>

          {/* Responsive grid: 2 cols on mobile, 3 on sm, 4 on lg */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {notebook.milestones.map((m, index) => {
              const isCurrent = activeMilestone?.id === m.id;
              const isCapstone = index === notebook.milestones.length - 1;

              return (
                <MilestoneCard
                  key={m.id}
                  milestone={m}
                  isCurrent={isCurrent}
                  isCapstone={isCapstone}
                  onClick={() => openMilestoneDrawer(m)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <MilestoneDayView
        milestone={drawerMilestone}
        notebook={notebook}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isCurrent={drawerMilestone?.id === activeMilestone?.id}
        isCapstone={
          drawerMilestone
            ? notebook.milestones.indexOf(drawerMilestone) ===
              notebook.milestones.length - 1
            : false
        }
        notebookTopic={notebook.topic}
        onToggleStep={handleToggleStep}
        onCompleteMilestone={handleCompleteMilestone}
        onInsertScaffolding={handleInsertScaffolding}
        onTriggerMastery={() => setIsMasteryModalOpen(true)}
      />

      {/* Modal de Certificado de Maestría Kaizen */}
      <MasteryCertificateModal
        isOpen={isMasteryModalOpen}
        onClose={() => setIsMasteryModalOpen(false)}
        notebook={notebook}
      />

      {/* Panel lateral deslizable del Tutor IA */}
      <TutorSidebar
        isOpen={isTutorOpen}
        onClose={() => {
          setIsTutorOpen(false);
          setTutorInitialMessage(undefined);
        }}
        notebook={notebook}
        activeMilestone={activeMilestone}
        initialMessage={tutorInitialMessage}
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
