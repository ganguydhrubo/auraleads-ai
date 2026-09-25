"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Mail,
  Send,
  MessageSquare,
  Instagram,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

export function DashboardView() {
  const { state } = useApp();
  const [activeSourceTab, setActiveSourceTab] = useState<"all" | "instagram" | "maps">("all");

  const totalInstagram = state.instagramLeads.length;
  const matchedInstagram = state.instagramLeads.filter((l) => l.decision === "matched").length;
  const blockedInstagram = state.instagramLeads.filter((l) => l.decision === "blocked").length;

  const totalMaps = state.mapsLeads.length;
  const revealedMaps = state.mapsLeads.filter((l) => l.revealed).length;

  const totalLeads = totalInstagram + totalMaps;
  const totalSent = 85 + 42 + state.user.usage.dmsSentToday;
  const totalReplied = 18 + 9 + 2;
  const overallRate = Math.round((totalReplied / totalSent) * 100);

  return (
    <div className="space-y-6">
      {/* Top Funnel Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total All Sources */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Leads Collected</span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">All Sources</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{totalLeads}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2% this cycle
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/60">
            <span>Matched: <strong className="text-foreground">{matchedInstagram + revealedMaps}</strong></span>
            <span>·</span>
            <span>Blocked: <strong className="text-foreground">{blockedInstagram}</strong></span>
          </div>
        </div>

        {/* Instagram Sourcing */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Instagram Discovery</span>
            <Instagram className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{totalInstagram}</span>
            <span className="text-xs text-muted-foreground">profiles scraped</span>
          </div>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/60">
            <span>Hashtag: <strong className="text-foreground">{state.instagramLeads.filter((l) => l.source === "hashtag").length}</strong></span>
            <span>·</span>
            <span>Competitor: <strong className="text-foreground">{state.instagramLeads.filter((l) => l.source === "competitor").length}</strong></span>
          </div>
        </div>

        {/* Google Maps Sourcing */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Google Maps Places</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{revealedMaps}</span>
            <span className="text-xs text-muted-foreground">revealed / {totalMaps} places</span>
          </div>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/60">
            <span>Verified Phone & Email: <strong className="text-foreground">{revealedMaps}</strong></span>
          </div>
        </div>
      </div>

      {/* Response Performance Cards */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Response & Conversion Performance</h3>
            <p className="text-xs text-muted-foreground">
              {totalReplied} / {totalSent} replies detected across outreach channels ({overallRate}% overall reply rate)
            </p>
          </div>
          <button
            onClick={() => alert("Reconciled metrics with webhook logs.")}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground block">Instagram DM Reply Rate</span>
            <span className="text-xl font-bold text-foreground font-mono">21.2%</span>
            <span className="text-[11px] text-muted-foreground block">18 replies · 85 sent</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground block">Google Maps Email Replies</span>
            <span className="text-xl font-bold text-foreground font-mono">21.4%</span>
            <span className="text-[11px] text-muted-foreground block">9 replies · 42 sent</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground block">Email Open Signals</span>
            <span className="text-xl font-bold text-foreground font-mono">54.8%</span>
            <span className="text-[11px] text-muted-foreground block">Tracking pixel verified</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground block">Human Handoff Qualified</span>
            <span className="text-xl font-bold text-primary font-mono">4 meetings</span>
            <span className="text-[11px] text-muted-foreground block">Flagged for sales rep</span>
          </div>
        </div>
      </div>

      {/* Attribution Panels: Hashtags & Competitors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hashtag Performance */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs font-bold text-foreground">Hashtag Conversion Yield</h4>
            <span className="text-[10px] text-muted-foreground">Weekly Attribution</span>
          </div>
          <div className="divide-y divide-border/60 text-xs">
            {state.hashtags.map((h) => (
              <div key={h.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground font-mono">{h.tag}</span>
                  <span className="text-[11px] text-muted-foreground block">{h.postsCount} total volume</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-emerald-600">92% Match Yield</span>
                  <span className="text-[10px] text-muted-foreground block">Score: {h.validationScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor Performance */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs font-bold text-foreground">Competitor Audience Yield</h4>
            <span className="text-[10px] text-muted-foreground">Follower Quality</span>
          </div>
          <div className="divide-y divide-border/60 text-xs">
            {state.competitors.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">@{c.username}</span>
                  <span className="text-[11px] text-muted-foreground block">{c.followersCount} audience</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-primary">24% Reply Rate</span>
                  <span className="text-[10px] text-muted-foreground block">Locked Cycle</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
