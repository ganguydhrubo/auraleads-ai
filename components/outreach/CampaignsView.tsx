"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  ExternalLink,
  Laptop,
  Mail,
  Instagram,
  MapPin,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

interface CampaignsViewProps {
  setCurrentView: (view: string) => void;
}

export function CampaignsView({ setCurrentView }: CampaignsViewProps) {
  const { state, createCampaign, toggleCampaignStatus, queueManualInstagramDms } = useApp();
  const [platformTab, setPlatformTab] = useState<"instagram" | "maps">("instagram");
  const [subTab, setSubTab] = useState<"automated" | "manual" | "advanced">("automated");
  const [showNewModal, setShowNewModal] = useState(false);
  const [campName, setCampName] = useState("");

  // Manual grid state — starts empty, no sample rows
  const [manualRows, setManualRows] = useState<{ id: string; username: string; message: string }[]>([
    { id: "1", username: "", message: "" },
  ]);
  const [queueStatus, setQueueStatus] = useState("");
  const [isQueuing, setIsQueuing] = useState(false);

  const campaigns = state.campaigns.filter((c) => c.channel === platformTab);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;
    await createCampaign(campName, platformTab, subTab);
    setCampName("");
    setShowNewModal(false);
  };

  const addManualRow = () => {
    setManualRows([...manualRows, { id: String(Date.now()), username: "", message: "" }]);
  };

  const removeManualRow = (id: string) => {
    setManualRows(manualRows.filter((r) => r.id !== id));
  };

  const handleQueueManual = async () => {
    setIsQueuing(true);
    const result = await queueManualInstagramDms(manualRows);
    setIsQueuing(false);
    setQueueStatus(result.message);
  };

  return (
    <div className="space-y-6">
      {/* Top Channel Switcher */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex p-1 bg-muted rounded-lg border border-border text-xs font-semibold">
          <button
            onClick={() => setPlatformTab("instagram")}
            className={`px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
              platformTab === "instagram" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Instagram className="w-3.5 h-3.5 text-rose-500" />
            <span>Instagram Outreach</span>
          </button>
          <button
            onClick={() => setPlatformTab("maps")}
            className={`px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
              platformTab === "maps" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>Maps Email Sequences</span>
          </button>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-6 px-2">
        <button
          onClick={() => setSubTab("automated")}
          className={`pb-2.5 transition-colors border-b-2 ${
            subTab === "automated"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Automated Sequences
        </button>
        <button
          onClick={() => setSubTab("manual")}
          className={`pb-2.5 transition-colors border-b-2 ${
            subTab === "manual"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Manual Grid Outreach
        </button>
        <button
          onClick={() => setSubTab("advanced")}
          className={`pb-2.5 transition-colors border-b-2 ${
            subTab === "advanced"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Advanced Auto-Send (Browser Automation)
        </button>
      </div>

      {/* SubTab 1: Automated Sequences */}
      {subTab === "automated" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{camp.name}</h3>
                    <span className="text-[10px] text-muted-foreground">Created {new Date(camp.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {camp.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Recipients</span>
                    <span className="text-xs font-bold text-foreground font-mono">{camp.recipientsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Sent</span>
                    <span className="text-xs font-bold text-primary font-mono">{camp.sentCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Replies</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">{camp.repliedCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-muted-foreground text-[11px] capitalize">{camp.mode}</span>
                  <button
                    onClick={() => toggleCampaignStatus(camp.id)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    title={camp.status === "running" ? "Pause campaign" : "Resume campaign"}
                    aria-label={camp.status === "running" ? "Pause campaign" : "Resume campaign"}
                  >
                    {camp.status === "running" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Manual Outreach */}
      {subTab === "manual" && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Send Instagram DMs to a List of Handles</h3>
              <p className="text-xs text-muted-foreground">
                Each row becomes a real lead and a real queued job on your connected Instagram browser-automation worker.
              </p>
            </div>
          </div>

          {/* Grid rows */}
          <div className="space-y-2">
            {manualRows.map((row, idx) => (
              <div key={row.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={row.username}
                  onChange={(e) => {
                    const next = [...manualRows];
                    next[idx].username = e.target.value;
                    setManualRows(next);
                  }}
                  placeholder="@username..."
                  className="w-48 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
                <input
                  type="text"
                  value={row.message}
                  onChange={(e) => {
                    const next = [...manualRows];
                    next[idx].message = e.target.value;
                    setManualRows(next);
                  }}
                  placeholder="Personalized message to send..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
                <button
                  onClick={() => removeManualRow(row.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Remove row"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={addManualRow}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>

            <div className="flex items-center gap-3">
              {queueStatus && <span className="text-[11px] text-muted-foreground">{queueStatus}</span>}
              <button
                onClick={handleQueueManual}
                disabled={isQueuing}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm disabled:opacity-50"
              >
                {isQueuing ? "Queuing..." : `Queue ${manualRows.filter((r) => r.username).length} DMs`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Advanced Auto-Send — real automation worker, not a browser extension */}
      {subTab === "advanced" && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="p-4 bg-muted/40 border border-border rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Browser Automation Worker</h4>
              <p className="text-xs text-muted-foreground">
                Bulk sends run against your own logged-in Instagram/LinkedIn session — see Settings → Browser Automation to
                connect it.
                {state.user.role === "admin" && (
                  <> (Requires a background automation worker to be running; watch job status in Admin → Automation Job Queue.)</>
                )}
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p>
              This uses your account outside Instagram's supported integration path and can trigger rate limits or restrictions.
              The worker enforces daily connection/message caps from your workspace settings — it will not blast unlimited volume.
            </p>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Create New Campaign</h3>
              <button type="button" onClick={() => setShowNewModal(false)} className="p-1 rounded text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-foreground">Campaign Name</label>
              <input
                type="text"
                required
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="e.g. Q4 B2B Founders Instagram Blitz..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
              >
                Create Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
