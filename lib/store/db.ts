import { SupabaseClient } from "@supabase/supabase-js";
import {
  AppState,
  Campaign,
  Competitor,
  Conversation,
  Hashtag,
  InstagramLead,
  LinkedInLead,
  MapsLead,
  WhatsAppLead,
  XLead,
} from "../types";
import { PLAN_LIMITS, emptyAppState } from "./initial-data";

function mapHashtag(r: any): Hashtag {
  return {
    id: r.id,
    tag: r.tag,
    source: r.source,
    validationScore: r.validation_score,
    postsCount: r.posts_count,
    relevanceScore: r.relevance_score,
    active: r.active,
  };
}

function mapCompetitor(r: any): Competitor {
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    followersCount: r.followers_count,
    addedAt: r.added_at,
    lockedUntil: r.locked_until,
  };
}

function mapInstagramLead(r: any): InstagramLead {
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    bio: r.bio,
    followers: r.followers || 0,
    engagement: r.engagement || "0%",
    category: r.category || "",
    location: r.location || "",
    email: r.email || "",
    source: r.source || "hashtag",
    sourceRef: r.source_ref || "",
    decision: r.decision,
    foundAt: r.found_at,
    generatedDm: r.generated_dm || "",
    generatedEmail: r.generated_email || "",
    dmSent: r.dm_sent,
    emailSent: r.email_sent,
    replied: r.replied,
    opened: r.opened,
  };
}

function mapMapsLead(r: any): MapsLead {
  return {
    id: r.id,
    name: r.name,
    category: r.category || "",
    address: r.address || "",
    city: r.city || "",
    phone: r.phone || "",
    website: r.website || "",
    email: r.email || "",
    rating: typeof r.rating === "number" ? r.rating : null,
    reviewsCount: typeof r.reviews_count === "number" ? r.reviews_count : null,
    revealed: r.revealed,
    decision: r.decision,
    executives: r.executives || [],
  };
}

function mapLinkedInLead(r: any): LinkedInLead {
  const m = r.metadata || {};
  return {
    id: r.id,
    profileUrl: m.profileUrl || r.website || "",
    name: r.name,
    headline: r.bio || "",
    location: r.location || "",
    company: m.company || "",
    title: m.title || "",
    connectionDegree: m.connectionDegree || "out_of_network",
    source: r.source || "search",
    sourceRef: r.source_ref || "",
    decision: r.decision,
    foundAt: r.found_at,
    generatedMessage: r.generated_dm || "",
    connectionSent: m.connectionSent || false,
    connectionAccepted: m.connectionAccepted || false,
    messageSent: r.dm_sent,
    replied: r.replied,
  };
}

function mapWhatsAppLead(r: any): WhatsAppLead {
  return {
    id: r.id,
    phone: r.phone || "",
    name: r.name,
    source: (r.source as any) || "manual",
    decision: r.decision,
    foundAt: r.found_at,
    generatedMessage: r.generated_dm || "",
    messageSent: r.dm_sent,
    delivered: r.metadata?.delivered || false,
    read: r.opened,
    replied: r.replied,
  };
}

function mapXLead(r: any): XLead {
  return {
    id: r.id,
    handle: r.username,
    name: r.name,
    bio: r.bio || "",
    followers: r.followers || 0,
    source: (r.source as any) || "search",
    sourceRef: r.source_ref || "",
    decision: r.decision,
    foundAt: r.found_at,
    generatedDm: r.generated_dm || "",
    dmSent: r.dm_sent,
    replied: r.replied,
  };
}

function mapCampaign(r: any): Campaign {
  return {
    id: r.id,
    name: r.name,
    channel: r.channel,
    mode: r.mode,
    status: r.status,
    recipientsCount: r.recipients_count,
    sentCount: r.sent_count,
    repliedCount: r.replied_count,
    createdAt: r.created_at,
  };
}

function mapConversation(r: any, messages: any[]): Conversation {
  return {
    id: r.id,
    channel: r.channel,
    contactName: r.contact_name,
    contactHandle: r.contact_handle,
    contactAvatar: r.contact_avatar || "",
    contactType: r.contact_type,
    needsHuman: r.needs_human,
    lastActive: r.last_active,
    unread: r.unread,
    messages: messages
      .filter((m) => m.conversation_id === r.id)
      .map((m) => ({ id: m.id, sender: m.sender, text: m.content, timestamp: m.created_at })),
  };
}

export async function getWorkspaceMembership(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .maybeSingle();
  return data as { workspace_id: string; role: string } | null;
}

