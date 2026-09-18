"use client";

import { useState, useCallback } from "react";
import { getNotebooksLocally, saveNotebookLocally } from "@/db/localDb";
import type { Notebook } from "@/types";

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  syncedCount: number;
}

export function useSync() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    syncedCount: 0,
  });

  /**
   * Envía todos los cuadernos e hitos locales de Dexie hacia el servidor SQLite (backup en la nube).
   */
  const syncNow = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      // 1. Obtener todos los cuadernos e hitos locales de Dexie
      const localNotebooks = await getNotebooksLocally();

      if (localNotebooks.length === 0) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          syncedCount: 0,
          error: "No hay cuadernos locales en Dexie para sincronizar.",
        }));
        return false;
      }

      // 2. Enviar datos al endpoint de sincronización
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notebooks: localNotebooks }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fallo en la sincronización con el servidor.");
      }

      setState({
        isSyncing: false,
        lastSyncedAt: data.syncedAt || new Date().toISOString(),
        error: null,
        syncedCount: data.syncedCount || localNotebooks.length,
      });

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al sincronizar.";
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: message,
      }));
      return false;
    }
  }, []);

  /**
   * Recupera los cuadernos almacenados en el servidor y los guarda en Dexie localmente.
   */
  const restoreFromCloud = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const res = await fetch("/api/sync");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron recuperar los datos remotos.");
      }

      const remoteNotebooks: Notebook[] = data.notebooks || [];

      for (const nb of remoteNotebooks) {
        await saveNotebookLocally(nb);
      }

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        syncedCount: remoteNotebooks.length,
        lastSyncedAt: new Date().toISOString(),
      }));

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al restaurar desde la nube.";
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: message,
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    syncNow,
    restoreFromCloud,
  };
}
