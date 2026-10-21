"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  ChevronDown,
  Navigation,
  Compass,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Minimize2
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Array<{
    label: string;
    type: "PLAN_ROUTE" | "CHECK_DISRUPTIONS" | "OPEN_DASHBOARD" | "FILTER_CHEAPEST";
    payload?: any;
  }>;
  timestamp: string;
}

const STARTER_PROMPTS = [
  "How can I get from Dadar to BKC fastest?",
  "Compare train vs metro from Churchgate to Andheri",
  "What is the cheapest way to travel from Thane to Lower Parel?",
  "Are there any mega blocks today?"
];

export const RouteSenseAssistantChat: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      role: "assistant",
      content:
        "Namaste! I am your **Route Sense Mumbai Assistant**. I can compare local trains, metro lines, and BEST buses, calculate verified fares, and alert you to railway mega-blocks or monsoon disruptions.\n\nHow can I help your commute today?",
      actions: [
        { label: "Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/chat/route-sense-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: "assistant",
        content: data.reply || "I am analyzing your route request across the Mumbai transit network.",
        actions: data.actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered a temporary connection issue. Please check your network or try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; type: string; payload?: any }) => {
    if (action.type === "CHECK_DISRUPTIONS") {
      router.push("/disruptions");
      setIsOpen(false);
    } else if (action.type === "OPEN_DASHBOARD") {
      router.push("/dashboard");
      setIsOpen(false);
    } else if (action.type === "PLAN_ROUTE") {
      if (action.payload?.origin && action.payload?.destination) {
        router.push(
          `/?origin=${encodeURIComponent(action.payload.origin)}&dest=${encodeURIComponent(action.payload.destination)}`
        );
      } else {
        router.push("/#journey-planner");
      }
      setIsOpen(false);
    } else if (action.type === "FILTER_CHEAPEST") {
      router.push("/#journey-passes");
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans">
      {/* 1. FLOATING CHAT TRIGGER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 text-white font-extrabold text-xs shadow-2xl shadow-sky-950/70 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
          </div>
          <span className="tracking-wide">Ask Route Sense AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping absolute -top-0.5 -right-0.5" />
        </button>
      )}

      {/* 2. CHAT WINDOW MODAL */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[560px] rounded-[32px] bg-slate-900/95 backdrop-blur-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden text-white animate-fade-in relative">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 p-[1.5px] shadow-md">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-sky-300" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Route Sense Assistant</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </h4>
                <p className="text-[10px] text-stone-400 font-mono">
                  Gemini &bull; Mumbai Transit Intelligence
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-sky-600 to-teal-600 text-white rounded-br-none shadow-md font-medium"
                      : "bg-white/10 text-stone-100 rounded-bl-none border border-white/10 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line text-xs">{msg.content}</p>

                  {/* Interactive Action Chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          className="px-2.5 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-[10px] font-bold text-sky-200 transition-all cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-stone-500 mt-1 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-stone-400 p-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>Checking Mumbai timetable &amp; corridor tariffs...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter Prompts Carousel */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 border-t border-white/5 bg-black/20 flex items-center gap-1.5 overflow-x-auto">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-stone-300 hover:text-white transition-all whitespace-nowrap cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 border-t border-white/10 bg-slate-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about trains, metro, fares, blocks..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-full bg-white/10 border border-white/15 text-xs text-white placeholder-stone-400 outline-none focus:border-sky-400 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-500 to-teal-500 hover:opacity-95 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
