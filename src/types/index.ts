/**
 * Maestro Kaizen - Core TypeScript Definitions
 * Progressive Web App de aprendizaje acelerado y adaptativo.
 */

// ==========================================
// 1. NIVELES DE DIFICULTAD Y PEDAGOGÍA
// ==========================================

export type DifficultyLevel =
  | "novice"       // Principiante absoluto / sin conocimientos previos
  | "beginner"     // Fundamentos y vocabulario básico
  | "intermediate" // Comprensión conceptual y aplicación guiada
  | "advanced"     // Análisis, síntesis y resolución de problemas complejos
  | "master";      // Transferencia interdisciplinaria y creación original

export type BloomTaxonomyLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

export type ScaffoldingStepType =
  | "concept"            // Introducción intuitiva o metáfora fundacional
  | "analogy"            // Puente analógico con conocimientos previos
  | "guided_example"     // Demostración paso a paso (worked example)
  | "interactive_prompt" // Pregunta socrática para activar la mente
  | "check_understanding"// Micro-desafío o pregunta de verificación
  | "challenge"          // Aplicación práctica autónoma
  | "reflection";        // Metacognición: ¿qué aprendí y cómo lo aplico?

// ==========================================
// 2. ANDAMIAJE PEDAGÓGICO (SCAFFOLDING)
// ==========================================

export interface ScaffoldingStep {
  id: string;
  milestoneId: string;
  order: number;
  type: ScaffoldingStepType;
  title: string;
  content: string;
  hint?: string;
  solution?: string;
  isCompleted: boolean;
  userNotes?: string;
  completedAt?: string;
}

// ==========================================
// 3. HITOS DE APRENDIZAJE (MILESTONES)
// ==========================================

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "mastered";

export interface Milestone {
  id: string;
  notebookId: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  targetDifficulty: DifficultyLevel;
  bloomLevel?: BloomTaxonomyLevel;
  status: MilestoneStatus;
  steps: ScaffoldingStep[];
  completedAt?: string;
  xpReward: number;
}

// ==========================================
// 4. FUENTES DE CONOCIMIENTO (SOURCES)
// ==========================================

export type SourceType =
  | "pdf"
  | "text"
  | "markdown"
  | "url"
  | "youtube"
  | "audio"
  | "manual_note";

export interface SourceDocument {
  id: string;
  notebookId: string;
  title: string;
  type: SourceType;
  content: string;
  url?: string;
  fileSize?: number;
  extractedSummary?: string;
  keyConcepts?: string[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. CUADERNO DE APRENDIZAJE (NOTEBOOK)
// ==========================================

export interface NotebookStats {
  totalSessions: number;
  totalMinutesSpent: number;
  masteryScore: number; // 0 - 100%
  completedMilestones: number;
  totalMilestones: number;
  flashcardsReviewed: number;
}

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  topic: string;
  description: string;
  currentLevel: DifficultyLevel;
  targetLevel: DifficultyLevel;
  sources: SourceDocument[];
  milestones: Milestone[];
  summary?: string;
  isArchived: boolean;
  isFavorite?: boolean;
  stats: NotebookStats;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. SESIÓN ADAPTATIVA KAIZEN (KAIZEN SESSION)
// ==========================================

// @deprecated — Not yet implemented
// export interface DifficultyAdjustment {
//   timestamp: string;
//   from: DifficultyLevel;
//   to: DifficultyLevel;
//   reason: string;
//   triggeredBy: "user_request" | "quiz_score" | "dwell_time" | "ai_evaluator";
// }

// @deprecated — Not yet implemented
// export interface KaizenSession {
//   id: string;
//   userId: string;
//   notebookId: string;
//   milestoneId?: string;
//   startedAt: string;
//   endedAt?: string;
//   durationSeconds: number;
//   focusScore?: number; // 1 a 10 (evaluación de estado de flujo)
//   notes?: string;
//   difficultyAdjustments: DifficultyAdjustment[];
//   completedStepIds: string[];
//   xpEarned: number;
// }

// ==========================================
// 7. REPETICIÓN ESPACIADA (FLASHCARDS)
// ==========================================

// @deprecated — Not yet implemented
// export type FlashcardState = "new" | "learning" | "review" | "mastered";

// @deprecated — Not yet implemented
// export interface Flashcard {
//   id: string;
//   notebookId: string;
//   milestoneId?: string;
//   front: string;
//   back: string;
//   explanation?: string;
//   intervalDays: number;
//   easeFactor: number; // Algoritmo SuperMemo SM-2 (inicia en 2.5)
//   repetitions: number;
//   nextReviewDate: string; // ISO String
//   lastReviewedDate?: string;
//   state: FlashcardState;
//   createdAt: string;
// }

// ==========================================
// 8. EVALUACIÓN DIAGNÓSTICA Y FORMATIVA (QUIZ)
// ==========================================

// @deprecated — Not yet implemented
// export interface QuizQuestion {
//   id: string;
//   notebookId: string;
//   milestoneId?: string;
//   question: string;
//   options: string[];
//   correctOptionIndex: number;
//   explanation: string;
//   difficulty: DifficultyLevel;
// }

// @deprecated — Not yet implemented
// export interface QuizAnswerSubmission {
//   questionId: string;
//   selectedOption: number;
//   isCorrect: boolean;
//   timeSpentSeconds: number;
// }

// @deprecated — Not yet implemented
// export interface QuizEvaluation {
//   id: string;
//   notebookId: string;
//   milestoneId?: string;
//   scorePercentage: number;
//   totalQuestions: number;
//   correctAnswers: number;
//   submissions: QuizAnswerSubmission[];
//   aiFeedback: string;
//   suggestedLevelAdjustment?: DifficultyLevel;
//   createdAt: string;
// }

// ==========================================
// 9. CHAT CON TUTOR SOCRÁTICO (GEMINI IA)
// ==========================================

export type MessageRole = "user" | "assistant" | "system";

export interface MessageCitation {
  sourceId: string;
  sourceTitle: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  notebookId: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  citations?: MessageCitation[];
  scaffoldingContext?: {
    milestoneId?: string;
    stepId?: string;
    currentDifficulty?: DifficultyLevel;
  };
}

// ==========================================
// 10. USUARIO Y GAMIFICACIÓN KAIZEN
// ==========================================

export interface UserPreferences {
  dailyGoalMinutes: number;
  adaptiveMode: "aggressive" | "balanced" | "gentle";
  offlineSyncEnabled: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarSeed: string;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalXp: number;
  level: number;
  preferences: UserPreferences;
  createdAt: string;
}

// ==========================================
// 11. SESIÓN Y AUTENTICACIÓN
// ==========================================

export interface AuthSession {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}