export async function loadWorkspaceState(supabase: SupabaseClient): Promise<AppState | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let membership = await getWorkspaceMembership(supabase, user.id);

  // Safety net: a confirmed/authenticated user with no workspace yet (e.g. an
  // entry path that skipped the usual bootstrap step) gets one created here
  // rather than silently rendering an empty, broken dashboard.
  if (!membership) {
    await supabase.rpc("bootstrap_workspace", {
      p_user_id: user.id,
      p_workspace_name: user.email?.split("@")[0] || "My Workspace",
    });
    membership = await getWorkspaceMembership(supabase, user.id);
  }

  if (!membership) return null;

  const workspaceId = membership.workspace_id;

  const [
    workspaceRes,
    profileRes,
    filtersRes,
    rulesRes,
    templatesRes,
    settingsRes,
    appSettingsRes,
    onboardingRes,
    hashtagsRes,
    competitorsRes,
    leadsRes,
    conversationsRes,
    messagesRes,
    campaignsRes,
  ] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", workspaceId).single(),
    supabase.from("business_profiles").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("lead_filters").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("ai_reply_rules").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("message_templates").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("workspace_settings").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("app_settings").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("onboarding_state").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("hashtags").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("competitors").select("*").eq("workspace_id", workspaceId).order("added_at", { ascending: false }),
    supabase.from("leads").select("*").eq("workspace_id", workspaceId).order("found_at", { ascending: false }),
    supabase.from("conversations").select("*").eq("workspace_id", workspaceId).order("last_active", { ascending: false }),
    supabase.from("messages").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
    supabase.from("campaigns").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
  ]);

  const base = emptyAppState();
  const workspace = workspaceRes.data;
  const plan = (workspace?.plan || "Trial") as keyof typeof PLAN_LIMITS;
  const leads = leadsRes.data || [];
  const messages = messagesRes.data || [];
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const hashtags = (hashtagsRes.data || []).map(mapHashtag);
  const hashtagsUsed = (hashtagsRes.data || []).filter((h: any) => new Date(h.created_at) > weekAgo).length;
  const leadsToday = leads.filter((l: any) => (l.found_at || "").slice(0, 10) === today).length;
  const dmsSentToday = messages.filter((m: any) => m.sender === "me" && (m.created_at || "").slice(0, 10) === today).length;

  return {
    ...base,
    workspaceId,
    user: {
      id: user.id,
      email: user.email || "",
      role: membership.role as "user" | "admin",
      plan,
      trialEndsAt: workspace?.trial_ends_at || base.user.trialEndsAt,
      limits: PLAN_LIMITS[plan],
      usage: { hashtagsUsed, leadsToday, dmsSentToday },
    },
    setupDismissed: onboardingRes.data?.setup_dismissed ?? false,
    onboarding: onboardingRes.data?.steps?.length ? onboardingRes.data.steps : base.onboarding,
    businessProfile: profileRes.data
      ? { description: profileRes.data.description, targetRegion: profileRes.data.target_region }
      : base.businessProfile,
    hashtags,
    competitors: (competitorsRes.data || []).map(mapCompetitor),
    filters: filtersRes.data?.criteria && Object.keys(filtersRes.data.criteria).length ? filtersRes.data.criteria : base.filters,
    instagramLeads: leads.filter((l: any) => l.platform === "instagram").map(mapInstagramLead),
    mapsLeads: leads.filter((l: any) => l.platform === "maps").map(mapMapsLead),
    linkedinLeads: leads.filter((l: any) => l.platform === "linkedin").map(mapLinkedInLead),
    whatsappLeads: leads.filter((l: any) => l.platform === "whatsapp").map(mapWhatsAppLead),
    xLeads: leads.filter((l: any) => l.platform === "x").map(mapXLead),
    conversations: (conversationsRes.data || []).map((c: any) => mapConversation(c, messages)),
    campaigns: (campaignsRes.data || []).map(mapCampaign),
    aiReplyRules: rulesRes.data
      ? {
          businessDefinition: rulesRes.data.business_definition,
          postReplyInstruction: rulesRes.data.post_reply_instruction,
          stopMessagingCriteria: rulesRes.data.stop_messaging_criteria,
          humanHandoffCriteria: rulesRes.data.human_handoff_criteria,
        }
      : base.aiReplyRules,
    templates: templatesRes.data
      ? {
          hashtagDm: templatesRes.data.hashtag_dm,
          hashtagEmail: templatesRes.data.hashtag_email,
          fromName: templatesRes.data.from_name,
          companyName: templatesRes.data.company_name,
          competitorDm: templatesRes.data.competitor_dm,
        }
      : base.templates,
    integrations: settingsRes.data
      ? {
          instagram: settingsRes.data.instagram || base.integrations.instagram,
          gmail: settingsRes.data.gmail || base.integrations.gmail,
          whatsapp: settingsRes.data.whatsapp || base.integrations.whatsapp,
          x: settingsRes.data.x || base.integrations.x,
          linkedin: settingsRes.data.linkedin || base.integrations.linkedin,
        }
      : base.integrations,
    settings: appSettingsRes.data
      ? {
          darkMode: appSettingsRes.data.dark_mode,
          pushNotifications: appSettingsRes.data.push_notifications,
          dailyLeadsEmail: appSettingsRes.data.daily_leads_email,
          cycleExpirationReminder: appSettingsRes.data.cycle_expiration_reminder,
          automatedLeadGeneration: appSettingsRes.data.automated_lead_generation,
          automatedWeeklyCycle: appSettingsRes.data.automated_weekly_cycle,
        }
      : base.settings,
  };
}
