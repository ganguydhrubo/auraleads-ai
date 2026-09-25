"use client";

import React, { useState } from "react";
import {
  Clock,
  Sparkles,
  Download,
  Filter,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Mail,
  Send,
  Eye,
  Hash,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { InstagramLead } from "@/lib/types";

interface HashtagsLeadsViewProps {
  setCurrentView: (view: string) => void;
}

export function HashtagsLeadsView({ setCurrentView }: HashtagsLeadsViewProps) {
  const { state, startLeadGenerationCycle, updateInstagramLeadDecision, sendInstagramLeadDm } = useApp();
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<InstagramLead | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const leads = state.instagramLeads.filter((l) => l.source === "hashtag");

  const filteredLeads = leads.filter((lead) => {
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

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    const result = await startLeadGenerationCycle();
    setIsGenerating(false);
    if (!result.ok) alert(result.message);
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Username,Name,Followers,Engagement,Category,Location,Email,Decision,Source"]
        .concat(
          filteredLeads.map(
            (l) =>
              `"${l.username}","${l.name}",${l.followers},"${l.engagement}","${l.category}","${l.location}","${l.email}","${l.decision}","${l.sourceRef}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `celestia_instagram_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Quota Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Instagram Leads</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Daily Batch
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">
                {state.user.usage.leadsToday}/{state.user.limits.leadsDay}
              </span>
              <span>leads today</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono text-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" /> 18h 50m until reset
              </span>
              <span>·</span>
              <span className="text-emerald-600 font-medium">
                {leads.filter((l) => l.decision === "matched").length} ready for outreach
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleStartGeneration}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Scraping Profiles..." : "Generate Leads"}</span>
          </button>
          <button
            onClick={handleExport}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, name, or bio..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="all">All Decisions</option>
              <option value="matched">Matched (AI Qualified)</option>
              <option value="blocked">Blocked</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLeads.length}</span> candidates
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredLeads.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Start a hashtag scraping cycle first</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Leads appear here once your hashtag cycle begins scraping profiles matching your active hashtags and qualification filters.
            </p>
          </div>
          <button
            onClick={() => setCurrentView("hashtags_setup")}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
          >
            Go to Hashtags Setup
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
                  <th className="p-3.5">Engagement</th>
                  <th className="p-3.5">Source Tag</th>
                  <th className="p-3.5">AI Decision</th>
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
                    <td className="p-3.5 font-mono text-foreground">{lead.engagement}</td>
                    <td className="p-3.5 font-mono text-[11px] text-purple-600 font-semibold">{lead.sourceRef}</td>
                    <td className="p-3.5">
                      {lead.decision === "matched" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Matched
                        </span>
                      ) : lead.decision === "blocked" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-semibold border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> Blocked
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Preview personalized messages"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {lead.decision === "matched" && (
                          <button
                            onClick={async () => {
                              const result = await sendInstagramLeadDm(lead.id);
                              alert(result.message);
                            }}
                            disabled={lead.dmSent}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-2xs ${
                              lead.dmSent
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-primary text-white hover:bg-primary/90"
                            }`}
                          >
                            <Send className="w-3 h-3" />
                            <span>{lead.dmSent ? "Sent" : "Send DM"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 px-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-sm font-bold text-foreground">Lead Profile · @{selectedLead.username}</h3>
                <p className="text-xs text-muted-foreground">{selectedLead.name} · {selectedLead.location}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                ?
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
                <span className="font-semibold text-foreground block">Profile Bio</span>
                <p className="text-muted-foreground leading-relaxed">{selectedLead.bio}</p>
                <div className="flex gap-4 pt-1 text-[11px] text-muted-foreground font-mono">
                  <span>Followers: <strong>{selectedLead.followers.toLocaleString()}</strong></span>
                  <span>Engagement: <strong>{selectedLead.engagement}</strong></span>
                  <span>Email: <strong>{selectedLead.email || "None listed in bio"}</strong></span>
                </div>
              </div>

              {/* Generated DM */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>AI-Generated Instagram DM</span>
                  <span className="text-[10px] text-primary font-medium">Personalized from bio</span>
                </label>
                <div className="p-3 rounded-lg border border-border bg-background text-foreground text-xs leading-relaxed">
                  {selectedLead.generatedDm || "No message generated yet."}
                </div>
              </div>

              {/* Generated Cold Email */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>AI-Generated Cold Email</span>
                  <span className="text-[10px] text-primary font-medium">Multi-channel sync</span>
                </label>
                <div className="p-3 rounded-lg border border-border bg-background text-foreground text-xs font-mono whitespace-pre-line leading-relaxed">
                  {selectedLead.generatedEmail || "No email generated yet."}
                </div>
              </div>

              {/* Decision switchers */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateInstagramLeadDecision(selectedLead.id, "matched");
                      setSelectedLead({ ...selectedLead, decision: "matched" });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedLead.decision === "matched"
                        ? "bg-emerald-600 text-white"
                        : "border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Mark Matched
                  </button>
                  <button
                    onClick={() => {
                      updateInstagramLeadDecision(selectedLead.id, "blocked");
                      setSelectedLead({ ...selectedLead, decision: "blocked" });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedLead.decision === "blocked"
                        ? "bg-rose-600 text-white"
                        : "border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Mark Blocked
                  </button>
                </div>

                <button
                  onClick={async () => {
                    const result = await sendInstagramLeadDm(selectedLead.id);
                    setSelectedLead(null);
                    alert(result.message);
                  }}
                  disabled={selectedLead.decision !== "matched" || selectedLead.dmSent}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40"
                >
                  {selectedLead.dmSent ? "Already Sent" : "Dispatch DM"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
