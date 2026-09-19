"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  BookOpen,
  Eye,
  Search,
  ExternalLink,
  LifeBuoy,
  Sparkles,
  CheckCircle2,
  Check,
  AlertTriangle,
  Zap,
  Clock,
  Target,
  Brain,
  Send,
  Loader2,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
import CheckInDialog from "./CheckInDialog";
import PracticeTimer from "./PracticeTimer";
import { generateYouTubeQueries } from "@/lib/youtubeQueryUtils";
import { addTutorMessageLocally, getTutorMessagesLocally } from "@/db/localDb";
import type { Milestone, ScaffoldingStep, Notebook, ChatMessage } from "@/types";

interface MilestoneDayViewProps {
  milestone: Milestone | null;
  notebook: Notebook;
  isOpen: boolean;
  onClose: () => void;
  isCurrent: boolean;
  isCapstone?: boolean;
  notebookTopic?: string;
  onToggleStep: (milestoneId: string, stepId: string) => void;
  onCompleteMilestone: (milestoneId: string) => void;
  onInsertScaffolding: (milestoneId: string, step: ScaffoldingStep) => void;
  onTriggerMastery?: () => void;
}

// Simple markdown renderer (no external deps)
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const processInline = (line: string): React.ReactNode => {
    const segments: React.ReactNode[] = [];
    const codeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let segKey = 0;
    while ((match = codeRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        const textPart = line.slice(lastIndex, match.index);
        const boldParts = textPart.split(/\*\*(.+?)\*\*/g);
        boldParts.forEach((p, i) => {
          segments.push(i % 2 === 1 ? <strong key={segKey++}>{p}</strong> : <span key={segKey++}>{p}</span>);
        });
      }
      segments.push(<code key={segKey++} className="bg-zinc-700 px-1.5 py-0.5 rounded text-emerald-300 text-xs">{match[1]}</code>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      const textPart = line.slice(lastIndex);
      const boldParts = textPart.split(/\*\*(.+?)\*\*/g);
      boldParts.forEach((p, i) => {
        segments.push(i % 2 === 1 ? <strong key={segKey++}>{p}</strong> : <span key={segKey++}>{p}</span>);
      });
    }
    return segments.length === 1 ? segments[0] : segments;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={key++} className="list-disc list-inside space-y-0.5 my-1">{listItems.map((item, i) => <li key={i}>{processInline(item)}</li>)}</ul>);
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) { flushList(); elements.push(<h3 key={key++} className="font-bold text-sm mt-1">{processInline(trimmed.slice(4))}</h3>); }
    else if (trimmed.startsWith('## ')) { flushList(); elements.push(<h2 key={key++} className="font-bold text-base mt-1">{processInline(trimmed.slice(3))}</h2>); }
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) { listItems.push(trimmed.slice(2)); }
    else if (trimmed === '') { flushList(); }
    else { flushList(); elements.push(<p key={key++} className="my-0.5">{processInline(trimmed)}</p>); }
  }
  flushList();
  return <div className="space-y-0.5">{elements}</div>;
}

