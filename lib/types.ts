export interface WorkspaceUser {
  id: string;
  email: string;
  role: "user" | "admin";
  plan: "Trial" | "Silver" | "Gold" | "Platinum";
  trialEndsAt: string;
  limits: {
    hashtagsWeek: number;
    leadsDay: number;
    dmsHour: number;
  };
  usage: {
    hashtagsUsed: number;
    leadsToday: number;
    dmsSentToday: number;
  };
}

export interface OnboardingStep {
  id: number;
  title: string;
  helper: string;
  action: string;
  destination: string;
  completed: boolean;
}

export interface BusinessProfile {
  description: string;
  targetRegion: string;
}

export interface Hashtag {
  id: string;
  tag: string;
  source: "ai" | "manual";
  validationScore: number;
  postsCount: string;
  relevanceScore: number;
  active: boolean;
}

export interface Competitor {
  id: string;
  username: string;
  name: string;
  followersCount: string;
  addedAt: string;
  lockedUntil: string;
}

export interface FilterCriteria {
  contentThemes: string[];
  followerRange: {
    min: number;
    max: number;
    minEnabled: boolean;
    maxEnabled: boolean;
  };
  targetLocations: string[];
  languages: string[];
  blockedKeywords: string[];
  blockedCategories: string[];
  mustHaveEmail: boolean;
  mustHavePhone: boolean;
  websiteRequirement: "any" | "with_link" | "without_link";
}

export interface InstagramLead {
  id: string;
  username: string;
  name: string;
  bio: string;
  followers: number;
  engagement: string;
  category: string;
  location: string;
  email: string;
  source: "hashtag" | "competitor";
  sourceRef: string;
  decision: "matched" | "blocked" | "pending";
  foundAt: string;
  generatedDm: string;
  generatedEmail: string;
  dmSent: boolean;
  emailSent: boolean;
  replied: boolean;
  opened?: boolean;
}

export interface MapsLead {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  email: string;
  rating: number;
  reviewsCount: number;
  revealed: boolean;
  decision: "matched" | "blocked" | "pending";
  executives: {
    name: string;
    title: string;
    email?: string;
    linkedin?: string;
  }[];
}

export interface Conversation {
  id: string;
  channel: "instagram" | "email";
  contactName: string;
  contactHandle: string;
  contactAvatar: string;
  contactType: "lead" | "user";
  needsHuman: boolean;
  lastActive: string;
  unread: boolean;
  messages: {
    id: string;
    sender: "me" | "them" | "ai";
    text: string;
    timestamp: string;
  }[];
}

export interface Campaign {
  id: string;
  name: string;
  channel: "instagram" | "maps";
  mode: "automated" | "manual" | "advanced";
  status: "draft" | "running" | "paused" | "completed";
  recipientsCount: number;
  sentCount: number;
  repliedCount: number;
  createdAt: string;
}

export interface AIReplyRules {
  businessDefinition: string;
  postReplyInstruction: string;
  stopMessagingCriteria: string;
  humanHandoffCriteria: string;
}

export interface MessageTemplates {
  hashtagDm: string;
  hashtagEmail: string;
  fromName: string;
  companyName: string;
  competitorDm: string;
}

export interface PlatformIntegrations {
  instagram: {
    connected: boolean;
    appLabel?: string;
    appId?: string;
    appSecret?: string;
    token?: string;
    webhookConfigured?: boolean;
    verifyToken?: string;
  };
  gmail: {
    accounts: {
      email: string;
      connected: boolean;
      type: "app_password" | "oauth";
      dailySent: number;
    }[];
  };
}

export interface AppState {
  user: WorkspaceUser;
  onboarding: OnboardingStep[];
  setupDismissed: boolean;
  businessProfile: BusinessProfile;
  hashtags: Hashtag[];
  competitors: Competitor[];
  filters: FilterCriteria;
  instagramLeads: InstagramLead[];
  mapsLeads: MapsLead[];
  conversations: Conversation[];
  campaigns: Campaign[];
  aiReplyRules: AIReplyRules;
  templates: MessageTemplates;
  integrations: PlatformIntegrations;
  settings: {
    darkMode: boolean;
    pushNotifications: boolean;
    dailyLeadsEmail: boolean;
    cycleExpirationReminder: boolean;
    automatedLeadGeneration: boolean;
    automatedWeeklyCycle: boolean;
  };
}
