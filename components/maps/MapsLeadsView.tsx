"use client";

import React, { useState } from "react";
import {
  MapPin,
  Download,
  Filter,
  Search,
  Eye,
  Mail,
  UserCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { MapsLead } from "@/lib/types";

interface MapsLeadsViewProps {
  setCurrentView: (view: string) => void;
}

export function MapsLeadsView({ setCurrentView }: MapsLeadsViewProps) {
  const { state, revealMapsLead, enrichMapsLead, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterRevealed, setFilterRevealed] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<MapsLead | null>(null);

  const leads = state.mapsLeads;

  const revealedCount = leads.filter((l) => l.revealed).length;
  const matchedCount = leads.filter((l) => l.decision === "matched").length;
  const blockedCount = leads.filter((l) => l.decision === "blocked").length;

  const filteredLeads = leads.filter((lead) => {
    if (filterRevealed === "revealed" && !lead.revealed) return false;
    if (filterRevealed === "unrevealed" && lead.revealed) return false;
    if (
      searchTerm &&
      !lead.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !lead.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !lead.city.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkReveal = async () => {
    const count = selectedIds.length;
    await Promise.all(selectedIds.map((id) => revealMapsLead(id)));
    showToast(`Checked ${count} lead(s) for real contact details — results vary by what each business has published.`);
    setSelectedIds([]);
  };

  const handleBulkEnrich = async () => {
    const count = selectedIds.length;
    await Promise.all(selectedIds.map((id) => enrichMapsLead(id)));
    showToast(`Ran enrichment on ${count} compan${count === 1 ? "y" : "ies"} — real hits only, no data invented for gaps.`);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Name,Category,Address,City,Phone,Email,Rating,Reviews,Revealed,Executives"]
        .concat(
          filteredLeads.map(
            (l) =>
              `"${l.name}","${l.category}","${l.address}","${l.city}","${l.phone || ""}","${l.email || ""}",${l.rating},${l.reviewsCount},${l.revealed},"${l.executives.map((e) => e.name + ' (' + e.title + ')').join('; ')}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `celestia_maps_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Counters Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Google Maps Leads</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                Verified B2B Places
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-emerald-600">{revealedCount} revealed</span>
              <span>·</span>
              <span className="font-semibold text-foreground">{matchedCount} matched</span>
              <span>·</span>
              <span className="text-muted-foreground">{blockedCount} blocked</span>
              <span>·</span>
              <span>Total: {leads.length} listings</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedIds.length > 0 ? (
            <>
              <button
                onClick={handleBulkReveal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Reveal Contacts ({selectedIds.length})</span>
              </button>
              <button
                onClick={handleBulkEnrich}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Find Executives ({selectedIds.length})</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setCurrentView("maps_discover")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Discover New Area</span>
            </button>
          )}

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

      {/* Row Selection Notice */}
      <div className="p-3 bg-muted/40 border border-border rounded-lg flex items-center justify-between text-xs text-muted-foreground">
        <span>?? Tick leads in the table below to enrich emails or reveal executive decision-makers.</span>
        <span className="font-mono text-[11px] text-foreground font-semibold">
          {selectedIds.length} of {filteredLeads.length} selected
        </span>
      </div>

      {/* Controls Bar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search business name, category, or city..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={filterRevealed}
              onChange={(e) => setFilterRevealed(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="all">All Leads</option>
              <option value="revealed">Revealed Contacts Only</option>
              <option value="unrevealed">Unrevealed (Blurred)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLeads.length}</span> places
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5 pl-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border text-primary"
                  />
                </th>
                <th className="p-3.5">Business Name & Category</th>
                <th className="p-3.5">Address & City</th>
                <th className="p-3.5">Rating & Reviews</th>
                <th className="p-3.5">Direct Contact</th>
                <th className="p-3.5">Executives</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLeads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id);
                return (
                  <tr key={lead.id} className={`hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                    <td className="p-3.5 pl-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(lead.id)}
                        className="rounded border-border text-primary"
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{lead.name}</div>
                      <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium mt-0.5">
                        {lead.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      <div>{lead.address}</div>
                      <div className="text-[10px] text-muted-foreground/80">{lead.city}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{lead.rating}</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          ({lead.reviewsCount})
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {lead.revealed ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-foreground">
                            <Phone className="w-3 h-3 text-muted-foreground" /> {lead.phone}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-primary">
                            <Mail className="w-3 h-3" /> {lead.email}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded inline-flex">
                          <Lock className="w-3 h-3" />
                          <span className="blur-[3px] select-none">+1 (212) 555-0000</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        {lead.executives.map((e, idx) => (
                          <div key={idx} className="text-[11px]">
                            <span className="font-medium text-foreground">{e.name}</span>
                            <span className="text-muted-foreground text-[10px] block leading-none">{e.title}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!lead.revealed ? (
                          <button
                            onClick={() => revealMapsLead(lead.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-2xs"
                          >
                            Reveal
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="View lead profile"
                            aria-label="View lead profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Profile */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedLead.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedLead.category} · {selectedLead.city}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                ?
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
                <span className="font-semibold text-foreground block">Verified Contact Details</span>
                <p className="text-muted-foreground">Phone: {selectedLead.phone}</p>
                <p className="text-muted-foreground">Email: {selectedLead.email}</p>
                <p className="text-muted-foreground">Address: {selectedLead.address}</p>
                <p className="text-primary underline cursor-pointer">{selectedLead.website}</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground block">Key Decision Makers</span>
                {selectedLead.executives.map((exec, idx) => (
                  <div key={idx} className="p-2 rounded border border-border bg-background flex justify-between items-center">
                    <div>
                      <div className="font-medium text-foreground">{exec.name}</div>
                      <div className="text-[10px] text-muted-foreground">{exec.title}</div>
                    </div>
                    {exec.email && <span className="text-[10px] font-mono text-primary">{exec.email}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
