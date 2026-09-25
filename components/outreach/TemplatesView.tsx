"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Eye,
  Instagram,
  Mail,
  User,
  Building,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { MessageTemplates } from "@/lib/types";

export function TemplatesView() {
  const { state, updateTemplates } = useApp();
  const [activeTab, setActiveTab] = useState<"hashtag" | "competitor">("hashtag");
  const [templates, setTemplates] = useState<MessageTemplates>(state.templates);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewLeadIndex, setPreviewLeadIndex] = useState(0);

  const sampleLead = state.instagramLeads[previewLeadIndex] || state.instagramLeads[0];

  const handleSave = () => {
    updateTemplates(templates);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getCompiledDm = () => {
    const templateText = activeTab === "hashtag" ? templates.hashtagDm : templates.competitorDm;
    return templateText
      .replace(/{name}/g, sampleLead ? sampleLead.name.split(" ")[0] : "Alex")
      .replace(/{niche}/g, sampleLead ? sampleLead.category : "B2B SaaS")
      .replace(/{company}/g, sampleLead ? sampleLead.name.split(" ")[0] + " Agency" : "ScaleVibe")
      .replace(/{competitor}/g, sampleLead ? sampleLead.sourceRef : "@growthfunder");
  };

  const getCompiledEmail = () => {
    return templates.hashtagEmail
      .replace(/{name}/g, sampleLead ? sampleLead.name.split(" ")[0] : "Alex")
      .replace(/{category}/g, sampleLead ? sampleLead.category : "B2B Marketing")
      .replace(/{company}/g, sampleLead ? sampleLead.name.split(" ")[0] + " Partners" : "ScaleVibe")
      .replace(/{your_name}/g, templates.fromName || "Devon");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">AI Copywriting & Message Templates</h2>
            <p className="text-xs text-muted-foreground">
              Define prompt instructions (tone, offer, and call-to-action) rather than rigid mail-merge strings.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Save Templates</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Templates saved! AI lead generation will use these criteria for subsequent prospect batches.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-6 px-2">
        <button
          onClick={() => setActiveTab("hashtag")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "hashtag"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Hashtag Leads (DM + Email)</span>
        </button>
        <button
          onClick={() => setActiveTab("competitor")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "competitor"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Competitor Follower DM</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          {activeTab === "hashtag" ? (
            <>
              {/* DM Criteria */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-foreground">Instagram DM Prompt Criteria</h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tone, offer and personalization rules. Available tokens: <code>{"{name}"}</code>, <code>{"{niche}"}</code>, <code>{"{company}"}</code>.
                </p>
                <textarea
                  rows={4}
                  value={templates.hashtagDm}
                  onChange={(e) => setTemplates({ ...templates, hashtagDm: e.target.value })}
                  placeholder="Hey {name}! Loved your recent work in {niche}..."
                  className="w-full text-xs p-3 rounded-lg border border-border bg-background text-foreground leading-relaxed font-mono"
                />
              </div>

              {/* Email Criteria */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground">Cold Email Criteria & Signature</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">From Name</label>
                    <input
                      type="text"
                      value={templates.fromName}
                      onChange={(e) => setTemplates({ ...templates, fromName: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Company Name</label>
                    <input
                      type="text"
                      value={templates.companyName}
                      onChange={(e) => setTemplates({ ...templates, companyName: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground">
                  Signature preview: <strong className="text-foreground">{templates.fromName}</strong> at <strong className="text-foreground">{templates.companyName}</strong>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Email Body Template</label>
                  <textarea
                    rows={5}
                    value={templates.hashtagEmail}
                    onChange={(e) => setTemplates({ ...templates, hashtagEmail: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-border bg-background text-foreground leading-relaxed font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Competitor Tab */
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-bold text-foreground">Competitor Audience DM Criteria</h3>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Can generate today: Yes
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sent to competitor followers. Automatically mentions the target competitor account using <code>{"{competitor}"}</code>.
              </p>
              <textarea
                rows={5}
                value={templates.competitorDm}
                onChange={(e) => setTemplates({ ...templates, competitorDm: e.target.value })}
                className="w-full text-xs p-3 rounded-lg border border-border bg-background text-foreground leading-relaxed font-mono"
              />
            </div>
          )}
        </div>

        {/* Right Preview Drawer: 5 cols */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 h-fit sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Live Profile Preview</span>
            </div>
            {sampleLead && (
              <span className="text-[10px] font-mono text-muted-foreground">
                @{sampleLead.username}
              </span>
            )}
          </div>

          {/* Rendered DM Output */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Generated Instagram DM
            </span>
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground leading-relaxed">
              {getCompiledDm()}
            </div>
          </div>

          {/* Rendered Email Output (if hashtag tab) */}
          {activeTab === "hashtag" && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Generated Cold Email
              </span>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground font-mono whitespace-pre-line leading-relaxed">
                {getCompiledEmail()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
