"use client";

import React, { useState } from "react";
import {
  Building2,
  Sparkles,
  MapPin,
  Hash,
  Trash2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

interface HashtagsSetupViewProps {
  setCurrentView: (view: string) => void;
}

export function HashtagsSetupView({ setCurrentView }: HashtagsSetupViewProps) {
  const { state, updateBusinessProfile, generateHashtagsAI, addHashtag, deleteHashtag } = useApp();
  const [description, setDescription] = useState(state.businessProfile.description);
  const [region, setRegion] = useState(state.businessProfile.targetRegion);
  const [manualTag, setManualTag] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    updateBusinessProfile({ description, targetRegion: region });
    await generateHashtagsAI(description, region);
    setIsGenerating(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTag.trim()) return;
    addHashtag(manualTag);
    setManualTag("");
  };

  const weeklyCap = state.user.limits.hashtagsWeek;
  const usedCount = state.hashtags.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Quota */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Weekly Hashtag Capacity</h2>
            <p className="text-xs text-muted-foreground">
              You are using <span className="font-semibold text-foreground">{usedCount}</span> of{" "}
              <span className="font-semibold text-foreground">{weeklyCap}</span> allowed hashtags on your{" "}
              <span className="font-semibold text-primary">{state.user.plan}</span> plan.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView("hashtags_leads")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span>View Leads</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Card: Define Your Business */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Define Your Business</h3>
              <p className="text-xs text-muted-foreground">
                Tell us about your business and the type of people or companies you want to contact.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Field 1: Business Definition */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Business Definition & Preferred Contacts</span>
              <span className="text-[11px] text-muted-foreground font-normal">Multi-line textarea</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. We are an outbound lead generation agency targeting small business owners, SaaS founders, and startup CEOs with 10-500 employees looking to scale sales pipeline without hiring more SDRs..."
              className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              Used by the AI engine to analyze market positioning and suggest high-intent Instagram discovery hashtags.
            </p>
          </div>

          {/* Field 2: Target Location or Region */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Target Location or Region</span>
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="United States, Europe, New York City, London, Global, North America..."
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
            />
            <p className="text-[11px] text-muted-foreground">
              Geographic scope helps tailor location-relevant hashtags and filter out non-target geographies.
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Hashtags generated and cycle updated!
                </span>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={!description.trim() || isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Generating & Validating..." : "Generate Hashtags"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hashtag Research Panel */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 px-6 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Active Hashtag Research Panel</h3>
            <p className="text-xs text-muted-foreground">
              Real-time validation score, post volume, and suitability ratings for your weekly cycle.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {usedCount}/{weeklyCap} slots used
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* Add custom tag input */}
          <form onSubmit={handleAddManual} className="flex gap-2">
            <input
              type="text"
              value={manualTag}
              onChange={(e) => setManualTag(e.target.value)}
              placeholder="Add custom hashtag (e.g. #marketingconsultant)..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <button
              type="submit"
              disabled={!manualTag.trim() || usedCount >= weeklyCap}
              className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-muted border border-border disabled:opacity-40"
            >
              Add Hashtag
            </button>
          </form>

          {/* Hashtags list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {state.hashtags.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-lg border border-border bg-card flex items-center justify-between hover:border-primary/40 transition-colors shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground font-mono">{h.tag}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 font-semibold uppercase">
                      {h.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      {h.postsCount} posts
                    </span>
                    <span>·</span>
                    <span>Validation {h.validationScore}%</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteHashtag(h.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove hashtag"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
