"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, BusinessProfile, Competitor, FilterCriteria, Hashtag, InstagramLead, MapsLead, MessageTemplates, AIReplyRules } from "../types";
import { initialAppState } from "./initial-data";

interface AppContextType {
  state: AppState;
  updateBusinessProfile: (profile: BusinessProfile) => void;
  generateHashtagsAI: (desc: string, region: string) => Promise<void>;
  addHashtag: (tag: string) => void;
  deleteHashtag: (id: string) => void;
  addCompetitor: (username: string) => void;
  deleteCompetitor: (id: string) => void;
  updateFilters: (filters: FilterCriteria) => void;
  startLeadGenerationCycle: () => void;
  updateInstagramLeadDecision: (id: string, decision: "matched" | "blocked") => void;
  sendInstagramLeadDm: (id: string) => void;
  revealMapsLead: (id: string) => void;
  enrichMapsLead: (id: string) => void;
  addMapsDiscoveryBatch: (location: string, query: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  updateAIReplyRules: (rules: AIReplyRules) => void;
  updateTemplates: (templates: MessageTemplates) => void;
  createCampaign: (name: string, channel: "instagram" | "maps", mode: "automated" | "manual" | "advanced") => void;
  updateSettings: (settings: Partial<AppState["settings"]>) => void;
  updateIntegrations: (integrations: Partial<AppState["integrations"]>) => void;
  upgradePlan: (plan: "Silver" | "Gold" | "Platinum") => void;
  dismissSetupWidget: () => void;
  completeOnboardingStep: (id: number) => void;
  tourOpen: boolean;
  setTourOpen: (open: boolean) => void;
  activeTourStep: number;
  setActiveTourStep: (step: number) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  audioPlaying: boolean;
  setAudioPlaying: (playing: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "celestia_leads_app_state_v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [activeTourStep, setActiveTourStep] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch {
      // Ignore parse failure and keep initial state
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const completeOnboardingStep = (id: number) => {
    setState((prev) => ({
      ...prev,
      onboarding: prev.onboarding.map((s) => (s.id === id ? { ...s, completed: true } : s)),
    }));
  };

  const updateBusinessProfile = (profile: BusinessProfile) => {
    setState((prev) => ({
      ...prev,
      businessProfile: profile,
    }));
  };

  const generateHashtagsAI = async (desc: string, region: string) => {
    let generated: Hashtag[] = [];
    try {
      const res = await fetch("/api/generate/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, region }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hashtags && data.hashtags.length > 0) {
          generated = data.hashtags;
        }
      }
    } catch {
      // fallback
    }

    if (generated.length === 0) {
      const keywords = (desc + " " + region).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);
      const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 4);
      generated = uniqueKeywords.map((kw, idx) => ({
        id: "ht_gen_" + Date.now() + "_" + idx,
        tag: "#" + kw + (idx % 2 === 0 ? "growth" : "leads"),
        source: "ai",
        validationScore: Math.floor(82 + Math.random() * 16),
        postsCount: (Math.floor(200 + Math.random() * 800)) + "k",
        relevanceScore: Math.floor(88 + Math.random() * 11),
        active: true,
      }));
    }

    setState((prev) => {
      const combined = [...prev.hashtags, ...generated].slice(0, prev.user.limits.hashtagsWeek);
      return {
        ...prev,
        hashtags: combined,
        user: {
          ...prev.user,
          usage: {
            ...prev.user.usage,
            hashtagsUsed: combined.length,
          },
        },
      };
    });

