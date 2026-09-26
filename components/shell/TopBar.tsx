"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  Sparkles,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
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
  maps_discover: { title: "Maps Discovery", subtitle: "Select geographic regions and search local business verticals" },
  maps_leads: { title: "Maps Leads", subtitle: "Revealed business leads with verified contacts and executive profiles" },
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
  const notificationsRef = useRef<HTMLDivElement>(null);

  const viewInfo = titlesMap[currentView] || { title: "AuraLeads AI", subtitle: "Lead Generation Platform" };
  const unreadConversations = state.conversations.filter((c) => c.unread);

  // Was only closable by re-clicking the bell — Escape and clicking anywhere
  // else silently did nothing, which reads as a stuck/broken dropdown.
  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications]);

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-20">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">{viewInfo.title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block truncate">{viewInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Daily Quota Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-muted/60 border border-border/80 px-3 py-1.5 rounded-full text-xs">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">
            {state.user.usage.leadsToday}/{state.user.limits.leadsDay} Leads Today
          </span>
        </div>

        {/* Website Guide / Product Tour Button */}
        <button
          onClick={() => setTourOpen(true)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
          title="Website Guide"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Website Guide</span>
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
          aria-label="Toggle theme"
        >
          {state.settings.darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadConversations.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg border border-border shadow-xl p-3 z-50 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-semibold text-foreground">Notifications</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unreadConversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No notifications yet.</p>
                ) : (
                  unreadConversations.slice(0, 8).map((c) => (
                    <div key={c.id} className="p-2 rounded bg-muted/40 hover:bg-muted flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">New {c.channel} message</p>
                        <p className="text-muted-foreground text-[11px]">{c.contactName} · {c.contactHandle}</p>
                        <span className="text-[9px] text-muted-foreground/80 mt-1 block">{new Date(c.lastActive).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
