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

export type Channel = "instagram" | "email" | "whatsapp" | "x" | "linkedin";

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

export interface LinkedInLead {
  id: string;
  profileUrl: string;
  name: string;
  headline: string;
  location: string;
  company: string;
  title: string;
  connectionDegree: "1st" | "2nd" | "3rd" | "out_of_network";
  source: "search" | "sales_navigator";
  sourceRef: string;
  decision: "matched" | "blocked" | "pending";
  foundAt: string;
  generatedMessage: string;
  connectionSent: boolean;
  connectionAccepted: boolean;
  messageSent: boolean;
  replied: boolean;
}

export interface WhatsAppLead {
  id: string;
  phone: string;
  name: string;
  source: "maps" | "manual" | "csv";
  decision: "matched" | "blocked" | "pending";
  foundAt: string;
  generatedMessage: string;
  messageSent: boolean;
  delivered: boolean;
  read: boolean;
  replied: boolean;
}

export interface XLead {
  id: string;
  handle: string;
  name: string;
  bio: string;
  followers: number;
  source: "search" | "competitor";
  sourceRef: string;
  decision: "matched" | "blocked" | "pending";
  foundAt: string;
  generatedDm: string;
  dmSent: boolean;
  replied: boolean;
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
  rating: number | null;
  reviewsCount: number | null;
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
  channel: Channel;
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
  channel: "instagram" | "maps" | "whatsapp" | "x" | "linkedin";
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
    igUserId?: string;
    username?: string;
    // "instagram_login" = connected via the real OAuth flow (Instagram API
    // with Instagram Login); undefined/other = the older BYO Page Access
    // Token paste flow. Determines which Graph host sends use.
    authMethod?: "instagram_login" | "page_token";
    tokenExpiresAt?: string;
    // Separate from the official Graph API connection above: a saved browser
    // session used by the automation worker for cold discovery/outreach,
    // since the Graph API doesn't support either.
    sessionConnected?: boolean;
    sessionLabel?: string;
    sessionSavedAt?: string;
  };
  gmail: {
    accounts: {
      email: string;
      connected: boolean;
      type: "app_password" | "oauth";
      dailySent: number;
    }[];
  };
  whatsapp: {
    connected: boolean;
    connectMethod?: "embedded_signup" | "manual";
    phoneNumberId?: string;
    businessAccountId?: string;
    displayPhone?: string;
    webhookConfigured?: boolean;
    verifyToken?: string;
  };
  x: {
    connected: boolean;
    handle?: string;
    appKey?: string;
    appSecret?: string;
    accessToken?: string;
    accessSecret?: string;
  };
  linkedin: {
    connected: boolean;
    accountLabel?: string;
    sessionSavedAt?: string;
    dailyConnectionLimit: number;
    dailyMessageLimit: number;
  };
}

export interface AppState {
  workspaceId: string;
  user: WorkspaceUser;
  onboarding: OnboardingStep[];
  setupDismissed: boolean;
  businessProfile: BusinessProfile;
  hashtags: Hashtag[];
  competitors: Competitor[];
  filters: FilterCriteria;
  instagramLeads: InstagramLead[];
  mapsLeads: MapsLead[];
  linkedinLeads: LinkedInLead[];
  whatsappLeads: WhatsAppLead[];
  xLeads: XLead[];
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
