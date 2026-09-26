"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppState, BusinessProfile, Competitor, FilterCriteria, Hashtag, MessageTemplates, AIReplyRules, Channel } from "../types";
import { emptyAppState, PLAN_LIMITS } from "./initial-data";
import { loadWorkspaceState } from "./db";
import { createSupabaseBrowserClient } from "../supabase/client";

interface AppContextType {
  state: AppState;
  loading: boolean;
  refresh: () => Promise<void>;
  updateBusinessProfile: (profile: BusinessProfile) => Promise<void>;
  generateHashtagsAI: (desc: string, region: string) => Promise<void>;
  addHashtag: (tag: string) => Promise<void>;
  deleteHashtag: (id: string) => Promise<void>;
  addCompetitor: (username: string) => Promise<void>;
  deleteCompetitor: (id: string) => Promise<void>;
  updateFilters: (filters: FilterCriteria) => Promise<void>;
  startLeadGenerationCycle: () => Promise<{ ok: boolean; message: string }>;
  updateInstagramLeadDecision: (id: string, decision: "matched" | "blocked") => Promise<void>;
  sendInstagramLeadDm: (id: string) => Promise<{ ok: boolean; message: string }>;
  revealMapsLead: (id: string) => Promise<void>;
  enrichMapsLead: (id: string) => Promise<void>;
  addMapsDiscoveryBatch: (location: string, query: string, lat?: number, lng?: number) => Promise<{ ok: boolean; message: string }>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  syncGmail: () => Promise<{ ok: boolean; message: string }>;
  updateAIReplyRules: (rules: AIReplyRules) => Promise<void>;
  updateTemplates: (templates: MessageTemplates) => Promise<void>;
  createCampaign: (name: string, channel: "instagram" | "maps" | "whatsapp" | "x" | "linkedin", mode: "automated" | "manual" | "advanced") => Promise<void>;
  toggleCampaignStatus: (id: string) => Promise<void>;
  queueCompetitorScrape: () => Promise<{ ok: boolean; message: string }>;
  queueManualInstagramDms: (rows: { username: string; message: string }[]) => Promise<{ ok: boolean; message: string }>;
  updateSettings: (settings: Partial<AppState["settings"]>) => Promise<void>;
  updateIntegrations: (integrations: Partial<AppState["integrations"]>) => Promise<void>;
  upgradePlan: (plan: "Silver" | "Gold" | "Platinum") => Promise<void>;
  dismissSetupWidget: () => Promise<void>;
  completeOnboardingStep: (id: number) => Promise<void>;
  tourOpen: boolean;
  setTourOpen: (open: boolean) => void;
  activeTourStep: number;
  setActiveTourStep: (step: number) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  toast: { message: string; tone: "info" | "error" } | null;
  showToast: (message: string, tone?: "info" | "error") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyAppState());
  const [loading, setLoading] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const [activeTourStep, setActiveTourStep] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "error" } | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, tone: "info" | "error" = "info") => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const supabase = createSupabaseBrowserClient();

  const refresh = useCallback(async () => {
    const loaded = await loadWorkspaceState(supabase);
    if (loaded) setState(loaded);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const wsId = () => state.workspaceId;

  const completeOnboardingStep = async (id: number) => {
    const steps = state.onboarding.map((s) => (s.id === id ? { ...s, completed: true } : s));
    setState((prev) => ({ ...prev, onboarding: steps }));
    if (wsId()) {
      await supabase.from("onboarding_state").upsert({ workspace_id: wsId(), steps });
    }
  };

  const updateBusinessProfile = async (profile: BusinessProfile) => {
    setState((prev) => ({ ...prev, businessProfile: profile }));
    if (!wsId()) return;
    await supabase.from("business_profiles").upsert({
      workspace_id: wsId(),
      description: profile.description,
      target_region: profile.targetRegion,
    });
  };

  const generateHashtagsAI = async (desc: string, region: string) => {
    await updateBusinessProfile({ description: desc, targetRegion: region });

    const res = await fetch("/api/generate/hashtags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, region }),
    });
    const data = await res.json();
    const existingTags = new Set(state.hashtags.map((h) => h.tag.toLowerCase()));
    const seen = new Set<string>();
    const deduped: Hashtag[] = (data.hashtags || []).filter((h: Hashtag) => {
      const key = h.tag.toLowerCase();
      if (existingTags.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const generated: Hashtag[] = deduped.slice(0, state.user.limits.hashtagsWeek - state.hashtags.length);
    if (generated.length === 0) return;

    const { data: inserted } = await supabase
      .from("hashtags")
      .insert(
        generated.map((h) => ({
          workspace_id: wsId(),
          tag: h.tag,
          source: "ai",
          validation_score: h.validationScore,
          posts_count: h.postsCount,
          relevance_score: h.relevanceScore,
          active: true,
        }))
      )
      .select();

    if (inserted) {
      const mapped: Hashtag[] = inserted.map((r: any) => ({
        id: r.id,
        tag: r.tag,
        source: r.source,
        validationScore: r.validation_score,
        postsCount: r.posts_count,
        relevanceScore: r.relevance_score,
        active: r.active,
      }));
      setState((prev) => ({
        ...prev,
        hashtags: [...mapped, ...prev.hashtags],
        user: { ...prev.user, usage: { ...prev.user.usage, hashtagsUsed: prev.user.usage.hashtagsUsed + mapped.length } },
      }));
    }
    await completeOnboardingStep(1);
  };

  const addHashtag = async (tag: string) => {
    const clean = tag.startsWith("#") ? tag : "#" + tag;
    if (state.hashtags.some((h) => h.tag.toLowerCase() === clean.toLowerCase())) {
      showToast(`${clean} is already in your list.`, "error");
      return;
    }
    const { data } = await supabase
      .from("hashtags")
      .insert({ workspace_id: wsId(), tag: clean, source: "manual", validation_score: 0, posts_count: "—", relevance_score: 0, active: true })
      .select()
      .single();
    if (data) {
      setState((prev) => ({
        ...prev,
        hashtags: [
          { id: data.id, tag: data.tag, source: "manual", validationScore: 0, postsCount: "—", relevanceScore: 0, active: true },
          ...prev.hashtags,
        ],
      }));
    }
    await completeOnboardingStep(1);
  };

  const deleteHashtag = async (id: string) => {
    setState((prev) => ({ ...prev, hashtags: prev.hashtags.filter((h) => h.id !== id) }));
    await supabase.from("hashtags").delete().eq("id", id);
  };

  const addCompetitor = async (username: string) => {
    const clean = username.replace(/^@/, "").trim();
    if (!clean) return;

    let name = clean;
    let followersCount = "—";

    // Real lookup via Instagram Business Discovery (requires a connected IG business account).
    if (state.integrations.instagram.connected && state.integrations.instagram.igUserId) {
      try {
        const res = await fetch(`/api/channels/instagram/business-discovery?username=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.name) name = data.name;
          if (data.followersCount) followersCount = data.followersCount;
        }
      } catch {
        // leave as unknown — no fabrication
      }
    }

    const { data } = await supabase
      .from("competitors")
      .insert({
        workspace_id: wsId(),
        username: clean,
        name,
        followers_count: followersCount,
        locked_until: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      .select()
      .single();

    if (data) {
      const comp: Competitor = {
        id: data.id,
        username: data.username,
        name: data.name,
        followersCount: data.followers_count,
        addedAt: data.added_at,
        lockedUntil: data.locked_until,
      };
      setState((prev) => ({ ...prev, competitors: [...prev.competitors, comp].slice(0, 5) }));
    }
    await completeOnboardingStep(5);
  };

  const deleteCompetitor = async (id: string) => {
    setState((prev) => ({ ...prev, competitors: prev.competitors.filter((c) => c.id !== id) }));
    await supabase.from("competitors").delete().eq("id", id);
  };

  const updateFilters = async (filters: FilterCriteria) => {
    setState((prev) => ({ ...prev, filters }));
    await supabase.from("lead_filters").upsert({ workspace_id: wsId(), criteria: filters });
    await completeOnboardingStep(2);
  };

  // Instagram's official Hashtag Search API deliberately omits post authors
  // (Meta blocks exactly this lead-gen use case), so real discovery runs
  // through the browser-automation worker against your own logged-in session
  // instead — see Settings > Instagram > Browser Automation.
  const startLeadGenerationCycle = async () => {
    if (!state.integrations.instagram.sessionConnected) {
      return { ok: false, message: "Connect your Instagram browser session in Settings to run real hashtag discovery (Instagram's API doesn't expose post authors)." };
    }
    const res = await fetch("/api/automation/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        action: "search",
        payload: { hashtags: state.hashtags.filter((h) => h.active).map((h) => h.tag), filters: state.filters },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.error || "Could not queue discovery." };
    // Step 3 ("Generate your first leads") is intentionally NOT marked complete
    // here — queuing a job isn't the same as a lead existing. It's derived from
    // real lead rows in loadWorkspaceData instead.
    return { ok: true, message: "Queued. The automation worker will surface new profiles here as it finds them — check back in a few minutes." };
  };

  const updateInstagramLeadDecision = async (id: string, decision: "matched" | "blocked") => {
    setState((prev) => ({ ...prev, instagramLeads: prev.instagramLeads.map((l) => (l.id === id ? { ...l, decision } : l)) }));
    await supabase.from("leads").update({ decision }).eq("id", id);
  };

  // Cold outbound DM: Instagram's official Messaging API only supports
  // replying to users who've already messaged you, not first-touch cold
  // outreach. Sending goes through the same browser-automation worker used
  // for LinkedIn (the user's own logged-in session), not the Graph API.
  const sendInstagramLeadDm = async (id: string) => {
    if (!state.integrations.instagram.sessionConnected) {
      return { ok: false, message: "Connect your Instagram browser session in Settings to send DMs." };
    }
    const res = await fetch("/api/automation/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "instagram", action: "message", payload: { leadId: id } }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.error || "Could not queue this DM." };
    return { ok: true, message: "Queued — the automation worker will send it shortly, pacing to stay human-like." };
  };

  const revealMapsLead = async (id: string) => {
    const res = await fetch("/api/channels/maps/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id, mode: "reveal" }),
    });
    if (res.ok) await refresh();
  };

  const enrichMapsLead = async (id: string) => {
    const res = await fetch("/api/channels/maps/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id, mode: "enrich" }),
    });
    if (res.ok) await refresh();
  };

  const addMapsDiscoveryBatch = async (location: string, query: string, lat?: number, lng?: number) => {
    const res = await fetch("/api/maps/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, query, lat, lng, workspaceId: wsId() }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.error || "Search failed." };
    await refresh();
    return { ok: true, message: `Found ${data.count} real business${data.count === 1 ? "" : "es"} near "${location}".` };
  };

  // Real send routes per channel — each one calls the actual platform API
  // (WhatsApp Cloud API, Meta Send API, Gmail SMTP) and only writes the
  // message row itself once that real send succeeds. X and LinkedIn have no
  // reply-in-thread API route yet (X's Basic tier only supports the one-shot
  // cold DM used by campaigns; LinkedIn goes through the browser-automation
  // worker, not a live API) — the Inbox UI disables composing for those so
  // this never gets called with those channels.
  const SEND_ROUTE: Partial<Record<Channel, string>> = {
    whatsapp: "/api/channels/whatsapp/send",
    instagram: "/api/channels/instagram/send",
    email: "/api/channels/gmail/send",
  };

  const sendMessage = async (conversationId: string, text: string) => {
    const conv = state.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const route = SEND_ROUTE[conv.channel];
    if (!route) {
      showToast(`Replying isn't supported yet for ${conv.channel}.`, "error");
      return;
    }

    const res = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, text }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to send message.", "error");
      return;
    }

    await refresh();

    // Real AI auto-reply via Groq, using this workspace's actual reply rules —
    // only fires if the workspace has configured aiReplyRules.postReplyInstruction.
    if (state.aiReplyRules.postReplyInstruction) {
      fetch("/api/channels/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      })
        .then(() => refresh())
        .catch(() => {});
    }
  };

  const syncGmail = async (): Promise<{ ok: boolean; message: string }> => {
    const res = await fetch("/api/channels/gmail/sync", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.error || "Sync failed." };
    await refresh();
    if (data.errors?.length) return { ok: false, message: data.errors.join(" ") };
    return { ok: true, message: data.newMessages > 0 ? `Pulled ${data.newMessages} new email${data.newMessages === 1 ? "" : "s"}.` : "No new emails." };
  };

  const updateAIReplyRules = async (rules: AIReplyRules) => {
    setState((prev) => ({ ...prev, aiReplyRules: rules }));
    await supabase.from("ai_reply_rules").upsert({
      workspace_id: wsId(),
      business_definition: rules.businessDefinition,
      post_reply_instruction: rules.postReplyInstruction,
      stop_messaging_criteria: rules.stopMessagingCriteria,
      human_handoff_criteria: rules.humanHandoffCriteria,
    });
  };

  const updateTemplates = async (templates: MessageTemplates) => {
    setState((prev) => ({ ...prev, templates }));
    await supabase.from("message_templates").upsert({
      workspace_id: wsId(),
      hashtag_dm: templates.hashtagDm,
      hashtag_email: templates.hashtagEmail,
      from_name: templates.fromName,
      company_name: templates.companyName,
      competitor_dm: templates.competitorDm,
    });
    await completeOnboardingStep(4);
  };

  const createCampaign = async (name: string, channel: "instagram" | "maps" | "whatsapp" | "x" | "linkedin", mode: "automated" | "manual" | "advanced") => {
    const recipientsCount =
      channel === "instagram"
        ? state.instagramLeads.filter((l) => l.decision === "matched").length
        : channel === "maps"
        ? state.mapsLeads.filter((l) => l.revealed).length
        : channel === "whatsapp"
        ? state.whatsappLeads.filter((l) => l.decision === "matched").length
        : channel === "x"
        ? state.xLeads.filter((l) => l.decision === "matched").length
        : state.linkedinLeads.filter((l) => l.decision === "matched").length;

    const { data } = await supabase
      .from("campaigns")
      .insert({ workspace_id: wsId(), name, channel, mode, status: "running", recipients_count: recipientsCount })
      .select()
      .single();

    if (data) {
      setState((prev) => ({
        ...prev,
        campaigns: [
          { id: data.id, name: data.name, channel: data.channel, mode: data.mode, status: data.status, recipientsCount: data.recipients_count, sentCount: 0, repliedCount: 0, createdAt: data.created_at },
          ...prev.campaigns,
        ],
      }));
    }
  };

  const toggleCampaignStatus = async (id: string) => {
    const camp = state.campaigns.find((c) => c.id === id);
    if (!camp) return;
    const next = camp.status === "running" ? "paused" : "running";
    setState((prev) => ({ ...prev, campaigns: prev.campaigns.map((c) => (c.id === id ? { ...c, status: next } : c)) }));
    await supabase.from("campaigns").update({ status: next }).eq("id", id);
  };

  // Queues a real follower-scrape job per configured competitor — Instagram's
  // API has no endpoint for listing another account's followers at all, so
  // this runs on the same browser-automation worker as hashtag discovery.
  const queueCompetitorScrape = async () => {
    if (!state.integrations.instagram.sessionConnected) {
      return { ok: false, message: "Connect your Instagram browser session in Settings first." };
    }
    if (state.competitors.length === 0) {
      return { ok: false, message: "Add at least one competitor first." };
    }

    let queued = 0;
    for (const comp of state.competitors) {
      const res = await fetch("/api/automation/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "instagram", action: "search", payload: { competitorUsername: comp.username } }),
      });
      if (res.ok) queued++;
    }

    return { ok: queued > 0, message: queued > 0 ? `Queued ${queued} follower-scrape job(s).` : "Could not queue any jobs." };
  };

  // Creates real lead rows (not fabricated sample data) from a hand-typed
  // list, then queues each one on the same automation worker used for
  // regular Instagram DMs — requires a connected Instagram browser session.
  const queueManualInstagramDms = async (rows: { username: string; message: string }[]) => {
    const valid = rows.filter((r) => r.username.trim() && r.message.trim());
    if (valid.length === 0) return { ok: false, message: "Add at least one handle and message." };
    if (!state.integrations.instagram.sessionConnected) {
      return { ok: false, message: "Connect your Instagram browser session in Settings first." };
    }

    const { data: inserted, error } = await supabase
      .from("leads")
      .insert(
        valid.map((r) => ({
          workspace_id: wsId(),
          platform: "instagram",
          username: r.username.replace(/^@/, "").trim(),
          name: r.username.replace(/^@/, "").trim(),
          source: "manual",
          decision: "matched",
          generated_dm: r.message,
        }))
      )
      .select();

    if (error || !inserted) return { ok: false, message: error?.message || "Could not create leads." };

    let queued = 0;
    let firstError: string | null = null;
    for (const lead of inserted) {
      const res = await fetch("/api/automation/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "instagram", action: "message", payload: { leadId: lead.id } }),
      });
      if (res.ok) {
        queued++;
      } else if (!firstError) {
        const data = await res.json().catch(() => ({}));
        firstError = data.error || "Could not queue DM job.";
      }
    }

    await refresh();
    if (queued === 0 && firstError) {
      return { ok: false, message: `Created ${inserted.length} lead(s), but couldn't queue any DM jobs: ${firstError}` };
    }
    return { ok: true, message: `Created ${inserted.length} lead(s) and queued ${queued} DM job(s).` };
  };

  const updateSettings = async (settings: Partial<AppState["settings"]>) => {
    const merged = { ...state.settings, ...settings };
    setState((prev) => ({ ...prev, settings: merged }));
    await supabase.from("app_settings").upsert({
      workspace_id: wsId(),
      dark_mode: merged.darkMode,
      push_notifications: merged.pushNotifications,
      daily_leads_email: merged.dailyLeadsEmail,
      cycle_expiration_reminder: merged.cycleExpirationReminder,
      automated_lead_generation: merged.automatedLeadGeneration,
      automated_weekly_cycle: merged.automatedWeeklyCycle,
    });
  };

  const updateIntegrations = async (integrations: Partial<AppState["integrations"]>) => {
    const merged = { ...state.integrations, ...integrations };
    setState((prev) => ({ ...prev, integrations: merged }));
    await supabase.from("workspace_settings").upsert({
      workspace_id: wsId(),
      instagram: merged.instagram,
      gmail: merged.gmail,
      whatsapp: merged.whatsapp,
      x: merged.x,
      linkedin: merged.linkedin,
    });
  };

  const upgradePlan = async (plan: "Silver" | "Gold" | "Platinum") => {
    setState((prev) => ({ ...prev, user: { ...prev.user, plan, limits: PLAN_LIMITS[plan] } }));
    await supabase.from("workspaces").update({ plan }).eq("id", wsId());
  };

  const dismissSetupWidget = async () => {
    setState((prev) => ({ ...prev, setupDismissed: true }));
    await supabase.from("onboarding_state").upsert({ workspace_id: wsId(), setup_dismissed: true });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        loading,
        refresh,
        updateBusinessProfile,
        generateHashtagsAI,
        addHashtag,
        deleteHashtag,
        addCompetitor,
        deleteCompetitor,
        updateFilters,
        startLeadGenerationCycle,
        updateInstagramLeadDecision,
        sendInstagramLeadDm,
        revealMapsLead,
        enrichMapsLead,
        addMapsDiscoveryBatch,
        sendMessage,
        syncGmail,
        updateAIReplyRules,
        updateTemplates,
        createCampaign,
        toggleCampaignStatus,
        queueCompetitorScrape,
        queueManualInstagramDms,
        updateSettings,
        updateIntegrations,
        upgradePlan,
        dismissSetupWidget,
        completeOnboardingStep,
        tourOpen,
        setTourOpen,
        activeTourStep,
        setActiveTourStep,
        chatOpen,
        setChatOpen,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
