"use client";

import React, { useState } from "react";
import {
  Users,
  Sparkles,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  ArrowRight,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { InstagramLead } from "@/lib/types";

interface CompetitorLeadsViewProps {
  setCurrentView: (view: string) => void;
}

export function CompetitorLeadsView({ setCurrentView }: CompetitorLeadsViewProps) {
  const { state, updateInstagramLeadDecision, sendInstagramLeadDm, showToast } = useApp();
  const [selectedComp, setSelectedComp] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedLead, setSelectedLead] = useState<InstagramLead | null>(null);

  const leads = state.instagramLeads.filter((l) => l.source === "competitor");

  const filteredLeads = leads.filter((lead) => {
    if (selectedComp !== "all" && lead.sourceRef !== selectedComp) return false;
    if (decisionFilter !== "all" && lead.decision !== decisionFilter) return false;
    if (
      searchTerm &&
      !lead.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !lead.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !lead.bio.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Applies your real Smart Lead Filters (Filters view) against currently
  // loaded leads — this used to be a fake spinner with a canned success
  // message and no actual logic.
  const handleStartFiltering = async () => {
    setIsFiltering(true);
    const f = state.filters;
    let changed = 0;

    for (const lead of leads) {
      const bio = lead.bio.toLowerCase();
      const blockedByKeyword = f.blockedKeywords.some((k) => k && bio.includes(k.toLowerCase()));
      const blockedByCategory = f.blockedCategories.some((c) => c && lead.category.toLowerCase() === c.toLowerCase());
      const belowMin = f.followerRange.minEnabled && lead.followers < f.followerRange.min;
      const aboveMax = f.followerRange.maxEnabled && lead.followers > f.followerRange.max;
      const missingEmail = f.mustHaveEmail && !lead.email;

      const shouldBlock = blockedByKeyword || blockedByCategory || belowMin || aboveMax || missingEmail;
      const nextDecision = shouldBlock ? "blocked" : "matched";

      if (nextDecision !== lead.decision) {
        await updateInstagramLeadDecision(lead.id, nextDecision);
        changed++;
      }
    }

    setIsFiltering(false);
    showToast(changed > 0 ? `Re-classified ${changed} lead(s) against your filters.` : "All leads already match your current filters.");
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Username,Name,Followers,Engagement,Category,Location,Email,CompetitorSource,Decision"]
        .concat(
          filteredLeads.map(
            (l) =>
              `"${l.username}","${l.name}",${l.followers},"${l.engagement}","${l.category}","${l.location}","${l.email}","${l.sourceRef}","${l.decision}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `celestia_competitor_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Competitor Leads</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                Audience Ingestion
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">{leads.length} total candidates</span> collected from competitor follower pools.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleStartFiltering}
            disabled={isFiltering || leads.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isFiltering ? "animate-spin" : ""}`} />
            <span>{isFiltering ? "Running Smart Filter..." : "Start Filtering"}</span>
          </button>
          <button
            onClick={handleExport}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search competitor leads..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Source:</span>
            <select
              value={selectedComp}
              onChange={(e) => setSelectedComp(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="all">All Competitors</option>
              {state.competitors.map((c) => (
                <option key={c.id} value={"@" + c.username}>
                  @{c.username}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Decision:</span>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="all">All Decisions</option>
              <option value="matched">Matched</option>
              <option value="blocked">Blocked</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLeads.length}</span> candidates
        </div>
      </div>

      {/* Table / Empty State */}
      {filteredLeads.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Add a competitor first</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Add your target competitors in setup. Once saved, their followers will appear here for automated ICP qualification.
            </p>
          </div>
          <button
            onClick={() => setCurrentView("competitors_setup")}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
          >
            Go to Competitors
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5 pl-4">Profile</th>
                  <th className="p-3.5">Category & Bio</th>
                  <th className="p-3.5">Followers</th>
                  <th className="p-3.5">Source Competitor</th>
                  <th className="p-3.5">Decision</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 pl-4">
                      <div>
                        <span className="font-bold text-foreground">@{lead.username}</span>
                        <div className="text-[11px] text-muted-foreground">{lead.name}</div>
                        <div className="text-[10px] text-muted-foreground">{lead.location}</div>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium mb-1">
                        {lead.category}
                      </span>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{lead.bio}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-foreground font-mono">
                      {lead.followers.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-orange-600 font-semibold">{lead.sourceRef}</td>
                    <td className="p-3.5">
                      {lead.decision === "matched" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-semibold border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> Blocked
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Preview personalized DM"
                          aria-label="Preview personalized DM"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            const result = await sendInstagramLeadDm(lead.id);
                            showToast(result.message, result.ok ? "info" : "error");
                          }}
                          disabled={lead.dmSent}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                            lead.dmSent
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-primary text-white hover:bg-primary/90"
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>{lead.dmSent ? "Sent" : "Send DM"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">@{selectedLead.username}</h3>
                <p className="text-xs text-muted-foreground">Follower of {selectedLead.sourceRef}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-foreground">Personalized Competitor DM</label>
              <div className="p-3 rounded-lg border border-border bg-background text-foreground leading-relaxed">
                {selectedLead.generatedDm}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  const result = await sendInstagramLeadDm(selectedLead.id);
                  setSelectedLead(null);
                  showToast(result.message, result.ok ? "info" : "error");
                }}
                disabled={selectedLead.dmSent}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40"
              >
                {selectedLead.dmSent ? "Already Sent" : "Dispatch DM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
