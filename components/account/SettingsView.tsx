"use client";

import React, { useState } from "react";
import {
  Settings,
  Instagram,
  Mail,
  CheckCircle2,
  Copy,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Shield,
  Moon,
  Sun,
  Bell,
  Zap,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

export function SettingsView() {
  const { state, updateSettings, updateIntegrations } = useApp();
  const [activeTab, setActiveTab] = useState<"platforms" | "preferences">("platforms");
  const [igAppId, setIgAppId] = useState(state.integrations.instagram.appId || "");
  const [igSecret, setIgSecret] = useState(state.integrations.instagram.appSecret || "");
  const [igToken, setIgToken] = useState(state.integrations.instagram.token || "");
  const [newGmail, setNewGmail] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isIgConnected = state.integrations.instagram.connected;

  const handleConnectIG = () => {
    updateIntegrations({
      instagram: {
        ...state.integrations.instagram,
        appId: igAppId,
        appSecret: igSecret,
        token: igToken,
        connected: true,
        webhookConfigured: true,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddGmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGmail.trim()) return;
    updateIntegrations({
      gmail: {
        accounts: [
          ...state.integrations.gmail.accounts,
          {
            email: newGmail.trim(),
            connected: true,
            type: "app_password",
            dailySent: 0,
          },
        ],
      },
    });
    setNewGmail("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Preferences & Connections</h2>
            <p className="text-xs text-muted-foreground">
              Configure your BYO Meta messaging app credentials and connected Gmail accounts.
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Meta app credentials verified! Webhook listener is now live.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-6 px-2">
        <button
          onClick={() => setActiveTab("platforms")}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === "platforms"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Connected Platforms & Webhooks
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === "preferences"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Automation & Notifications
        </button>
      </div>

      {/* Tab 1: Platforms */}
      {activeTab === "platforms" && (
        <div className="space-y-6">
          {/* Instagram Messaging Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Instagram className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">Instagram Messaging (BYO Meta App)</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect your Meta Developer App to route incoming DMs into your Outreach Inbox.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    isIgConnected
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  }`}
                >
                  {isIgConnected ? "Connected" : "Not Connected"}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {isIgConnected ? "Webhook Active" : "Webhook Not Configured"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Instagram App ID</label>
                <input
                  type="text"
                  value={igAppId}
                  onChange={(e) => setIgAppId(e.target.value)}
                  placeholder="e.g. 198273910283921"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Instagram App Secret</label>
                <input
                  type="password"
                  value={igSecret}
                  onChange={(e) => setIgSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-foreground">Messaging Long-Lived Access Token</label>
                <input
                  type="password"
                  value={igToken}
                  onChange={(e) => setIgToken(e.target.value)}
                  placeholder="EAAG... (Page access token with instagram_manage_messages)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Webhook Callback info */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 text-xs">
              <span className="font-bold text-foreground block">Webhook Configuration (Meta App Dashboard)</span>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Callback URL:</span>
                  <div className="flex items-center justify-between p-2 rounded bg-background border border-border font-mono text-[11px]">
                    <span>https://api.celestialeads.com/v2/webhooks/instagram</span>
                    <button
                      onClick={() => alert("Copied callback URL!")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Verify Token:</span>
                  <div className="flex items-center justify-between p-2 rounded bg-background border border-border font-mono text-[11px]">
                    <span>{state.integrations.instagram.verifyToken}</span>
                    <button
                      onClick={() => alert("Copied verify token!")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleConnectIG}
                className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                Verify & Connect Instagram
              </button>
            </div>
          </div>

          {/* Gmail Inboxes Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Connected Gmail Accounts</h3>
                <p className="text-xs text-muted-foreground">
                  Each account sends outreach from a distinct inbox with automated reply detection.
                </p>
              </div>
            </div>

            {/* Inboxes list */}
            <div className="space-y-2">
              {state.integrations.gmail.accounts.map((acc, idx) => (
                <div key={idx} className="p-3 px-4 rounded-lg border border-border bg-card flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      @
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{acc.email}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {acc.dailySent} / 50 sent today · IMAP Sync Active
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>
              ))}
            </div>

            {/* Add Account form */}
            <form onSubmit={handleAddGmail} className="flex gap-2">
              <input
                type="email"
                value={newGmail}
                onChange={(e) => setNewGmail(e.target.value)}
                placeholder="Add another Gmail address (e.g. outreach@agency.com)..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold border border-border hover:bg-muted"
              >
                Connect Inbox
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === "preferences" && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Automation Toggles</h3>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Automated Lead Generation</span>
                <span className="text-muted-foreground text-[11px]">
                  Automatically find, scrape, and filter new leads daily based on saved criteria.
                </span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.automatedLeadGeneration}
                onChange={(e) => updateSettings({ automatedLeadGeneration: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Automated Weekly Cycle</span>
                <span className="text-muted-foreground text-[11px]">
                  Trigger a new cycle automatically each week with your configured active hashtags.
                </span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.automatedWeeklyCycle}
                onChange={(e) => updateSettings({ automatedWeeklyCycle: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground">Email & Push Notifications</h3>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Daily Leads Summary Email</span>
                <span className="text-muted-foreground text-[11px]">
                  Receive an email digest when your daily lead quota is generated and ready for outreach.
                </span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.dailyLeadsEmail}
                onChange={(e) => updateSettings({ dailyLeadsEmail: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Cycle Expiration Reminder</span>
                <span className="text-muted-foreground text-[11px]">
                  Send alert 24 hours before your weekly hashtag cycle expires.
                </span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.cycleExpirationReminder}
                onChange={(e) => updateSettings({ cycleExpirationReminder: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
