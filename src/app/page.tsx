"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Brain,
  Flame,
  User,
  Layers,
  ChevronRight,
  Clock,
  CheckCircle2,
  Trash2,
  CloudUpload,
  Database,
  ArrowRight,
} from "lucide-react";
import { getNotebooksLocally, deleteNotebookLocally } from "@/db/localDb";
import { useSync } from "@/lib/useSync";
import { useStreak } from "@/hooks/useStreak";
import AssessmentModal from "@/components/assessment/AssessmentModal";
import AuthModal from "@/components/auth/AuthModal";
import ApiKeyModal from "@/components/settings/ApiKeyModal";
import type { Notebook } from "@/types";

interface AuthUser {
  id: string;
  username: string;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();

  const { currentStreak, todayCompleted } = useStreak();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  // Sync hook
  const { isSyncing, syncNow, lastSyncedAt } = useSync();

  const checkUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const loadNotebooks = useCallback(async () => {
    try {
      const nbs = await getNotebooksLocally();
      setNotebooks(nbs);
    } catch (err) {
      console.error("Error al cargar cuadernos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
    loadNotebooks();
  }, [checkUser, loadNotebooks]);

  const handleDeleteNotebook = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteTarget(id);
    setDeleteName(title);
  };

  const handleNotebookCreated = (newId: string) => {
    setIsAssessmentOpen(false);
    router.push(`/notebook/${newId}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Barra Superior Minimalista */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand & Ensō Emblem */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 overflow-hidden shadow-inner">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Ensō circle stroke */}
              <path d="M 12 3 A 9 9 0 1 1 5 8" />
              <circle cx="12" cy="12" r="2" fill="#10b981" />
            </svg>
          </div>

          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              Maestro Kaizen
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PWA
              </span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 hidden sm:block">
              Aprendizaje Adaptativo & Andamiaje Socrático
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Racha */}
          <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Flame className={`h-3.5 w-3.5 ${currentStreak > 0 ? 'fill-amber-500' : 'fill-amber-500/30'}`} />
            <span>{currentStreak > 0 ? `${currentStreak} día${currentStreak !== 1 ? 's' : ''}` : '—'}</span>
            {todayCompleted && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>

          {/* Botón Sincronizar (si hay sesión) */}
          {user && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              title="Sincronizar cuadernos a la nube"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors hidden sm:flex items-center gap-1 text-xs"
            >
              <CloudUpload className={`h-4 w-4 ${isSyncing ? "animate-bounce text-amber-400" : ""}`} />
            </button>
          )}

          {/* Botón Nuevo Cuaderno */}
          <button
            onClick={() => setIsAssessmentOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Nuevo Cuaderno</span>
            <span className="sm:hidden">Nuevo</span>
          </button>

          {/* Botón Motor IA (Gemini / Offline) */}
          <button
            onClick={() => setIsApiKeyOpen(true)}
            title="Configuración de Motor de IA (Gemini 2.0 Flash)"
            className="h-8 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1.5 text-xs text-zinc-300 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline font-mono">Motor IA</span>
          </button>

          {/* Botón de Perfil / Login */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center gap-2 text-xs text-zinc-300 transition-colors"
          >
            <User className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono">
              {user ? `@${user.username}` : "Entrar"}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Mesa de Trabajo (Workspace) */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-8">
        {/* Hero Banner Minimalista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              Mesa de Trabajo
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Tus hojas de ruta activas con andamiaje pedagógico y almacenamiento offline.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <Database className="h-3.5 w-3.5 text-emerald-500" />
            <span>IndexedDB activo (Offline-first)</span>
          </div>
        </div>

        {/* Grid de Cuadernos de Proyecto */}
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-zinc-500">
            Cargando tus cuadernos Kaizen...
          </div>
        ) : notebooks.length === 0 ? (
          /* Estado Vacío Motivador */
          <div className="py-16 sm:py-24 px-4 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center gap-4 bg-zinc-950/20">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-base sm:text-lg font-bold text-zinc-200">
                Tu primer paso Kaizen comienza aquí
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Elige cualquier habilidad (ej: <em>Origami</em>, <em>Calistenia</em>, <em>Ajedrez</em>, <em>Rust</em>) y el Maestro IA estructurará tu andamiaje diario adaptado a tu tiempo.
              </p>
            </div>

            <button
              onClick={() => setIsAssessmentOpen(true)}
              className="mt-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Crear mi Primer Cuaderno con Diagnóstico</span>
            </button>
          </div>
        ) : (
          /* Cuadernos de Proyecto */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notebooks.map((nb) => {
              const totalM = nb.milestones.length;
              const completedM = nb.milestones.filter(
                (m) => m.status === "completed" || m.status === "mastered"
              ).length;
              const percent = totalM > 0 ? Math.round((completedM / totalM) * 100) : 0;
              const activeM =
                nb.milestones.find((m) => m.status === "in_progress") ||
                nb.milestones.find((m) => m.status === "pending") ||
                nb.milestones[0];

              return (
                <Link
                  key={nb.id}
                  href={`/notebook/${nb.id}`}
                  className="group relative p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:bg-zinc-900/60 transition-all duration-200 flex flex-col justify-between gap-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3">
                    {/* Badge de Categoría & Acción de Eliminar */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-emerald-500/20">
                        {nb.topic}
                      </span>
                      <button
                        onClick={(e) => handleDeleteNotebook(e, nb.id, nb.title)}
                        className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all"
                        title="Eliminar cuaderno"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Título & Nivel */}
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors leading-snug">
                        {nb.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {nb.description}
                      </p>
                    </div>
                  </div>

                  {/* Progreso y Hito del Día Actual */}
                  <div className="flex flex-col gap-3 pt-3 border-t border-border/60">
                    {activeM && (
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="truncate flex items-center gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>Día {activeM.order}: {activeM.title}</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    )}

                    {/* Barra de Progreso Lineal */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>{percent}% dominado</span>
                        <span>{completedM}/{totalM} hitos</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Tarjeta rápida para crear otro cuaderno (+) */}
            <button
              onClick={() => setIsAssessmentOpen(true)}
              className="p-6 rounded-2xl border border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-950/40 transition-all flex flex-col items-center justify-center text-center gap-2.5 min-h-[200px]"
            >
              <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-zinc-300">
                Añadir Nuevo Cuaderno
              </span>
              <span className="text-[11px] text-zinc-500">
                Diagnóstico guiado en 3 pasos
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Modales Flotantes */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">¿Eliminar cuaderno?</h3>
            <p className="text-zinc-400 text-sm">Se eliminará permanentemente <strong className="text-white">&ldquo;{deleteName}&rdquo;</strong> y todo su progreso. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Cancelar</button>
              <button onClick={async () => { await deleteNotebookLocally(deleteTarget); setNotebooks(prev => prev.filter(n => n.id !== deleteTarget)); setDeleteTarget(null); }} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600/80 text-white hover:bg-red-500 transition">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <AssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        onNotebookCreated={handleNotebookCreated}
        userId={user?.id || "local-user"}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onAuthChange={() => {
          checkUser();
          loadNotebooks();
        }}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
      />
    </main>
  );
}
