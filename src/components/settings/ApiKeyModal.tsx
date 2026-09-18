"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Sparkles, CheckCircle2, ShieldAlert, ExternalLink, Cpu, Eye, EyeOff, Loader2 } from "lucide-react";
import { localDb } from "@/db/localDb";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isServerConfigured, setIsServerConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid' | 'saved'>('idle');

  useEffect(() => {
    if (!isOpen) return;

    // Cargar clave de localStorage
    const stored = localStorage.getItem("mk_gemini_api_key") || "";
    setApiKey(stored);

    // Consultar estado del servidor
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => {
        setIsServerConfigured(data.configured);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const trimmed = apiKey.trim();
    if (trimmed) {
      setStatus('testing');
      try {
        const testRes = await fetch('/api/ai/status', {
          headers: { 'x-gemini-api-key': trimmed }
        });
        const testData = await testRes.json();
        if (!testData.configured) {
          setStatus('invalid');
        } else {
          setStatus('valid');
        }
      } catch (e) {
        // Network error, proceed with save
      }

      localStorage.setItem("mk_gemini_api_key", trimmed);
      try {
        await localDb.userSettings.put({
          id: "gemini_api_key",
          key: "gemini_api_key",
          value: trimmed,
          updatedAt: new Date().toISOString(),
        });
      } catch {}
    } else {
      localStorage.removeItem("mk_gemini_api_key");
      try {
        await localDb.userSettings.delete("gemini_api_key");
      } catch {}
    }

    setIsSaving(false);
    setSavedSuccess(true);
    onKeySaved?.();

    setTimeout(() => {
      setSavedSuccess(false);
      setStatus('idle');
      onClose();
    }, 1200);
  };

  const handleClear = async () => {
    setApiKey("");
    localStorage.removeItem("mk_gemini_api_key");
    try {
      await localDb.userSettings.where('key').equals('gemini_api_key').delete();
    } catch (e) {
      console.error('Error clearing Dexie setting:', e);
    }
    onKeySaved?.();
  };

  const isLive = isServerConfigured || apiKey.trim().length > 15;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Motor de Inteligencia Artificial
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Configuración de Gemini 2.0 Flash
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Estado actual del motor */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isLive
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-blue-500/10 border-blue-500/20 text-blue-300"
        }`}>
          {isLive ? (
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Cpu className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">
              {isLive ? "● Gemini 2.0 Flash Activo" : "● Motor Pedagógico Experto (Offline)"}
            </span>
            <p className="text-xs leading-relaxed text-zinc-300">
              {isLive
                ? "Las respuestas, andamiajes y roadmaps son generados en tiempo real por el modelo oficial Gemini 2.0 Flash."
                : "Operando con el motor pedagógico determinista integrado. Genera currículos de alta fidelidad para cortes culinarios, calistenia, música y más, sin necesidad de conexión externa."}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>Obtener clave gratis</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </label>

            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pega tu clave AIzaSy..."
                className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="text-[10px] text-zinc-500">
              Tu clave se almacena de forma segura y privada en tu navegador (IndexedDB / LocalStorage) y nunca se comparte con terceros.
            </span>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Eliminar clave
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                Cerrar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {status === 'testing' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : status === 'invalid' ? (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-900" />
                    <span>Guardado con error</span>
                  </>
                ) : savedSuccess || status === 'valid' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>¡Guardado!</span>
                  </>
                ) : isSaving ? (
                  <span>Guardando...</span>
                ) : (
                  <span>Guardar Configuración</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
