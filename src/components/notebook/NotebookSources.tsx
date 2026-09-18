"use client";

import { useState } from "react";
import { X, Plus, ExternalLink, Trash2, Youtube, Link2, FileText, BookOpen } from "lucide-react";
import { saveNotebookLocally } from "@/db/localDb";
import type { Notebook, SourceDocument, SourceType } from "@/types";

interface NotebookSourcesProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  onNotebookUpdate: (updated: Notebook) => void;
}

function getSourceIcon(type: SourceType) {
  switch (type) {
    case 'youtube': return <Youtube className="w-4 h-4 text-red-400" />;
    case 'url': return <Link2 className="w-4 h-4 text-blue-400" />;
    case 'manual_note': return <FileText className="w-4 h-4 text-amber-400" />;
    case 'pdf': return <FileText className="w-4 h-4 text-rose-400" />;
    case 'markdown': return <FileText className="w-4 h-4 text-purple-400" />;
    default: return <FileText className="w-4 h-4 text-zinc-400" />;
  }
}

function detectSourceType(url: string): SourceType {
  if (url.match(/youtube\.com|youtu\.be/i)) return 'youtube';
  if (url.match(/^https?:\/\//i)) return 'url';
  return 'manual_note';
}

export default function NotebookSources({ isOpen, onClose, notebook, onNotebookUpdate }: NotebookSourcesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [sourceInput, setSourceInput] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('manual_note');

  // Filter sources to only show reference sources (not manual_note from NotebookNotes)
  // Actually, NotebookNotes uses the same sources array with type manual_note.
  // Here we show ALL sources for management.
  const sources = notebook.sources || [];
  const referenceSources = sources.filter(s => s.type !== 'manual_note');
  const manualNotes = sources.filter(s => s.type === 'manual_note');

  const handleAddSource = async () => {
    if (!sourceInput.trim()) return;
    
    const detectedType = detectSourceType(sourceInput);
    const isUrl = detectedType === 'youtube' || detectedType === 'url';
    
    const newSource: SourceDocument = {
      id: `src-${Date.now()}`,
      notebookId: notebook.id,
      title: sourceTitle.trim() || (isUrl ? sourceInput.trim() : sourceInput.trim().slice(0, 60)),
      type: isUrl ? detectedType : sourceType,
      content: isUrl ? '' : sourceInput.trim(),
      url: isUrl ? sourceInput.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotebook = {
      ...notebook,
      sources: [...sources, newSource],
    };

    try {
      await saveNotebookLocally(updatedNotebook);
      onNotebookUpdate(updatedNotebook);
      setSourceInput('');
      setSourceTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error saving source:', err);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    const updatedNotebook = {
      ...notebook,
      sources: sources.filter(s => s.id !== sourceId),
    };
    try {
      await saveNotebookLocally(updatedNotebook);
      onNotebookUpdate(updatedNotebook);
    } catch (err) {
      console.error('Error deleting source:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Fuentes de Referencia</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info banner */}
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
            <p className="text-xs text-zinc-400">Agrega enlaces a videos, artículos o notas que el Tutor IA usará como contexto para sus respuestas.</p>
          </div>

          {/* Add button */}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Agregar fuente</span>
            </button>
          )}

          {/* Add form */}
          {isAdding && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="Título (opcional)"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <textarea
                value={sourceInput}
                onChange={(e) => {
                  setSourceInput(e.target.value);
                  // Auto-detect type from URL
                  const detected = detectSourceType(e.target.value);
                  if (detected !== 'manual_note') setSourceType(detected);
                }}
                placeholder="Pega un enlace de YouTube, URL de artículo, o escribe una nota de referencia..."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
              {sourceInput && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  {getSourceIcon(detectSourceType(sourceInput))}
                  <span>Detectado: {detectSourceType(sourceInput) === 'youtube' ? 'Video de YouTube' : detectSourceType(sourceInput) === 'url' ? 'Enlace web' : 'Nota de referencia'}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsAdding(false); setSourceInput(''); setSourceTitle(''); }}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition"
                >Cancelar</button>
                <button
                  onClick={handleAddSource}
                  disabled={!sourceInput.trim()}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition disabled:opacity-50"
                >Agregar</button>
              </div>
            </div>
          )}

          {/* Sources list */}
          {referenceSources.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Enlaces y Referencias</h3>
              {referenceSources.map((source) => (
                <div key={source.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl group">
                  <div className="mt-0.5 shrink-0">{getSourceIcon(source.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{source.title}</p>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 truncate block mt-0.5 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{source.url}</span>
                      </a>
                    )}
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(source.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition opacity-0 group-hover:opacity-100 sm:opacity-60"
                    title="Eliminar fuente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Notes summary */}
          {manualNotes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notas del Cuaderno ({manualNotes.length})</h3>
              <p className="text-xs text-zinc-500">Las notas se gestionan desde la Bitácora de Notas.</p>
            </div>
          )}

          {/* Empty state */}
          {referenceSources.length === 0 && !isAdding && (
            <div className="text-center py-8 space-y-2">
              <BookOpen className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-sm text-zinc-500">Sin fuentes de referencia aún</p>
              <p className="text-xs text-zinc-600">Agrega videos de YouTube o artículos para que el Tutor IA los use como contexto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
