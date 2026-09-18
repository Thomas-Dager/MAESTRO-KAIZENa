"use client";

import React, { useState } from "react";
import { X, UserCheck, LogIn, UserPlus, LogOut, Loader2, Shield } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; username: string; createdAt: string } | null;
  onAuthChange: () => void;
}

export default function AuthModal({ isOpen, onClose, user, onAuthChange }: AuthModalProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error");
      }

      setUsername("");
      setPassword("");
      onAuthChange();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onAuthChange();
      onClose();
    } catch (err) {
      console.error("Error logging out:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl flex flex-col gap-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              {user ? "Perfil de Usuario" : isRegisterMode ? "Crear Cuenta Kaizen" : "Iniciar Sesión"}
            </h3>
            <p className="text-xs text-zinc-400">
              {user ? "Sesión activa y respaldos" : "Autenticación simple sin correo electrónico"}
            </p>
          </div>
        </div>

        {/* Content */}
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Sesión verificada</span>
              </div>
              <p className="text-sm font-semibold text-zinc-200">@{user.username}</p>
              <p className="text-[11px] font-mono text-zinc-500">ID: {user.id}</p>
              <p className="text-xs text-zinc-400">
                Miembro desde: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-zinc-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase text-zinc-400">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: aprendiz_kaizen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase text-zinc-400">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Crear Cuenta y Comenzar</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Entrar</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {isRegisterMode
                  ? "¿Ya tienes cuenta? Inicia sesión aquí"
                  : "¿Nuevo en Maestro Kaizen? Regístrate gratis en 5 segundos"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
