import { AppState } from "../types";

// A brand-new workspace starts with nothing fabricated: zero leads, zero
// conversations, zero campaigns. Every one of these arrays is populated only
// by real user actions or real connected-channel data going forward.
export function emptyAppState(overrides?: Partial<AppState>): AppState {
  return {
    workspaceId: "",
    user: {
      id: "",
      email: "",
      role: "user",
      plan: "Trial",
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      limits: { hashtagsWeek: 10, leadsDay: 10, dmsHour: 200 },
      usage: { hashtagsUsed: 0, leadsToday: 0, dmsSentToday: 0 },
    },
    setupDismissed: false,
    onboarding: [
      { id: 1, title: "Hashtags configured", helper: "Hashtags are how we find your leads", action: "Manage", destination: "/pipeline/instagram/hashtags/setup", completed: false },
      { id: 2, title: "Filtering criteria set", helper: "Define who qualifies as a lead", action: "Edit", destination: "/pipeline/instagram/filters", completed: false },
      { id: 3, title: "Generate your first leads", helper: "Open Hashtag Leads and click Start Lead Generation", action: "Go to Leads", destination: "/pipeline/instagram/hashtags/leads", completed: false },
      { id: 4, title: "DM template created", helper: "Personalized messages to send leads", action: "Set up", destination: "/outreach/templates", completed: false },
      { id: 5, title: "Competitors added", helper: "Find leads from competitor followers", action: "Add", destination: "/pipeline/instagram/competitors/setup", completed: false },
    ],
    businessProfile: { description: "", targetRegion: "" },
    hashtags: [],
    competitors: [],
    filters: {
      contentThemes: [],
      followerRange: { min: 1000, max: 100000, minEnabled: false, maxEnabled: false },
      targetLocations: [],
      languages: [],
      blockedKeywords: [],
      blockedCategories: [],
      mustHaveEmail: false,
      mustHavePhone: false,
      websiteRequirement: "any",
    },
    instagramLeads: [],
    mapsLeads: [],
    linkedinLeads: [],
    whatsappLeads: [],
    xLeads: [],
    conversations: [],
    campaigns: [],
    aiReplyRules: {
      businessDefinition: "",
      postReplyInstruction: "",
      stopMessagingCriteria: "",
      humanHandoffCriteria: "",
    },
    templates: {
      hashtagDm: "",
      hashtagEmail: "",
      fromName: "",
      companyName: "",
      competitorDm: "",
    },
    integrations: {
      instagram: { connected: false },
      gmail: { accounts: [] },
      whatsapp: { connected: false },
      x: { connected: false },
      linkedin: { connected: false, dailyConnectionLimit: 20, dailyMessageLimit: 30 },
    },
    settings: {
      darkMode: false,
      pushNotifications: true,
      dailyLeadsEmail: false,
      cycleExpirationReminder: false,
      automatedLeadGeneration: false,
      automatedWeeklyCycle: false,
    },
    ...overrides,
  };
}

export const initialAppState = emptyAppState();

export const PLAN_LIMITS: Record<"Trial" | "Silver" | "Gold" | "Platinum", { hashtagsWeek: number; leadsDay: number; dmsHour: number }> = {
  Trial: { hashtagsWeek: 10, leadsDay: 10, dmsHour: 200 },
  Silver: { hashtagsWeek: 10, leadsDay: 40, dmsHour: 200 },
  Gold: { hashtagsWeek: 20, leadsDay: 80, dmsHour: 200 },
  Platinum: { hashtagsWeek: 30, leadsDay: 200, dmsHour: 200 },
};
