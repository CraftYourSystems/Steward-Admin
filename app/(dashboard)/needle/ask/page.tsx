"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNeedleChat } from "@/hooks/useNeedleAdvisor";
import { Bot, Send, Sparkles, AlertCircle, RefreshCw, Loader2, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  cards?: string[];
  source?: string;
}

const QUICK_PROMPTS = [
  "What should I order today?",
  "Show today's risks.",
  "Which ingredients are overstocked?",
  "What are my top waste sources?",
];

export default function NeedleAskPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am Needle, your operations assistant. I continuously analyze your orders, recipes, procurement activity, and waste logs. How can I help you optimize your kitchen operations today?",
    },
  ]);
  const [input, setInput] = useState("");
  const chatMutation = useNeedleChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;

    // Add user message
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync(text);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          cards: response.cards,
          source: response.source,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue retrieving operational analytics. Please try again.",
        },
      ]);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            Ask Needle
          </h1>
          <p className="text-sm text-gray-400">
            Consult with the operational engine of your restaurant in plain English.
          </p>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Clear Conversation
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 flex flex-col min-h-0 border border-white/10 rounded-2xl bg-[#070707] shadow-2xl overflow-hidden">
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "bg-[#0F0F0F] border border-white/10 text-gray-300"
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Structured Cards (evidence/suggestions) returned by Assistant */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    {msg.cards.map((card, cIdx) => (
                      <div key={cIdx} className="bg-black/45 border border-white/5 rounded-lg p-2.5 text-xs text-white">
                        {card}
                      </div>
                    ))}
                  </div>
                )}

                {msg.source && (
                  <span className="text-[10px] uppercase font-mono text-gray-500 block mt-3 text-right">
                    Source: {msg.source}
                  </span>
                )}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 text-sm text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                Needle is reviewing operational logs...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Container */}
        {messages.length === 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/5">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2">Suggested Inquiries</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(prompt)}
                  className="text-xs bg-[#121212] hover:bg-[#1A1A1A] border border-white/10 hover:border-white/20 text-gray-300 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-accent" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-black/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory, ordering, or current operations..."
              className="flex-1 bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
