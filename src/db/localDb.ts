import Dexie, { type Table } from "dexie";
import type {
  Notebook,
  Milestone,
  ScaffoldingStep,
  ChatMessage,
  MilestoneStatus,
} from "@/types";

export interface LocalUserSettings {
  id?: string;
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface KaizenSessionRecord {
  id: string;
  notebookId: string;
  milestoneId: string;
  difficulty: string;
  blockers: string[];
  notes: string;
  xpEarned: number;
  completedAt: string;
}

export class MaestroKaizenDB extends Dexie {
  notebooks!: Table<Notebook, string>;
  milestones!: Table<Milestone, string>;
  tutorMessages!: Table<ChatMessage, string>;
  userSettings!: Table<LocalUserSettings, string>;
  sessions!: Table<KaizenSessionRecord, string>;

  constructor() {
    super("MaestroKaizenLocalDB");

    this.version(1).stores({
      notebooks: "id, userId, title, topic, currentLevel, updatedAt, isArchived",
      milestones: "id, notebookId, order, status, targetDifficulty",
      tutorMessages: "id, notebookId, role, timestamp",
      userSettings: "++id, key, updatedAt",
    });

    this.version(2).stores({
      notebooks: "id, userId, title, topic, currentLevel, updatedAt, isArchived",
      milestones: "id, notebookId, order, status, targetDifficulty",
      tutorMessages: "id, notebookId, role, timestamp",
      userSettings: "++id, key, updatedAt",
      sessions: "id, notebookId, milestoneId, difficulty, completedAt",
    });
  }
}

// Instancia singleton para el cliente del navegador
export const localDb = new MaestroKaizenDB();

// =========================================================
// FUNCIONES AUXILIARES CRUD (LOCAL / OFFLINE-FIRST)
// =========================================================

/**
 * Guarda o actualiza un cuaderno completo en IndexedDB,
 * sincronizando opcionalmente sus hitos asociados.
 */
export async function saveNotebookLocally(notebook: Notebook): Promise<string> {
  const updatedNotebook: Notebook = {
    ...notebook,
    updatedAt: new Date().toISOString(),
  };

  await localDb.transaction("rw", [localDb.notebooks, localDb.milestones], async () => {
    await localDb.notebooks.put(updatedNotebook);

    if (notebook.milestones && notebook.milestones.length > 0) {
      for (const milestone of notebook.milestones) {
        await localDb.milestones.put(milestone);
      }
    }
  });

  return updatedNotebook.id;
}

/**
 * Obtiene todos los cuadernos almacenados localmente.
 */
export async function getNotebooksLocally(): Promise<Notebook[]> {
  const notebooks = await localDb.notebooks.toArray();
  // Cargar hitos asociados para cada cuaderno
  const populated = await Promise.all(
    notebooks.map(async (nb) => {
      const milestones = await localDb.milestones
        .where("notebookId")
        .equals(nb.id)
        .sortBy("order");
      return {
        ...nb,
        milestones: milestones.length > 0 ? milestones : nb.milestones || [],
      };
    })
  );
  return populated;
}

/**
 * Obtiene un cuaderno específico por su ID.
 */
export async function getNotebookByIdLocally(id: string): Promise<Notebook | undefined> {
  const notebook = await localDb.notebooks.get(id);
  if (!notebook) return undefined;

  const milestones = await localDb.milestones
    .where("notebookId")
    .equals(id)
    .sortBy("order");

  return {
    ...notebook,
    milestones: milestones.length > 0 ? milestones : notebook.milestones || [],
  };
}

/**
 * Elimina un cuaderno y sus hitos y mensajes asociados localmente.
 */
export async function deleteNotebookLocally(id: string): Promise<void> {
  await localDb.transaction(
    "rw",
    [localDb.notebooks, localDb.milestones, localDb.tutorMessages],
    async () => {
      await localDb.notebooks.delete(id);
      await localDb.milestones.where("notebookId").equals(id).delete();
      await localDb.tutorMessages.where("notebookId").equals(id).delete();
    }
  );
}

/**
 * Actualiza el estado y progreso de un hito de aprendizaje (milestone).
 */
export async function updateMilestoneProgressLocally(
  milestoneId: string,
  status: MilestoneStatus,
  completedStepIds?: string[]
): Promise<void> {
  const milestone = await localDb.milestones.get(milestoneId);
  if (!milestone) return;

  const updatedSteps = completedStepIds
    ? milestone.steps.map((step) => ({
        ...step,
        isCompleted: completedStepIds.includes(step.id),
        completedAt: completedStepIds.includes(step.id)
          ? step.completedAt || new Date().toISOString()
          : undefined,
      }))
    : milestone.steps;

  await localDb.milestones.update(milestoneId, {
    status,
    steps: updatedSteps,
    completedAt: status === "completed" || status === "mastered"
      ? new Date().toISOString()
      : undefined,
  });

  // Si el hito pertenece a un cuaderno, actualizar fecha de modificación
  if (milestone.notebookId) {
    const notebook = await localDb.notebooks.get(milestone.notebookId);
    if (notebook) {
      if (notebook.milestones) {
        const idx = notebook.milestones.findIndex(m => m.id === milestoneId);
        if (idx !== -1) {
          notebook.milestones[idx].status = status;
          notebook.milestones[idx].steps = updatedSteps;
          notebook.milestones[idx].completedAt = milestone.completedAt;
        }
      }
      notebook.updatedAt = new Date().toISOString();
      await localDb.notebooks.put(notebook);
    } else {
      await localDb.notebooks.update(milestone.notebookId, {
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Inserta o reemplaza los pasos de andamiaje (scaffolding) de un hito específico.
 */
export async function insertScaffoldingLocally(
  milestoneId: string,
  steps: ScaffoldingStep[]
): Promise<void> {
  const milestone = await localDb.milestones.get(milestoneId);
  if (!milestone) return;

  await localDb.milestones.update(milestoneId, {
    steps,
  });

  if (milestone.notebookId) {
    const notebook = await localDb.notebooks.get(milestone.notebookId);
    if (notebook) {
      if (notebook.milestones) {
        const idx = notebook.milestones.findIndex(m => m.id === milestoneId);
        if (idx !== -1) {
          notebook.milestones[idx].steps = steps;
        }
      }
      notebook.updatedAt = new Date().toISOString();
      await localDb.notebooks.put(notebook);
    } else {
      await localDb.notebooks.update(milestone.notebookId, {
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Guarda un mensaje del tutor socrático en el historial local.
 */
export async function addTutorMessageLocally(message: ChatMessage): Promise<void> {
  await localDb.tutorMessages.put(message);
}

/**
 * Obtiene el historial de mensajes de un cuaderno específico.
 */
export async function getTutorMessagesLocally(notebookId: string): Promise<ChatMessage[]> {
  return await localDb.tutorMessages
    .where("notebookId")
    .equals(notebookId)
    .sortBy("timestamp");
}

/**
 * Guarda o actualiza una configuración de usuario local.
 */
export async function saveUserSettingLocally(key: string, value: unknown): Promise<void> {
  const existing = await localDb.userSettings.where("key").equals(key).first();
  if (existing && existing.id) {
    await localDb.userSettings.update(existing.id, {
      value,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await localDb.userSettings.add({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Obtiene una configuración de usuario local por clave.
 */
export async function getUserSettingLocally<T = unknown>(key: string): Promise<T | null> {
  const setting = await localDb.userSettings.where("key").equals(key).first();
  return setting ? (setting.value as T) : null;
}

/**
 * Guarda una sesión de Kaizen localmente.
 */
export async function saveSessionLocally(session: KaizenSessionRecord): Promise<void> {
  await localDb.sessions.put(session);
}
