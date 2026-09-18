"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Brain,
  Sparkles,
  Loader2,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Flame,
} from "lucide-react";
import { addTutorMessageLocally, getTutorMessagesLocally } from "@/db/localDb";
import type { ChatMessage, Notebook, Milestone } from "@/types";

interface TutorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  activeMilestone?: Milestone;
}

import ReactMarkdown from "react-markdown";

function renderMarkdownContent(text: string): React.ReactNode {
  return (
    <div className="prose prose-invert prose-xs max-w-none text-zinc-200 leading-relaxed space-y-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-emerald-300 [&_code]:font-mono [&_pre]:bg-zinc-950 [&_pre]:p-2.5 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-zinc-800 [&_strong]:text-zinc-100 [&_strong]:font-semibold">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

export default function TutorSidebar({
  isOpen,
  onClose,
  notebook,
  activeMilestone,
}: TutorSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMilestone =
    activeMilestone ||
    notebook.milestones.find((m) => m.status === "in_progress") ||
    notebook.milestones[0];

  useEffect(() => {
    if (notebook.id) {
      getTutorMessagesLocally(notebook.id).then((saved) => {
        if (saved.length === 0) {
          const initialMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            notebookId: notebook.id,
            role: "assistant",
            content: `¡Hola! Soy tu Maestro Kaizen para **${notebook.title}**.
Estoy aquí para acompañarte paso a paso. Puedes preguntarme sobre técnicas biomecánicas, puntos ciegos, dudas conceptuales o pedirme que descomponga cualquier paso que te cueste trabajo.`,
            timestamp: Date.now(),
          };
          addTutorMessageLocally(initialMessage).catch(err => console.error("Error saving initial message:", err));
          setMessages([initialMessage]);
        } else {
          setMessages(saved);
        }
      }).catch(err => console.error("Error loading tutor messages:", err));
    }
  }, [notebook]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      notebookId: notebook.id,
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsStreaming(true);

    try {
      await addTutorMessageLocally(userMsg);
    } catch (err) {
      console.error("Error saving user message locally:", err);
    }

    const tempAiId = `msg-ai-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempAiId,
        notebookId: notebook.id,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      },
    ]);

    try {
      const customKey = typeof window !== "undefined"
        ? localStorage.getItem("mk_gemini_api_key") || ""
        : "";

      const sourcesSummary = notebook.sources
        ?.filter(s => s.type !== 'manual_note' && (s.url || s.content))
        .map(s => `[${s.type.toUpperCase()}] ${s.title}: ${s.url || s.content?.slice(0, 200)}`)
        .join('\n') || '';

      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customKey ? { "x-gemini-api-key": customKey } : {}),
        },
        body: JSON.stringify({
          messages: newHistory,
          notebookContext: {
            title: notebook.title,
            topic: notebook.topic,
            currentMilestone: currentMilestone ? `Día ${currentMilestone.order}: ${currentMilestone.title}` : "General",
            currentDifficulty: notebook.currentLevel,
          },
          userNotes: notebook.sources?.filter(s => s.type === 'manual_note').map((s) => `${s.title}: ${s.content}`).join("\n\n") || "",
          userSources: sourcesSummary,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Tutor API error:', res.status, errorText);
        // Show a friendly error as assistant message instead of raw JSON
        const errorMsg: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          notebookId: notebook.id,
          role: 'assistant',
          content: '⚠️ Hubo un problema al conectar con el tutor. Por favor intenta de nuevo en unos segundos.',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev.slice(0, -1), errorMsg]); // Replace placeholder
        await addTutorMessageLocally(errorMsg);
        setIsStreaming(false);
        return;
      }

      if (!res.body) throw new Error("Sin cuerpo de respuesta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamed = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamed += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;
          updated[last] = { ...updated[last], content: streamed };
          return updated;
        });
      }

      const finalAssistantMsg: ChatMessage = {
        id: tempAiId,
        notebookId: notebook.id,
        role: "assistant",
        content: streamed,
        timestamp: Date.now(),
      };
      
      try {
        await addTutorMessageLocally(finalAssistantMsg);
      } catch (err) {
        console.error("Error saving assistant message locally:", err);
      }
    } catch (err) {
      console.error("Error en TutorSidebar streaming:", err);
      const errorMsg: ChatMessage = {
        id: `msg-error-${Date.now()}`,
        notebookId: notebook.id,
        role: "assistant",
        content: "⚠️ Ocurrió un error inesperado al conectar con el tutor.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header tipo Sheet */}
        <div className="px-5 py-4 border-b border-border bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                Tutor Socrático Kaizen
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  24/7
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[210px]">
                {currentMilestone ? `Contexto: Día ${currentMilestone.order}` : notebook.title}
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

        {/* Banner de Contexto Activo */}
        {currentMilestone && (
          <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400 truncate flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <strong className="text-zinc-200 truncate">{currentMilestone.title}</strong>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">
              {currentMilestone.status}
            </span>
          </div>
        )}

        {/* Chat Stream Messages */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[90%] flex flex-col gap-1 ${
                m.role === "user"
                  ? "ml-auto bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 rounded-br-none"
                  : "mr-auto bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm"
              }`}
            >
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                {m.role === "user" ? "Tú" : "Maestro Kaizen"}
              </span>
              {m.role === 'assistant' ? renderMarkdownContent(m.content || (isStreaming ? "..." : "")) : <p className="whitespace-pre-line">{m.content}</p>}
            </div>
          ))}

          <div ref={scrollRef} />
        </div>

        {/* Tips / Sugerencias de Pregunta Rápida */}
        <div className="px-4 py-2 border-t border-border/50 bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px] text-zinc-400">
          <button
            onClick={() => handleSend("¿Cuál es la clave técnica principal de hoy?")}
            disabled={isStreaming}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 shrink-0 transition-colors"
          >
            🎯 Clave técnica de hoy
          </button>
          <button
            onClick={() => handleSend("Siento fatiga, ¿cómo ajusto la sesión?")}
            disabled={isStreaming}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 shrink-0 transition-colors"
          >
            ⚡ Ajustar por fatiga
          </button>
          <button
            onClick={() => handleSend("Dame una analogía para visualizar este hito")}
            disabled={isStreaming}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 shrink-0 transition-colors"
          >
            💡 Analogía mental
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-border bg-zinc-950/90 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale al tutor sobre postura, técnica, bloqueo..."
            disabled={isStreaming}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
