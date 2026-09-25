"use client";

import React from "react";
import { RefreshCw, Instagram, MapPin, MessageCircle, Twitter, Linkedin } from "lucide-react";
import { useApp } from "@/lib/store/app-store";

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function DashboardView() {
  const { state, refresh } = useApp();

  const totalInstagram = state.instagramLeads.length;
  const matchedInstagram = state.instagramLeads.filter((l) => l.decision === "matched").length;
  const blockedInstagram = state.instagramLeads.filter((l) => l.decision === "blocked").length;
  const igSent = state.instagramLeads.filter((l) => l.dmSent).length;
  const igReplied = state.instagramLeads.filter((l) => l.replied).length;

  const totalMaps = state.mapsLeads.length;
  const revealedMaps = state.mapsLeads.filter((l) => l.revealed).length;

  const totalLinkedIn = state.linkedinLeads.length;
  const liSent = state.linkedinLeads.filter((l) => l.messageSent).length;
  const liReplied = state.linkedinLeads.filter((l) => l.replied).length;

  const totalWhatsapp = state.whatsappLeads.length;
  const waSent = state.whatsappLeads.filter((l) => l.messageSent).length;
  const waReplied = state.whatsappLeads.filter((l) => l.replied).length;

  const totalX = state.xLeads.length;
  const xSent = state.xLeads.filter((l) => l.dmSent).length;
  const xReplied = state.xLeads.filter((l) => l.replied).length;

  const totalLeads = totalInstagram + totalMaps + totalLinkedIn + totalWhatsapp + totalX;
  const matchedTotal = matchedInstagram + revealedMaps + state.linkedinLeads.filter((l) => l.decision === "matched").length + state.whatsappLeads.filter((l) => l.decision === "matched").length + state.xLeads.filter((l) => l.decision === "matched").length;
  const blockedTotal = blockedInstagram + [...state.linkedinLeads, ...state.whatsappLeads, ...state.xLeads].filter((l) => l.decision === "blocked").length;

  const totalSent = igSent + liSent + waSent + xSent;
  const totalReplied = igReplied + liReplied + waReplied + xReplied;

  const channelCards = [
    { label: "Instagram", icon: <Instagram className="w-4 h-4 text-rose-500" />, total: totalInstagram, sent: igSent, replied: igReplied },
    { label: "LinkedIn", icon: <Linkedin className="w-4 h-4 text-blue-600" />, total: totalLinkedIn, sent: liSent, replied: liReplied },
    { label: "WhatsApp", icon: <MessageCircle className="w-4 h-4 text-emerald-500" />, total: totalWhatsapp, sent: waSent, replied: waReplied },
    { label: "X", icon: <Twitter className="w-4 h-4 text-sky-500" />, total: totalX, sent: xSent, replied: xReplied },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Leads Collected</span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">All Sources</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{totalLeads}</span>
          </div>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/60">
            <span>Matched: <strong className="text-foreground">{matchedTotal}</strong></span>
            <span>·</span>
            <span>Blocked: <strong className="text-foreground">{blockedTotal}</strong></span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Instagram Discovery</span>
            <Instagram className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{totalInstagram}</span>
            <span className="text-xs text-muted-foreground">profiles found</span>
          </div>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/60">
            <span>Hashtag: <strong className="text-foreground">{state.instagramLeads.filter((l) => l.source === "hashtag").length}</strong></span>
            <span>·</span>
            <span>Competitor: <strong className="text-foreground">{state.instagramLeads.filter((l) => l.source === "competitor").length}</strong></span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Google Maps Places</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{revealedMaps}</span>
            <span className="text-xs text-muted-foreground">revealed / {totalMaps} places</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Response & Conversion Performance</h3>
            <p className="text-xs text-muted-foreground">
              {totalReplied} / {totalSent} replies detected across outreach channels ({pct(totalReplied, totalSent)} overall reply rate)
            </p>
          </div>
          <button onClick={() => refresh()} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {channelCards.map((c) => (
            <div key={c.label} className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5">{c.icon} {c.label} Reply Rate</span>
              <span className="text-xl font-bold text-foreground font-mono">{pct(c.replied, c.sent)}</span>
              <span className="text-[11px] text-muted-foreground block">{c.replied} replies · {c.sent} sent</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs font-bold text-foreground">Hashtag Conversion Yield</h4>
            <span className="text-[10px] text-muted-foreground">By source_ref match</span>
          </div>
          <div className="divide-y divide-border/60 text-xs">
            {state.hashtags.map((h) => {
              const fromTag = state.instagramLeads.filter((l) => l.sourceRef === h.tag);
              const matched = fromTag.filter((l) => l.decision === "matched").length;
              return (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground font-mono">{h.tag}</span>
                    <span className="text-[11px] text-muted-foreground block">{h.postsCount} total volume</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-emerald-600">{pct(matched, fromTag.length)} Match Yield</span>
                    <span className="text-[10px] text-muted-foreground block">{fromTag.length} lead{fromTag.length === 1 ? "" : "s"} found</span>
                  </div>
                </div>
              );
            })}
            {state.hashtags.length === 0 && <p className="py-3 text-muted-foreground">No hashtags yet.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs font-bold text-foreground">Competitor Audience Yield</h4>
            <span className="text-[10px] text-muted-foreground">By source_ref match</span>
          </div>
          <div className="divide-y divide-border/60 text-xs">
            {state.competitors.map((c) => {
              const fromComp = state.instagramLeads.filter((l) => l.sourceRef === "@" + c.username);
              const replied = fromComp.filter((l) => l.replied).length;
              return (
                <div key={c.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground">@{c.username}</span>
                    <span className="text-[11px] text-muted-foreground block">{c.followersCount} audience</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-primary">{pct(replied, fromComp.length)} Reply Rate</span>
                    <span className="text-[10px] text-muted-foreground block">{fromComp.length} lead{fromComp.length === 1 ? "" : "s"} found</span>
                  </div>
                </div>
              );
            })}
            {state.competitors.length === 0 && <p className="py-3 text-muted-foreground">No competitors added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
