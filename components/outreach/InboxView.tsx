"use client";

import React, { useState } from "react";
import {
  Mail,
  Send,
  Sparkles,
  Bot,
  User,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { Conversation, AIReplyRules } from "@/lib/types";

interface InboxViewProps {
  setCurrentView: (view: string) => void;
}

export function InboxView({ setCurrentView }: InboxViewProps) {
  const { state, sendMessage, updateAIReplyRules } = useApp();
  const [activeTab, setActiveTab] = useState<"leads" | "users">("leads");
  const [channelFilter, setChannelFilter] = useState<"all" | "instagram" | "email">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string>(state.conversations[0]?.id || "");
  const [replyInput, setReplyInput] = useState("");
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState<AIReplyRules>(state.aiReplyRules);

  const isConnected = state.integrations.instagram.connected;

  const conversations = state.conversations.filter((c) => {
    if (activeTab === "leads" && c.contactType !== "lead") return false;
    if (activeTab === "users" && c.contactType !== "user") return false;
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (
      searchTerm &&
      !c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.contactHandle.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const activeConversation = state.conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeConversation) return;
    sendMessage(activeConversation.id, replyInput);
    setReplyInput("");
  };

  const handleSaveRules = () => {
    updateAIReplyRules(rules);
    setShowRulesModal(false);
    alert("AI Reply Rules successfully updated! The assistant will auto-respond based on these parameters.");
  };

  return (
    <div className="space-y-4">
      {/* Non-connected banner if IG messaging is not set up */}
      {!isConnected && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Instagram Messaging not connected:</strong> Configure your Meta App credentials and webhook callback in Settings to sync live incoming DMs.
            </span>
          </div>
          <button
            onClick={() => setCurrentView("settings")}
            className="px-3 py-1 rounded bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shrink-0"
          >
            Go to Settings
          </button>
        </div>
      )}

      {/* Header and Mode Tabs */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-muted rounded-lg border border-border text-xs font-semibold">
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "leads" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Leads Inbox ({state.conversations.filter((c) => c.contactType === "lead").length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "users" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Users Inbox ({state.conversations.filter((c) => c.contactType === "user").length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">0/200</span>
            <span>DMs per hour limit</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Bot className="w-3.5 h-3.5 text-primary" />
            <span>Edit AI Reply Rules</span>
          </button>
          <button
            onClick={() => alert("Synchronized with active webhook streams and Gmail IMAP.")}
            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
            title="Sync Inboxes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3-Pane Layout */}
      <div className="grid grid-cols-12 bg-card border border-border rounded-xl shadow-sm h-[640px] overflow-hidden">
        {/* Pane 1: Contacts List (4 cols) */}
        <div className="col-span-12 md:col-span-4 border-r border-border flex flex-col h-full bg-muted/10">
          {/* Search & Channel filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            <div className="flex gap-1 text-[11px]">
              {(["all", "instagram", "email"] as const).map((chan) => (
                <button
                  key={chan}
                  onClick={() => setChannelFilter(chan)}
                  className={`flex-1 py-1 rounded text-center font-medium capitalize ${
                    channelFilter === chan
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {chan}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No active conversations matching filters.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                      {conv.contactName.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground truncate">{conv.contactName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{conv.lastActive}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">{conv.contactHandle}</div>
                      <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{lastMsg?.text || "No message"}</p>
                    </div>
                    {conv.needsHuman && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1" title="Needs human review" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pane 2: Conversation Thread (5 cols) */}
        <div className="col-span-12 md:col-span-5 flex flex-col h-full border-r border-border">
          {activeConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 px-4 border-b border-border flex items-center justify-between bg-muted/10">
                <div>
                  <h3 className="text-xs font-bold text-foreground">{activeConversation.contactName}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {activeConversation.channel === "instagram" ? "Instagram Direct" : "Gmail Thread"} · {activeConversation.contactHandle}
                  </span>
                </div>
                {activeConversation.needsHuman && (
                  <span className="text-[10px] bg-rose-500/10 text-rose-600 font-semibold px-2 py-0.5 rounded-full border border-rose-500/20">
                    Needs Human
                  </span>
                )}
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {activeConversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                        m.sender === "me"
                          ? "bg-primary text-white rounded-br-none"
                          : m.sender === "ai"
                          ? "bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 border border-indigo-500/20 rounded-bl-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      {m.sender === "ai" && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          <Bot className="w-3 h-3" /> Auto AI Reply
                        </div>
                      )}
                      <p>{m.text}</p>
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono mt-1 px-1">{m.timestamp}</span>
                  </div>
                ))}
              </div>

              {/* Compose box */}
              <form onSubmit={handleSend} className="p-3 border-t border-border flex items-center gap-2 bg-card">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={`Reply via ${activeConversation.channel === "instagram" ? "Instagram DM" : "Gmail"}...`}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Select a conversation to view thread.
            </div>
          )}
        </div>

        {/* Pane 3: Profile & AI Actions (3 cols) */}
        <div className="col-span-12 md:col-span-3 p-4 space-y-4 bg-muted/10 h-full overflow-y-auto">
          {activeConversation ? (
            <>
              <div className="text-center space-y-2 pb-3 border-b border-border">
                <div className="w-14 h-14 rounded-full bg-primary/20 text-primary font-bold text-lg flex items-center justify-center mx-auto">
                  {activeConversation.contactName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{activeConversation.contactName}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono">{activeConversation.contactHandle}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-semibold text-foreground block">Channel & Status</span>
                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Channel:</span>
                    <span className="font-medium text-foreground capitalize">{activeConversation.channel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium text-foreground capitalize">{activeConversation.contactType}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border">
                    <span className="text-muted-foreground">Human Handoff:</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        activeConversation.needsHuman
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {activeConversation.needsHuman ? "Active" : "Automated"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-card border border-border rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI Co-Pilot Draft</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  "Thanks for checking out our solution! Would tomorrow at 2 PM EST work for a quick 10-min overview?"
                </p>
                <button
                  onClick={() => setReplyInput("Thanks for checking out our solution! Would tomorrow at 2 PM EST work for a quick 10-min overview?")}
                  className="w-full py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold"
                >
                  Use Suggestion
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Edit AI Reply Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Edit AI Reply Rules</h3>
                <p className="text-xs text-muted-foreground">
                  History-aware conversational criteria for automated Instagram DM responses.
                </p>
              </div>
              <button onClick={() => setShowRulesModal(false)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                ?
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Business Definition</label>
                <textarea
                  rows={2}
                  value={rules.businessDefinition}
                  onChange={(e) => setRules({ ...rules, businessDefinition: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">1) What to tell people after they reply (history-aware)</label>
                <textarea
                  rows={2}
                  value={rules.postReplyInstruction}
                  onChange={(e) => setRules({ ...rules, postReplyInstruction: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">2) When to stop messaging them back (e.g. unsubscribe, abuse)</label>
                <textarea
                  rows={2}
                  value={rules.stopMessagingCriteria}
                  onChange={(e) => setRules({ ...rules, stopMessagingCriteria: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">3) When to tag conversation as needs human (e.g. pricing negotiation, legal)</label>
                <textarea
                  rows={2}
                  value={rules.humanHandoffCriteria}
                  onChange={(e) => setRules({ ...rules, humanHandoffCriteria: e.target.value })}
                  className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRules}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
