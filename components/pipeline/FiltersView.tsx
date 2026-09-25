"use client";

import React, { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Globe,
  ShieldAlert,
  Mail,
  Phone,
  Link2,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { FilterCriteria } from "@/lib/types";

export function FiltersView() {
  const { state, loading, updateFilters } = useApp();
  const [filters, setFilters] = useState<FilterCriteria>(state.filters);
  const [newTheme, setNewTheme] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBlockedKeyword, setNewBlockedKeyword] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // state.filters starts as defaults and only reflects the real saved
  // values once the async workspace fetch completes — re-sync this form
  // when that happens, so Save can't overwrite real settings with defaults.
  useEffect(() => {
    if (!loading) setFilters(state.filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleAddTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.trim()) return;
    if (!filters.contentThemes.includes(newTheme.trim().toLowerCase())) {
      setFilters({
        ...filters,
        contentThemes: [...filters.contentThemes, newTheme.trim().toLowerCase()],
      });
    }
    setNewTheme("");
  };

  const handleRemoveTheme = (theme: string) => {
    setFilters({
      ...filters,
      contentThemes: filters.contentThemes.filter((t) => t !== theme),
    });
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    if (!filters.targetLocations.includes(newLocation.trim())) {
      setFilters({
        ...filters,
        targetLocations: [...filters.targetLocations, newLocation.trim()],
      });
    }
    setNewLocation("");
  };

  const handleRemoveLocation = (loc: string) => {
    setFilters({
      ...filters,
      targetLocations: filters.targetLocations.filter((l) => l !== loc),
    });
  };

  const handleAddBlockedKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedKeyword.trim()) return;
    if (!filters.blockedKeywords.includes(newBlockedKeyword.trim().toLowerCase())) {
      setFilters({
        ...filters,
        blockedKeywords: [...filters.blockedKeywords, newBlockedKeyword.trim().toLowerCase()],
      });
    }
    setNewBlockedKeyword("");
  };

  const handleRemoveBlockedKeyword = (kw: string) => {
    setFilters({
      ...filters,
      blockedKeywords: filters.blockedKeywords.filter((k) => k !== kw),
    });
  };

  const handleSave = () => {
    updateFilters(filters);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Qualification Rules & AI Filters</h2>
            <p className="text-xs text-muted-foreground">
              Define the exact criteria candidates must meet to be marked as "Matched" for outreach.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Save Criteria</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Qualification criteria successfully updated and applied to all future lead cycles!</span>
        </div>
      )}

      {/* Main Criteria Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
        {/* Section 1: Content Themes */}
        <div className="p-6 space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Content Themes</span>
              <span className="text-rose-500">*</span>
              <span className="text-[10px] text-muted-foreground font-normal">(Required)</span>
            </label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Profiles matching these themes in bio, captions, or business category are prioritized by AI evaluation.
            </p>
          </div>

          <form onSubmit={handleAddTheme} className="flex gap-2">
            <input
              type="text"
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              placeholder="Add theme (e.g. startup, founder, saas, b2b, agency)..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-muted border border-border"
            >
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {filters.contentThemes.map((theme) => (
              <span
                key={theme}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-500/20"
              >
                <span>{theme}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTheme(theme)}
                  className="hover:text-blue-800"
                  aria-label={`Remove ${theme}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Section 2: Follower Range */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground">Follower Range</label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Set minimum and maximum follower counts to target optimal creators, SMB founders, or agency leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Minimum Followers</span>
                <input
                  type="checkbox"
                  checked={filters.followerRange.minEnabled}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      followerRange: { ...filters.followerRange, minEnabled: e.target.checked },
                    })
                  }
                  className="rounded border-border text-primary"
                />
              </div>
              {!filters.followerRange.minEnabled && (
                <p className="text-[10px] text-muted-foreground">Check the box above to enable this limit</p>
              )}
              <input
                type="number"
                disabled={!filters.followerRange.minEnabled}
                value={filters.followerRange.min}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    followerRange: { ...filters.followerRange, min: Number(e.target.value) },
                  })
                }
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background disabled:opacity-40 text-foreground font-mono"
              />
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Maximum Followers</span>
                <input
                  type="checkbox"
                  checked={filters.followerRange.maxEnabled}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      followerRange: { ...filters.followerRange, maxEnabled: e.target.checked },
                    })
                  }
                  className="rounded border-border text-primary"
                />
              </div>
              {!filters.followerRange.maxEnabled && (
                <p className="text-[10px] text-muted-foreground">Check the box above to enable this limit</p>
              )}
              <input
                type="number"
                disabled={!filters.followerRange.maxEnabled}
                value={filters.followerRange.max}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    followerRange: { ...filters.followerRange, max: Number(e.target.value) },
                  })
                }
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background disabled:opacity-40 text-foreground font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Target Locations */}
        <div className="p-6 space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Target Locations</span>
            </label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Leave empty to include all locations, or restrict to specific countries/cities.
            </p>
          </div>

          <form onSubmit={handleAddLocation} className="flex gap-2">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add location (e.g. New York, London, Toronto, United States)..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-muted border border-border"
            >
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {filters.targetLocations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium border border-border"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc)}
                  className="hover:text-destructive"
                  aria-label={`Remove ${loc}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Section 4: Advanced Blocklists */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Advanced Blocklists</span>
          </div>

          {/* Blocked Keywords */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Blocked Bio & Caption Keywords</label>
            <form onSubmit={handleAddBlockedKeyword} className="flex gap-2">
              <input
                type="text"
                value={newBlockedKeyword}
                onChange={(e) => setNewBlockedKeyword(e.target.value)}
                placeholder="e.g. crypto, forex, sugar daddy, dm for collab..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-secondary text-xs font-semibold rounded-lg border border-border"
              >
                Add Block
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {filters.blockedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 text-xs font-medium border border-rose-500/20"
                >
                  <span>{kw}</span>
                  <button type="button" onClick={() => handleRemoveBlockedKeyword(kw)} aria-label={`Remove ${kw}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Contact Info & Website Requirements */}
        <div className="p-6 space-y-4">
          <label className="text-xs font-bold text-foreground block">Contact Info & Bio Link Requirements</label>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Warning: Very few accounts list public contact info (email/phone) directly on Instagram. Enabling strict contact requirements will cause candidate yield to drop sharply.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/20">
              <input
                type="checkbox"
                checked={filters.mustHaveEmail}
                onChange={(e) => setFilters({ ...filters, mustHaveEmail: e.target.checked })}
                className="rounded border-border text-primary"
              />
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">Must have email listed in bio</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/20">
              <input
                type="checkbox"
                checked={filters.mustHavePhone}
                onChange={(e) => setFilters({ ...filters, mustHavePhone: e.target.checked })}
                className="rounded border-border text-primary"
              />
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-foreground">Must have phone listed in bio</span>
              </div>
            </label>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Bio Website Link Requirement</span>
            </label>
            <div className="flex gap-2">
              {[
                { value: "any", label: "Any (Link or No Link)" },
                { value: "with_link", label: "Must have external link" },
                { value: "without_link", label: "Without link" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilters({ ...filters, websiteRequirement: opt.value as any })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filters.websiteRequirement === opt.value
                      ? "bg-primary text-white border-primary"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-muted/20 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm"
          >
            Save Criteria
          </button>
        </div>
      </div>
    </div>
  );
}
