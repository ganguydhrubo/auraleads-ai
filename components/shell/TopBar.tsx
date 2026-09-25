"use client";

import React, { useState } from "react";
import {
  Menu,
  Bell,
  Sparkles,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

interface TopBarProps {
  currentView: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const titlesMap: Record<string, { title: string; subtitle: string }> = {
  hashtags_setup: { title: "Instagram Hashtags Setup", subtitle: "Define your business & target region to generate high-intent hashtags" },
  hashtags_leads: { title: "Hashtag Leads", subtitle: "Review, filter, and qualify prospects collected from your active hashtags" },
  competitors_setup: { title: "Manage Competitors", subtitle: "Track competitor profiles to source their active followers" },
  competitors_leads: { title: "Competitor Leads", subtitle: "Prospects sourced from your competitor follower lists" },
  filters: { title: "Qualification Rules & Filters", subtitle: "Define strict ICP criteria for follower limits, themes, and contacts" },
  maps_discover: { title: "Google Maps Discovery", subtitle: "Select geographic regions and search local business verticals" },
  maps_leads: { title: "Google Maps Leads", subtitle: "Revealed business leads with verified contacts and executive profiles" },
  inbox: { title: "Unified Outreach Inbox", subtitle: "Direct message threads, email conversations, and AI auto-reply controls" },
  campaigns: { title: "Outreach Campaigns", subtitle: "Automated, manual, and browser-assisted multi-channel sequences" },
  templates: { title: "Message Templates", subtitle: "AI prompt criteria and personalized cold outreach copywriting" },
  dashboard: { title: "Insights & Analytics Dashboard", subtitle: "End-to-end funnel visibility, response rates, and source attribution" },
  billing: { title: "Subscription & Billing", subtitle: "Manage your tier limits, addons, and payment history" },
  settings: { title: "Preferences & Integrations", subtitle: "Configure BYO Meta App credentials and connected Gmail accounts" },
  admin: { title: "Admin Console · Infrastructure", subtitle: "Scraper account rotation, Meta developer pools, and seat governance" },
};

export function TopBar({ currentView, collapsed, setCollapsed }: TopBarProps) {
  const { state, setTourOpen, updateSettings } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const viewInfo = titlesMap[currentView] || { title: "Celestia Leads", subtitle: "Lead Generation Platform" };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-foreground leading-tight">{viewInfo.title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{viewInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Daily Quota Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-muted/60 border border-border/80 px-3 py-1.5 rounded-full text-xs">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">
            {state.user.usage.leadsToday}/{state.user.limits.leadsDay} Leads Today
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">· Resets in 18h 50m</span>
        </div>

        {/* Website Guide / Product Tour Button */}
        <button
          onClick={() => setTourOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Website Guide</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => {
            const nextMode = !state.settings.darkMode;
            updateSettings({ darkMode: nextMode });
            if (nextMode) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Toggle theme"
        >
          {state.settings.darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg border border-border shadow-xl p-3 z-50 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-semibold text-foreground">Notifications</span>
                <span className="text-[10px] text-primary font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="p-2 rounded bg-muted/40 hover:bg-muted flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">New Instagram reply</p>
                    <p className="text-muted-foreground text-[11px]">@alex.growthlab replied to your initial DM.</p>
                    <span className="text-[9px] text-muted-foreground/80 mt-1 block">12m ago</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-muted/40 hover:bg-muted flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Daily Leads Ready</p>
                    <p className="text-muted-foreground text-[11px]">Daily scraping cycle completed with 10 qualified candidates.</p>
                    <span className="text-[9px] text-muted-foreground/80 mt-1 block">2h ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
