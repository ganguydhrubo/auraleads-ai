"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

interface CompetitorsSetupViewProps {
  setCurrentView: (view: string) => void;
}

export function CompetitorsSetupView({ setCurrentView }: CompetitorsSetupViewProps) {
  const { state, addCompetitor, deleteCompetitor } = useApp();
  const [handle, setHandle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    if (state.competitors.length >= 5) {
      alert("You can add a maximum of 5 competitors per weekly cycle.");
      return;
    }
    addCompetitor(handle);
    setHandle("");
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Competitor Audience Ingestion</h2>
            <p className="text-xs text-muted-foreground">
              Add up to 5 Instagram competitors. Follower lists are scraped in background cycles to surface pre-qualified prospects.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView("competitors_leads")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span>Competitor Leads</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Form */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Manage Competitors</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add up to 5 Instagram competitor handles. Your list can be updated once per weekly cycle.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>7-Day Cycle Lock</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">@</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Enter competitor Instagram handle (e.g. apollosdr, outreach_io)..."
                className="w-full text-xs pl-7 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            <button
              type="submit"
              disabled={!handle.trim() || state.competitors.length >= 5}
              className="px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Competitor
            </button>
          </form>

          {/* Competitors List */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground block">
              Configured Competitors ({state.competitors.length}/5)
            </label>

            {state.competitors.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg bg-muted/20 text-xs text-muted-foreground">
                No competitors yet. Add competitor handles above to begin mapping follower networks.
              </div>
            ) : (
              <div className="divide-y divide-border/60 border border-border rounded-lg overflow-hidden bg-card">
                {state.competitors.map((comp) => (
                  <div key={comp.id} className="p-3.5 px-4 flex items-center justify-between hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs">
                        @{comp.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">@{comp.username}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{comp.followersCount} followers</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="w-3 h-3 text-muted-foreground" /> Locked until cycle reset
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteCompetitor(comp.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove competitor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Competitors saved! Follower scraping cycle queued.
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={state.competitors.length === 0 || isSaving}
              className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 shadow-sm transition-all flex items-center gap-2"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
              <span>{isSaving ? "Saving & Queuing Scrape..." : "Save Competitors"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
