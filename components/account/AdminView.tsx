"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Server, Layers, RefreshCw, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface WorkerNode {
  id: string;
  label: string;
  kind: "scraper" | "linkedin_browser";
  status: "idle" | "running" | "error" | "disabled";
  proxy: string | null;
  last_heartbeat: string | null;
}

interface AutomationJob {
  id: string;
  platform: string;
  action: string;
  status: "queued" | "running" | "done" | "failed";
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export function AdminView() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<"jobs" | "nodes">("jobs");
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [nodes, setNodes] = useState<WorkerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeProxy, setNewNodeProxy] = useState("");

  const supabase = createSupabaseBrowserClient();

  const load = async () => {
    setLoading(true);
    const [jobsRes, nodesRes] = await Promise.all([
      fetch("/api/automation/jobs").then((r) => r.json()),
      supabase.from("worker_nodes").select("*").order("created_at", { ascending: false }),
    ]);
    setJobs(jobsRes.jobs || []);
    setNodes((nodesRes.data as WorkerNode[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addNode = async () => {
    if (!newNodeLabel.trim()) return;
    await supabase.from("worker_nodes").insert({ label: newNodeLabel.trim(), proxy: newNodeProxy.trim() || null, kind: "linkedin_browser" });
    setNewNodeLabel("");
    setNewNodeProxy("");
    await load();
  };

  const removeNode = async (id: string) => {
    await supabase.from("worker_nodes").delete().eq("id", id);
    await load();
  };

  const statusColor: Record<string, string> = {
    queued: "bg-amber-500/10 text-amber-600",
    running: "bg-blue-500/10 text-blue-600",
    done: "bg-emerald-500/10 text-emerald-600",
    failed: "bg-rose-500/10 text-rose-600",
  };

  // Defense-in-depth: the sidebar already hides the nav link for non-admins,
  // but currentView is just client state — guard the view itself too.
  if (state.user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-16 text-sm text-muted-foreground">
        This section is only available to workspace admins.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Automation & Infrastructure Console</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real job queue for the LinkedIn/Instagram browser-automation worker, plus registered worker nodes.
            </p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground" aria-label="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex border-b border-border text-xs font-semibold gap-6 px-2">
        <button onClick={() => setActiveTab("jobs")} className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === "jobs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Layers className="w-3.5 h-3.5" />
          <span>Automation Job Queue</span>
        </button>
        <button onClick={() => setActiveTab("nodes")} className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === "nodes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Server className="w-3.5 h-3.5" />
          <span>Worker Nodes</span>
        </button>
      </div>

      {activeTab === "jobs" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-3 pl-4">Platform</th>
                <th className="p-3">Action</th>
                <th className="p-3">Created</th>
                <th className="p-3">Error</th>
                <th className="p-3 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-muted/20">
                  <td className="p-3 pl-4 font-semibold text-foreground capitalize">{j.platform}</td>
                  <td className="p-3 text-muted-foreground capitalize">{j.action}</td>
                  <td className="p-3 font-mono text-[11px] text-muted-foreground">{new Date(j.created_at).toLocaleString()}</td>
                  <td className="p-3 text-[11px] text-rose-600">{j.error || "—"}</td>
                  <td className="p-3 pr-4 text-right">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor[j.status]}`}>{j.status}</span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No automation jobs yet — queue one from Hashtag Leads or a LinkedIn/Instagram send action.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "nodes" && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-col sm:flex-row gap-2 text-xs">
            <input value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)} placeholder="Node label (e.g. railway-worker-1)" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground" />
            <input value={newNodeProxy} onChange={(e) => setNewNodeProxy(e.target.value)} placeholder="Proxy (optional)" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
            <button onClick={addNode} className="px-3 py-1.5 rounded bg-primary text-white font-semibold flex items-center gap-1.5 justify-center">
              <Plus className="w-3.5 h-3.5" /> Add Node
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 pl-4">Label</th>
                  <th className="p-3">Proxy</th>
                  <th className="p-3">Last Heartbeat</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">—</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {nodes.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-bold text-foreground">{n.label}</td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{n.proxy || "—"}</td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{n.last_heartbeat ? new Date(n.last_heartbeat).toLocaleString() : "Never"}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{n.status}</span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button onClick={() => removeNode(n.id)} className="p-1 rounded text-muted-foreground hover:text-rose-600" aria-label={`Remove ${n.label}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {nodes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No worker nodes registered. Deploy /workers/social-worker and register it here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