    completeOnboardingStep(1);
  };

  const addHashtag = (tag: string) => {
    const clean = tag.startsWith("#") ? tag : "#" + tag;
    const newTag: Hashtag = {
      id: "ht_" + Date.now(),
      tag: clean,
      source: "manual",
      validationScore: 89,
      postsCount: "450k",
      relevanceScore: 90,
      active: true,
    };
    setState((prev) => ({
      ...prev,
      hashtags: [...prev.hashtags, newTag].slice(0, prev.user.limits.hashtagsWeek),
    }));
    completeOnboardingStep(1);
  };

  const deleteHashtag = (id: string) => {
    setState((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((h) => h.id !== id),
    }));
  };

  const addCompetitor = (username: string) => {
    const clean = username.replace(/^@/, "").trim();
    if (!clean) return;
    const newComp: Competitor = {
      id: "comp_" + Date.now(),
      username: clean,
      name: clean.charAt(0).toUpperCase() + clean.slice(1) + " Studio",
      followersCount: (Math.floor(10 + Math.random() * 90)) + "." + Math.floor(Math.random() * 9) + "k",
      addedAt: new Date().toISOString(),
      lockedUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    setState((prev) => ({
      ...prev,
      competitors: [...prev.competitors, newComp].slice(0, 5),
    }));
    completeOnboardingStep(5);
  };

  const deleteCompetitor = (id: string) => {
    setState((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((c) => c.id !== id),
    }));
  };

  const updateFilters = (filters: FilterCriteria) => {
    setState((prev) => ({
      ...prev,
      filters,
    }));
    completeOnboardingStep(2);
  };

  const startLeadGenerationCycle = () => {
    // Generate 3 fresh mock/AI candidates matching current hashtags
    const pool = [
      {
        username: "hannah.growthagency",
        name: "Hannah Brooks",
        bio: "Founder & Creative Director @FluxDesignCo. Helping B2B SaaS companies craft conversion funnels. ?? hannah@fluxdesign.co",
        category: "Design & Marketing",
        location: "Toronto, Canada",
        email: "hannah@fluxdesign.co",
        followers: 19800,
        engagement: "4.2%",
      },
      {
        username: "jordan.dtcfounder",
        name: "Jordan Vance",
        bio: "Co-Founder @VeloxSupps. $4M ARR bootstrap ecommerce. Angel investor in martech.",
        category: "E-Commerce",
        location: "Denver, Colorado",
        email: "jordan@veloxsupps.com",
        followers: 34100,
        engagement: "3.7%",
      },
      {
        username: "devin.saasoutreach",
        name: "Devin Miller",
        bio: "Head of Growth @StackPulse. Helping SMB founders automate client research.",
        category: "Software & Technology",
        location: "London, UK",
        email: "devin@stackpulse.io",
        followers: 12400,
        engagement: "2.9%",
      },
    ];

    const newLeads: InstagramLead[] = pool.map((p, idx) => ({
      id: "ig_gen_" + Date.now() + "_" + idx,
      username: p.username,
      name: p.name,
      bio: p.bio,
      followers: p.followers,
      engagement: p.engagement,
      category: p.category,
      location: p.location,
      email: p.email,
      source: "hashtag",
      sourceRef: state.hashtags[0]?.tag || "#b2bmarketing",
      decision: "matched",
      foundAt: new Date().toISOString(),
      generatedDm: `Hey ${p.name.split(" ")[0]}! Loved your profile at ${p.category}. We designed a system that turns Instagram hashtags directly into qualified pipeline. Would love to send a 2-min demo!`,
      generatedEmail: `Hi ${p.name.split(" ")[0]},\n\nNoticed your work scaling ${p.category}. We built an AI pipeline that identifies qualified leads and automates initial outreach.\n\nOpen to a brief preview?\n\nBest,\n${state.templates.fromName}`,
      dmSent: false,
      emailSent: false,
      replied: false,
      opened: false,
    }));

    setState((prev) => ({
      ...prev,
      instagramLeads: [...newLeads, ...prev.instagramLeads],
      user: {
        ...prev.user,
        usage: {
          ...prev.user.usage,
          leadsToday: prev.user.usage.leadsToday + newLeads.length,
        },
      },
    }));

    completeOnboardingStep(3);
  };

  const updateInstagramLeadDecision = (id: string, decision: "matched" | "blocked") => {
    setState((prev) => ({
      ...prev,
      instagramLeads: prev.instagramLeads.map((l) => (l.id === id ? { ...l, decision } : l)),
    }));
  };

  const sendInstagramLeadDm = (id: string) => {
    setState((prev) => {
      const lead = prev.instagramLeads.find((l) => l.id === id);
      if (!lead) return prev;

      const updatedLeads = prev.instagramLeads.map((l) => (l.id === id ? { ...l, dmSent: true } : l));

      // Also create or append to conversation in Inbox
      const existingConv = prev.conversations.find((c) => c.contactHandle === "@" + lead.username);
      let updatedConvs = [...prev.conversations];

      if (existingConv) {
        updatedConvs = prev.conversations.map((c) =>
          c.id === existingConv.id
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: "msg_" + Date.now(),
                    sender: "me",
                    text: lead.generatedDm,
                    timestamp: "Just now",
                  },
                ],
              }
            : c
        );
      } else {
        updatedConvs.unshift({
          id: "conv_" + Date.now(),
          channel: "instagram",
          contactName: lead.name,
          contactHandle: "@" + lead.username,
          contactAvatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`,
          contactType: "lead",
          needsHuman: false,
          lastActive: "Just now",
          unread: false,
          messages: [
            {
              id: "msg_" + Date.now(),
              sender: "me",
              text: lead.generatedDm,
              timestamp: "Just now",
            },
          ],
        });
      }

      return {
        ...prev,
        instagramLeads: updatedLeads,
        conversations: updatedConvs,
        user: {
          ...prev.user,
          usage: {
            ...prev.user.usage,
            dmsSentToday: prev.user.usage.dmsSentToday + 1,
          },
        },
      };
    });
  };

  const revealMapsLead = (id: string) => {
    setState((prev) => ({
      ...prev,
      mapsLeads: prev.mapsLeads.map((m) =>
        m.id === id
          ? {
              ...m,
              revealed: true,
              decision: "matched",
              phone: m.phone || "+1 (555) 234-8901",
              email: m.email || "info@" + m.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
              executives: m.executives.length > 0 ? m.executives : [{ name: "Alex Morgan", title: "Chief Executive Officer", email: "alex@" + m.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com" }],
            }
          : m
      ),
    }));
  };

  const enrichMapsLead = (id: string) => {
    setState((prev) => ({
      ...prev,
      mapsLeads: prev.mapsLeads.map((m) =>
        m.id === id
          ? {
              ...m,
              executives: [
                ...m.executives,
                {
                  name: "Sarah Miller",
                  title: "Head of Marketing",
                  email: "sarah@" + m.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
                  linkedin: "linkedin.com/in/sarahmiller-dir",
                },
              ],
            }
          : m
      ),
    }));
  };

  const addMapsDiscoveryBatch = (location: string, query: string) => {
    const cleanLocation = location || "New York, NY";
    const cleanQuery = query || "Marketing Agency";

    const generated: MapsLead[] = [
      {
        id: "maps_new_" + Date.now() + "_1",
        name: cleanLocation.split(",")[0] + " " + cleanQuery + " Group",
        category: cleanQuery,
        address: "100 Market Street, Suite 400",
        city: cleanLocation,
        phone: "+1 (415) 555-0199",
        website: "https://marketgrowthexample.com",
        email: "contact@marketgrowthexample.com",
        rating: 4.9,
        reviewsCount: 76,
        revealed: true,
        decision: "matched",
        executives: [{ name: "Marcus Shaw", title: "Principal Partner", email: "marcus@marketgrowthexample.com" }],
      },
      {
        id: "maps_new_" + Date.now() + "_2",
        name: "Prime " + cleanQuery + " Solutions",
        category: cleanQuery,
        address: "450 Broadway Ave",
        city: cleanLocation,
        phone: "+1 (415) 555-0182",
        website: "https://primesolutionsagency.io",
        email: "hello@primesolutionsagency.io",
        rating: 4.7,
        reviewsCount: 52,
        revealed: false,
        decision: "pending",
        executives: [{ name: "Jessica Taylor", title: "Managing Director" }],
      },
    ];

    setState((prev) => ({
      ...prev,
      mapsLeads: [...generated, ...prev.mapsLeads],
    }));
  };

  const sendMessage = (conversationId: string, text: string) => {
    setState((prev) => {
      const conv = prev.conversations.find((c) => c.id === conversationId);
      if (!conv) return prev;

      const userMsg = {
        id: "msg_" + Date.now(),
        sender: "me" as const,
        text,
        timestamp: "Just now",
      };

      const updated = prev.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastActive: "Just now",
              messages: [...c.messages, userMsg],
            }
          : c
      );

      return {
        ...prev,
        conversations: updated,
      };
    });

    // Auto trigger AI reply after 1.5 seconds if configured
    setTimeout(() => {
      setState((prev) => {
        const conv = prev.conversations.find((c) => c.id === conversationId);
        if (!conv) return prev;

        const aiMsg = {
          id: "msg_ai_" + Date.now(),
          sender: "ai" as const,
          text: `[AI Assistant]: Thanks for following up! We've automatically logged your request according to the workspace criteria: "${state.aiReplyRules.postReplyInstruction.slice(0, 90)}...". Let me know if you would like me to book a demo slot!`,
          timestamp: "Just now",
        };

        return {
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, aiMsg],
                }
              : c
          ),
        };
      });
    }, 1200);
  };

  const updateAIReplyRules = (rules: AIReplyRules) => {
    setState((prev) => ({
      ...prev,
      aiReplyRules: rules,
    }));
  };

  const updateTemplates = (templates: MessageTemplates) => {
    setState((prev) => ({
      ...prev,
      templates,
    }));
    completeOnboardingStep(4);
  };

  const createCampaign = (name: string, channel: "instagram" | "maps", mode: "automated" | "manual" | "advanced") => {
    const newCamp = {
      id: "camp_" + Date.now(),
      name,
      channel,
      mode,
      status: "running" as const,
      recipientsCount: channel === "instagram" ? state.instagramLeads.filter((l) => l.decision === "matched").length : state.mapsLeads.filter((l) => l.revealed).length,
      sentCount: 0,
      repliedCount: 0,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      campaigns: [newCamp, ...prev.campaigns],
    }));
  };

  const updateSettings = (settings: Partial<AppState["settings"]>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const updateIntegrations = (integrations: Partial<AppState["integrations"]>) => {
    setState((prev) => ({
      ...prev,
      integrations: { ...prev.integrations, ...integrations },
    }));
  };

  const upgradePlan = (plan: "Silver" | "Gold" | "Platinum") => {
    const limits = {
      Silver: { hashtagsWeek: 10, leadsDay: 40, dmsHour: 200 },
      Gold: { hashtagsWeek: 20, leadsDay: 80, dmsHour: 200 },
      Platinum: { hashtagsWeek: 30, leadsDay: 200, dmsHour: 200 },
    }[plan];

    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        plan,
        limits,
      },
    }));
  };

  const dismissSetupWidget = () => {
    setState((prev) => ({
      ...prev,
      setupDismissed: true,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
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
        updateAIReplyRules,
        updateTemplates,
        createCampaign,
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
        audioPlaying,
        setAudioPlaying,
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
