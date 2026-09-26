"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SupportChat() {
  const { chatOpen, setChatOpen, state } = useApp();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "support"; text: string; time: string }[]>([
    {
      sender: "support",
      text: "Hi! Ask me anything about how AuraLeads works — I know the whole product. For account actions (billing, add-ons), I'll pass it to the team.",
      time: "Just now",
    },
  ]);

  // Quick-action badges are explicit requests for a human to DO something
  // (activate a plan, enable an add-on) — those go straight to the support
  // queue, no point routing them through the AI first.
  const handleQuickAction = async (text: string) => {
    setMessages((prev) => [...prev, { sender: "user", text, time: "Just now" }]);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("support_messages").insert({ workspace_id: state.workspaceId, message: text });
    setMessages((prev) => [
      ...prev,
      {
        sender: "support",
        text: error ? "Sorry, that didn't send — please try again in a moment." : "Got it — logged to our support queue. We'll follow up by email.",
        time: "Just now",
      },
    ]);
  };

  const handleSend = async () => {
    const text = input;
    if (!text.trim() || thinking) return;

    const nextMessages = [...messages, { sender: "user" as const, text, time: "Just now" }];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    try {
      const connectedChannels = Object.entries(state.integrations || {})
        .filter(([, v]: any) => v?.connected)
        .map(([k]) => k);

      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.sender === "user" || m.sender === "support")
            .slice(-10)
            .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
          context: {
            plan: state.user.plan,
            connectedChannels,
            hashtagsCount: state.hashtags?.length,
            instagramLeadsCount: state.instagramLeads?.length,
            mapsLeadsCount: state.mapsLeads?.length,
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "support", text: data.reply || "Sorry, something went wrong — please try again.", time: "Just now" }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "support", text: "Sorry, that didn't go through — please try again in a moment.", time: "Just now" }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#3548F3] text-white shadow-xl hover:scale-105 active:scale-95 transition-all z-40 flex items-center justify-center cursor-pointer group"
          title="Open Support Chat"
          aria-label="Open Support Chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Slide-in Panel */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-[#3548F3] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  Support Chat
                  <span className="text-[10px] bg-emerald-400/20 text-white font-medium px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Open
                  </span>
                </div>
                <p className="text-[11px] text-white/80">Ask about any feature — account requests go to the team</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Close support chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Badges */}
          <div className="p-2 bg-muted/40 border-b border-border/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleQuickAction("Requesting free Early Access access for Silver tier")}
              className="px-2 py-1 rounded bg-card border border-border text-foreground hover:bg-muted font-medium shrink-0"
            >
              Request Free Silver
            </button>
            <button
              onClick={() => handleQuickAction("Requesting free Early Access access for Gold tier")}
              className="px-2 py-1 rounded bg-card border border-border text-foreground hover:bg-muted font-medium shrink-0"
            >
              Request Free Gold
            </button>
            <button
              onClick={() => handleQuickAction("Requesting Comments Scraping add-on activation")}
              className="px-2 py-1 rounded bg-card border border-border text-foreground hover:bg-muted font-medium shrink-0"
            >
              Comments Add-on
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "support" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#3548F3] text-white rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  <p>{m.text}</p>
                  <span className={`text-[9px] block mt-1 ${m.sender === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-[75%] p-3 rounded-2xl rounded-bl-none bg-muted text-muted-foreground flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border bg-card flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={thinking}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="p-2 rounded-lg bg-[#3548F3] text-white disabled:opacity-40 hover:bg-[#3548F3]/90 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