export default function MilestoneDayView({
  milestone,
  notebook,
  isOpen,
  onClose,
  isCurrent,
  isCapstone = false,
  notebookTopic = "",
  onToggleStep,
  onCompleteMilestone,
  onInsertScaffolding,
  onTriggerMastery,
}: MilestoneDayViewProps) {
  // CheckIn state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInMode, setCheckInMode] = useState<"adecuado" | "bloqueado">("adecuado");

  // Coach/Tutor state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat messages when milestone changes
  useEffect(() => {
    if (!isOpen || !milestone) return;
    setIsCheckInOpen(false);
    getTutorMessagesLocally(notebook.id).then((saved) => {
      if (saved.length === 0) {
        const welcomeMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          notebookId: notebook.id,
          role: "assistant",
          content: `¡Hola! Soy tu Coach Kaizen para **${notebook.title}**.\n\nEstoy aquí para acompañarte en **Día ${milestone.order}: ${milestone.title}**. Puedes preguntarme sobre técnicas, conceptos o pedirme que descomponga cualquier paso.`,
          timestamp: Date.now(),
        };
        addTutorMessageLocally(welcomeMsg).catch(console.error);
        setMessages([welcomeMsg]);
        // Auto-send contextual intro for active milestones
        if (milestone.status === "in_progress") {
          setTimeout(() => {
            const introMsg = `¡Empecemos el Día ${milestone.order}! Trabajarás en: **${milestone.title}**. ¿Tienes alguna duda sobre la técnica o quieres que te explique el porqué de este ejercicio?`;
            handleSendChat(introMsg);
          }, 800);
        }
      } else {
        setMessages(saved);
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, milestone?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChat = useCallback(async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput.trim();
    if (!textToSend || isStreaming || !milestone) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      notebookId: notebook.id,
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatInput("");
    setIsStreaming(true);
    try { await addTutorMessageLocally(userMsg); } catch { /* ignore */ }

    const tempId = `msg-ai-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, notebookId: notebook.id, role: "assistant", content: "", timestamp: Date.now() }]);

    try {
      const customKey = typeof window !== "undefined" ? localStorage.getItem("mk_gemini_api_key") || "" : "";
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(customKey ? { "x-gemini-api-key": customKey } : {}) },
        body: JSON.stringify({
          messages: newHistory,
          notebookContext: {
            title: notebook.title,
            topic: notebook.topic,
            currentMilestone: `Día ${milestone.order}: ${milestone.title}`,
            currentDifficulty: notebook.currentLevel,
          },
          userNotes: "",
          userSources: "",
        }),
      });

      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamed = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        streamed += decoder.decode(value, { stream: true });
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: streamed }; return u; });
      }
      const finalMsg: ChatMessage = { id: tempId, notebookId: notebook.id, role: "assistant", content: streamed, timestamp: Date.now() };
      try { await addTutorMessageLocally(finalMsg); } catch { /* ignore */ }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { id: `err-${Date.now()}`, notebookId: notebook.id, role: "assistant", content: "⚠️ Error al conectar con el coach. Intenta de nuevo.", timestamp: Date.now() }
      ]);
    } finally {
      setIsStreaming(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatInput, isStreaming, messages, milestone, notebook]);

  if (!isOpen || !milestone) return null;

  const isCompleted = milestone.status === "completed" || milestone.status === "mastered";
  const scaffoldSteps = milestone.steps.filter(s => s.order === 0 || s.title.includes("Escalón Previo") || s.title.includes("⚡"));
  const regularSteps = milestone.steps.filter(s => s.order !== 0 && !s.title.includes("Escalón Previo") && !s.title.includes("⚡"));
  const isBlocked = scaffoldSteps.length > 0 && !isCompleted;
  const completedSteps = regularSteps.filter(s => s.isCompleted).length;
  const stepProgress = regularSteps.length > 0 ? Math.round((completedSteps / regularSteps.length) * 100) : isCompleted ? 100 : 0;

  const sensoryFocusText = milestone.steps[0]?.content || "";
  let sensoryFocus = "Atención plena en cada detalle del proceso.";
  if (sensoryFocusText.includes("Foco sensorial:")) sensoryFocus = sensoryFocusText.split("Foco sensorial:")[1]?.trim() || sensoryFocus;
  else if (sensoryFocusText.includes("Foco:")) sensoryFocus = sensoryFocusText.split("Foco:")[1]?.trim() || sensoryFocus;

  const ytQueries = generateYouTubeQueries(milestone.title, notebookTopic);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden">
      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Hoja de Ruta</span>
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black border text-sm ${
              isCompleted ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
              isCapstone ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 border-amber-300" :
              isCurrent ? "bg-emerald-500 text-zinc-950 border-emerald-400" :
              "bg-zinc-800 border-zinc-700 text-zinc-400"
            }`}>
              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : isCapstone ? <Sparkles className="h-4 w-4 fill-zinc-950" /> : milestone.order}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-zinc-500">Día {milestone.order}</span>
                {isCapstone && <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">★ Final</span>}
                {isCurrent && !isCompleted && <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">Hito de Hoy</span>}
                {isCompleted && <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">✓ Completado</span>}
                {isBlocked && <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Escalón</span>}
              </div>
              <h1 className="text-base font-bold text-zinc-100 leading-tight">{milestone.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{milestone.estimatedMinutes} min · {milestone.targetDifficulty}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT: two panels */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT PANEL: Milestone Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">

          {/* Clave Técnica - PROMINENT */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Eye className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono uppercase font-bold text-emerald-400 tracking-wide">🎯 Clave Técnica del Día</span>
              <p className="text-sm text-zinc-100 leading-relaxed font-medium">{sensoryFocus}</p>
            </div>
          </div>

          {/* Micro-Teoría */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>El Porqué — Micro-Teoría Kaizen</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{milestone.description}</p>
          </div>

          {/* Escalón Previo */}
          {scaffoldSteps.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-2 border-amber-500/40 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Zap className="h-4 w-4 fill-amber-400/20" />
                <span>⚡ Escalón Previo de Desbloqueo</span>
              </div>
              {scaffoldSteps.map(scaffold => (
                <button key={scaffold.id} onClick={() => onToggleStep(milestone.id, scaffold.id)}
                  className={`w-full text-left p-3.5 rounded-xl flex items-start gap-3 border transition-all ${
                    scaffold.isCompleted ? "bg-emerald-500/15 border-emerald-500/40" : "bg-zinc-950/70 border-amber-500/30 hover:border-amber-400/50"
                  }`}>
                  <div className={`h-5 w-5 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                    scaffold.isCompleted ? "bg-emerald-500 border-emerald-400 text-zinc-950" : "border-amber-500/60 bg-zinc-900"
                  }`}>
                    {scaffold.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-amber-300 text-sm">{scaffold.title}</span>
                    <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">{scaffold.content}</p>
                    {scaffold.hint && <span className="text-xs text-amber-400/90 italic">💡 {scaffold.hint}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Practice Timer */}
          {isCurrent && milestone.status !== 'completed' && milestone.status !== 'mastered' && (
            <PracticeTimer milestoneId={milestone.id} notebookId={milestone.notebookId} estimatedMinutes={milestone.estimatedMinutes} />
          )}

          {/* Objetivos del Día */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-300">Objetivos del Día</span>
              </div>
              {regularSteps.length > 0 && <span className="text-xs font-mono text-zinc-500">{completedSteps}/{regularSteps.length} completados</span>}
            </div>
            {regularSteps.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${stepProgress}%` }} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              {regularSteps.map((step, index) => (
                <button key={step.id} onClick={() => onToggleStep(milestone.id, step.id)}
                  className={`w-full text-left p-4 rounded-xl flex items-start gap-3 border transition-all ${
                    step.isCompleted ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}>
                  <div className={`h-5 w-5 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                    step.isCompleted ? "bg-emerald-500 border-emerald-400 text-zinc-950" : "border-zinc-600 bg-zinc-900"
                  }`}>
                    {step.isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <span className="text-[10px] font-mono text-zinc-500">{index + 1}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-zinc-100 leading-tight">Objetivo: {step.title}</span>
                    <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{step.content}</p>
                    {step.hint && <span className="text-xs text-amber-400/90 italic">💡 {step.hint}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* YouTube Links */}
          <div className="flex flex-col gap-2 pb-2">
            <span className="text-xs font-mono uppercase text-zinc-500 font-medium">Recursos en YouTube</span>
            <div className="flex flex-col gap-1.5">
              {ytQueries.map((q, i) => (
                <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q.query)}`}
                  target="_blank" rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 text-sm font-medium flex items-center gap-2 transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">{q.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 ml-auto shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Embedded Coach */}
        <div className="w-full lg:w-96 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col bg-zinc-900/40" style={{ minHeight: '320px', maxHeight: '50vh' }} data-embedded-coach>
          {/* Coach Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2.5 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Coach Kaizen</h3>
              <p className="text-xs text-zinc-500">Día {milestone.order} · Socrático</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
            {messages.map(m => (
              <div key={m.id} className={`p-3 rounded-xl text-sm leading-relaxed max-w-[92%] ${
                m.role === "user"
                  ? "ml-auto bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 rounded-br-none"
                  : "mr-auto bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-bl-none"
              }`}>
                <span className="text-xs font-mono text-zinc-500 uppercase block mb-1">
                  {m.role === "user" ? "Tú" : "Coach"}
                </span>
                {m.role === 'assistant' ? renderMarkdown(m.content || (isStreaming ? "..." : "")) : <p>{m.content}</p>}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-1.5 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto">
            {[
              { label: "🎯 Clave técnica", msg: "¿Cuál es la clave técnica principal de hoy?" },
              { label: "⚡ Estoy bloqueado", msg: "Estoy bloqueado en este paso, ¿cómo lo simplifico?" },
              { label: "💡 Dame un ejemplo", msg: "Dame un ejemplo concreto o analogía para visualizar este hito" },
            ].map((p, i) => (
              <button key={i} onClick={() => handleSendChat(p.msg)} disabled={isStreaming}
                className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 shrink-0 transition-colors disabled:opacity-50">
                {p.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); handleSendChat(); }} className="p-3 border-t border-zinc-800 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Pregunta al coach sobre este día..."
              disabled={isStreaming}
              className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button type="submit" disabled={!chatInput.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50">
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM FOOTER ACTIONS */}
      <div className="border-t border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center gap-3 shrink-0 bg-zinc-950">
        {!isCompleted ? (
          <>
            <button onClick={() => { setCheckInMode("bloqueado"); setIsCheckInOpen(true); }}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center gap-2 transition-colors">
              <LifeBuoy className="h-4 w-4" />
              <span>Estoy Bloqueado</span>
            </button>
            <button onClick={() => { setCheckInMode("adecuado"); setIsCheckInOpen(true); }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Completar Hito / Check-in</span>
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-emerald-400 py-1">
            <CheckCircle2 className="h-5 w-5" />
            <span>Hito Consolidado ✓</span>
          </div>
        )}
      </div>

      {/* CheckIn Dialog */}
      <CheckInDialog
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        milestone={milestone}
        initialDifficulty={checkInMode}
        notebookTopic={notebookTopic}
        onCompleteMilestone={id => { onCompleteMilestone(id); onClose(); if (isCapstone) onTriggerMastery?.(); }}
        onInsertScaffolding={onInsertScaffolding}
      />
    </div>
  );
}
