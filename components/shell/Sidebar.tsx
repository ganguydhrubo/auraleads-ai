"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Compass,
  Hash,
  Users,
  SlidersHorizontal,
  MapPin,
  Mail,
  Send,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Music2,
  Volume2,
  Sparkles,
  Layers,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  collapsed: boolean;
}

export function Sidebar({ currentView, setCurrentView, collapsed }: SidebarProps) {
  const { state, audioPlaying, setAudioPlaying } = useApp();
  const [discoverOpen, setDiscoverOpen] = useState(true);
  const [outreachOpen, setOutreachOpen] = useState(true);

  if (collapsed) {
    return (
      <aside className="w-16 border-r border-border bg-card flex flex-col items-center py-4 justify-between h-screen sticky top-0 z-30 transition-all duration-200">
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setCurrentView("dashboard")}
            className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-md font-bold text-lg"
            title="Celestia Leads"
          >
            CL
          </button>
          <div className="flex flex-col gap-2 w-full px-2">
            <button
              onClick={() => setCurrentView("hashtags_leads")}
              className={`p-2.5 rounded-lg flex justify-center text-sm ${currentView.includes("hashtags") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Hashtag Leads"
            >
              <Hash className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView("maps_discover")}
              className={`p-2.5 rounded-lg flex justify-center text-sm ${currentView.includes("maps") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Maps Discovery"
            >
              <MapPin className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView("inbox")}
              className={`p-2.5 rounded-lg flex justify-center text-sm ${currentView === "inbox" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Inbox"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`p-2.5 rounded-lg flex justify-center text-sm ${currentView === "dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Dashboard"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setAudioPlaying(!audioPlaying)}
            className={`p-2 rounded-full ${audioPlaying ? "text-primary animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
            title="Toggle background ambient"
          >
            <Music2 className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  const isNavActive = (viewKey: string) => currentView === viewKey;

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col justify-between h-screen sticky top-0 z-30 select-none transition-all duration-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm font-semibold tracking-wider text-base">
            AL
          </div>
          <div>
            <div className="font-semibold text-foreground text-[15px] flex items-center gap-1.5 leading-none">
              AuraLeads<span className="text-primary font-bold">.ai</span>
              <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full">v2</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-normal">Autonomous Outbound Engine</div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-[13px]">
        {/* PIPELINE */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pipeline
          </div>

          {/* Discover Section */}
          <div className="space-y-0.5">
            <button
              onClick={() => setDiscoverOpen(!discoverOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-muted-foreground hover:text-foreground font-medium rounded-md hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                <span>Discover</span>
              </div>
              {discoverOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {discoverOpen && (
              <div className="ml-3 pl-3 border-l border-border/60 space-y-1 pt-1">
                {/* Instagram Hashtags */}
                <div className="space-y-0.5">
                  <div className="text-[11px] font-medium text-muted-foreground px-2 pt-1 flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-purple-500" />
                    <span>Instagram · Hashtags</span>
                  </div>
                  <button
                    onClick={() => setCurrentView("hashtags_setup")}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      isNavActive("hashtags_setup")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-[12px] font-medium">Setup</div>
                    <div className="text-[10px] text-muted-foreground/80 leading-none">Generate hashtags</div>
                  </button>
                  <button
                    onClick={() => setCurrentView("hashtags_leads")}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                      isNavActive("hashtags_leads")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <div className="text-[12px] font-medium">Leads</div>
                      <div className="text-[10px] text-muted-foreground/80 leading-none">From hashtags</div>
                    </div>
                    {state.user.usage.leadsToday > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                        {state.user.usage.leadsToday}
                      </span>
                    )}
                  </button>
                </div>

                {/* Instagram Competitors */}
                <div className="space-y-0.5 pt-1">
                  <div className="text-[11px] font-medium text-muted-foreground px-2 pt-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-orange-500" />
                    <span>Instagram · Competitors</span>
                  </div>
                  <button
                    onClick={() => setCurrentView("competitors_setup")}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      isNavActive("competitors_setup")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-[12px] font-medium">Setup</div>
                    <div className="text-[10px] text-muted-foreground/80 leading-none">Manage competitors</div>
                  </button>
                  <button
                    onClick={() => setCurrentView("competitors_leads")}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      isNavActive("competitors_leads")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-[12px] font-medium">Leads</div>
                    <div className="text-[10px] text-muted-foreground/80 leading-none">From competitors</div>
                  </button>
                </div>

                {/* Filters */}
                <button
                  onClick={() => setCurrentView("filters")}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                    isNavActive("filters")
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                  <div>
                    <div className="text-[12px] font-medium">Filters</div>
                    <div className="text-[10px] text-muted-foreground/80 leading-none">Qualification rules</div>
                  </div>
                </button>

                {/* Google Maps */}
                <div className="space-y-0.5 pt-1">
                  <div className="text-[11px] font-medium text-muted-foreground px-2 pt-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>Google Maps</span>
                  </div>
                  <button
                    onClick={() => setCurrentView("maps_discover")}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      isNavActive("maps_discover")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-[12px] font-medium">Discover</div>
                    <div className="text-[10px] text-muted-foreground/80 leading-none">Locations & queries</div>
                  </button>
                  <button
                    onClick={() => setCurrentView("maps_leads")}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                      isNavActive("maps_leads")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <div className="text-[12px] font-medium">Maps Leads</div>
                      <div className="text-[10px] text-muted-foreground/80 leading-none">Revealed Maps leads</div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">
                      {state.mapsLeads.filter((m) => m.revealed).length}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Outreach Section */}
          <div className="space-y-0.5 mt-2">
            <button
              onClick={() => setOutreachOpen(!outreachOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-muted-foreground hover:text-foreground font-medium rounded-md hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <span>Outreach</span>
              </div>
              {outreachOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {outreachOpen && (
              <div className="ml-3 pl-3 border-l border-border/60 space-y-1 pt-1">
                <button
                  onClick={() => setCurrentView("inbox")}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                    isNavActive("inbox")
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <div>
                      <div className="text-[12px] font-medium">Inbox</div>
                      <div className="text-[10px] text-muted-foreground/80 leading-none">DM & email threads</div>
                    </div>
                  </div>
                  {state.conversations.filter((c) => c.unread).length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>

                <button
                  onClick={() => setCurrentView("campaigns")}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                    isNavActive("campaigns")
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <div>
                    <div className="text-[12px] font-medium">Campaigns</div>
                    <div className="text-[10px] text-muted-foreground/80 leading-none">Bulk send & sequences</div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView("templates")}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                    isNavActive("templates")
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <div>
                    <div className="text-[12px] font-medium">Templates</div>
                    <div className="text-[10px] text-muted-foreground/80 leading-none">Message templates</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* INSIGHTS */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Insights
          </div>
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2.5 ${
              isNavActive("dashboard")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-primary" />
            <div>
              <div className="text-[13px] font-medium">Dashboard</div>
              <div className="text-[10px] text-muted-foreground/80 leading-none">Outreach status & analytics</div>
            </div>
          </button>
        </div>

        {/* ACCOUNT */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setCurrentView("billing")}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                isNavActive("billing")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-[13px] font-medium">Billing</div>
                  <div className="text-[10px] text-muted-foreground/80 leading-none">Plans & payment history</div>
                </div>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full border border-amber-500/20">
                {state.user.plan}
              </span>
            </button>

            <button
              onClick={() => setCurrentView("settings")}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2.5 ${
                isNavActive("settings")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-[13px] font-medium">Settings</div>
                <div className="text-[10px] text-muted-foreground/80 leading-none">Preferences & connections</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentView("admin")}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2.5 ${
                isNavActive("admin")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <div>
                <div className="text-[13px] font-medium">Admin Panel</div>
                <div className="text-[10px] text-muted-foreground/80 leading-none">Scraper & Meta pools</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/80 bg-muted/20 space-y-2">
        {/* Mini Audio Player */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-card border border-border text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Music2 className={`w-3.5 h-3.5 ${audioPlaying ? "text-primary animate-spin" : "text-muted-foreground"}`} />
            <div className="truncate">
              <span className="text-[10px] text-muted-foreground block leading-none">Now Playing</span>
              <span className="text-[11px] font-medium text-foreground truncate">Deep Focus · Ambient Lo-Fi</span>
            </div>
          </div>
          <button
            onClick={() => setAudioPlaying(!audioPlaying)}
            className="text-muted-foreground hover:text-foreground p-1"
            title={audioPlaying ? "Pause music" : "Play music"}
          >
            {audioPlaying ? <Volume2 className="w-3.5 h-3.5 text-primary" /> : <Music2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-foreground truncate">{state.user.email}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-medium px-1.5 py-0.2 bg-muted text-muted-foreground rounded">
                {state.user.plan} Trial
              </span>
              <span className="text-[10px] text-muted-foreground">7 days left</span>
            </div>
          </div>
          <button
            onClick={() => alert("Session logout: in demo mode the session is persistent.")}
            className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-muted transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
