"use client";

import React, { useState } from "react";
import { X, BookOpen, Plus, Trash2, FileText, Sparkles, Check } from "lucide-react";
import { saveNotebookLocally } from "@/db/localDb";
import type { Notebook, SourceDocument } from "@/types";

interface NotebookNotesProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  onNotebookUpdate: (updated: Notebook) => void;
}

export default function NotebookNotes({
  isOpen,
  onClose,
  notebook,
  onNotebookUpdate,
}: NotebookNotesProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newDoc: SourceDocument = {
      id: `note-${Date.now()}`,
      notebookId: notebook.id,
      title: newTitle.trim(),
      type: "manual_note",
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotebook: Notebook = {
      ...notebook,
      sources: [newDoc, ...notebook.sources],
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveNotebookLocally(updatedNotebook);
      onNotebookUpdate(updatedNotebook);
      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error al guardar la nota:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const updatedNotebook: Notebook = {
      ...notebook,
      sources: notebook.sources.filter((s) => s.id !== id),
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveNotebookLocally(updatedNotebook);
      onNotebookUpdate(updatedNotebook);
    } catch (err) {
      console.error("Error al borrar la nota:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Libreta de Notas & Bitácora</h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[210px]">
                Sensaciones y trucos de {notebook.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400">
              {notebook.sources.length} Entrada(s) registrada(s)
            </span>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAdding ? "Cerrar Formulario" : "Nueva Nota Rápida"}</span>
            </button>
          </div>

          {/* Formulario de Nueva Nota */}
          {isAdding && (
            <form
              onSubmit={handleSaveNote}
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-3 animate-in fade-in"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Registrar Sensación o Ajuste Biomecánico</span>
              </div>

              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ej: Ajuste de talón con cuña / Ángulo de pliegue..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />

              <textarea
                rows={4}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="¿Qué truco descubriste hoy? ¿Qué sensación física o mental te ayudó a destrabar el movimiento?"
                className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
              >
                Guardar en la Libreta
              </button>
            </form>
          )}

          {/* Lista de Notas */}
          <div className="flex flex-col gap-3">
            {notebook.sources.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">
                Aún no has registrado notas en este cuaderno.
              </p>
            ) : (
              notebook.sources.map((source) => (
                <div
                  key={source.id}
                  className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col gap-2 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                      <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{source.title}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(source.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {source.content}
                  </p>

                  <span className="text-[10px] font-mono text-zinc-600">
                    {new Date(source.createdAt).toLocaleDateString()} • {new Date(source.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
