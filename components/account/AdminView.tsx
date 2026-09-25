"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Instagram,
  Users,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

export function AdminView() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<"accounts" | "meta" | "seats">("accounts");

  const [scraperAccounts, setScraperAccounts] = useState([
    { id: "acc_1", username: "cl_scraper_worker_01", status: "Healthy", requestsToday: 1420, proxy: "us-residential-res01.proxies.net", healthScore: 98 },
    { id: "acc_2", username: "cl_scraper_worker_02", status: "Healthy", requestsToday: 1280, proxy: "us-residential-res02.proxies.net", healthScore: 96 },
    { id: "acc_3", username: "cl_scraper_worker_03", status: "Cooldown", requestsToday: 1890, proxy: "uk-residential-res01.proxies.net", healthScore: 82 },
    { id: "acc_4", username: "cl_scraper_worker_04", status: "Healthy", requestsToday: 950, proxy: "ca-residential-res01.proxies.net", healthScore: 95 },
  ]);

  const [metaApps, setMetaApps] = useState([
    { id: "app_1", name: "Celestia Production Primary", appId: "19283719283", hourlyCalls: "1,240 / 5,000", status: "Active" },
    { id: "app_2", name: "Celestia Backup Fallback #1", appId: "28371928371", hourlyCalls: "320 / 5,000", status: "Standby" },
    { id: "app_3", name: "Celestia Webhook Router #2", appId: "39281729182", hourlyCalls: "2,150 / 5,000", status: "Active" },
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Infrastructure & Pool Management Console</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                Staff Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Internal cluster monitoring: Instagram worker account pool, Meta API fallbacks, and server seat quotas.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert("Cluster status re-synced.")}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-6 px-2">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "accounts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Instagram className="w-3.5 h-3.5" />
          <span>Instagram Account Pool (Scrapers)</span>
        </button>
        <button
          onClick={() => setActiveTab("meta")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "meta"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Meta Developer Apps Pool</span>
        </button>
        <button
          onClick={() => setActiveTab("seats")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "seats"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Server Seat Pool & Waitlist</span>
        </button>
      </div>

      {/* Tab 1: Instagram Account Pool */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between text-xs">
            <span>
              Worker Accounts: <strong>4 online</strong> · <strong>1 in cooldown</strong> · Residential Proxies Active
            </span>
            <button
              onClick={() => alert("Adding new worker node to pool...")}
              className="px-3 py-1.5 rounded bg-primary text-white font-semibold"
            >
              + Add Worker Node
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 pl-4">Account ID</th>
                  <th className="p-3">Proxy Node</th>
                  <th className="p-3">Daily Requests</th>
                  <th className="p-3">Health Score</th>
                  <th className="p-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {scraperAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-mono font-bold text-foreground">@{acc.username}</td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{acc.proxy}</td>
                    <td className="p-3 font-mono text-foreground">{acc.requestsToday} req</td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-600">{acc.healthScore}%</span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          acc.status === "Healthy"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Meta Developer Apps Pool */}
      {activeTab === "meta" && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-foreground">Rotated Meta Graph Apps</h3>
          <p className="text-muted-foreground">
            Spreads Graph API rate limits across rotated applications to prevent throttling during heavy outreach campaigns.
          </p>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {metaApps.map((app) => (
              <div key={app.id} className="p-3.5 px-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">{app.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">App ID: {app.appId}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-muted-foreground">{app.hourlyCalls}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Seat Pool */}
      {activeTab === "seats" && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-foreground">Capacity & Waitlist Control</h3>
          <p className="text-muted-foreground">
            The "Only 3 spots left" counter is controlled by the live seat pool. When capacity hits 100%, new signups see the waitlist screen.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <span className="text-muted-foreground block">Allocated Seats</span>
              <span className="text-xl font-bold text-foreground font-mono">97 / 100</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <span className="text-muted-foreground block">Waitlist Queue</span>
              <span className="text-xl font-bold text-primary font-mono">42 Users</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <span className="text-muted-foreground block">Active Trials</span>
              <span className="text-xl font-bold text-emerald-600 font-mono">31 Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
