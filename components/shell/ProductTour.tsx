"use client";

import React, { useEffect } from "react";
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Hash,
  Compass,
  Users,
  SlidersHorizontal,
  Mail,
  Send,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

const tourSteps = [
  {
    step: 1,
    title: "Welcome to AuraLeads AI!",
    subtitle: "Your complete outbound lead generation operating system.",
    description: "Discover verified prospects across Instagram hashtags, competitor follower networks, and local Maps businesses. Qualify them with AI, craft personalized outreach, and automate inbox replies.",
    icon: Sparkles,
  },
  {
    step: 2,
    title: "Hashtags + Lead Generation",
    subtitle: "High-signal discovery without spam.",
    description: "Hashtags are the primary signal for finding active creators, niche brands, and decision-makers on Instagram. Our AI extracts posters and engagers continuously.",
    icon: Hash,
  },
  {
    step: 3,
    title: "Define Your Business",
    subtitle: "Teach the AI about your ideal customer profile.",
    description: "Enter your agency or SaaS offering in plain English. The AI evaluates your value proposition and suggests relevant high-volume hashtags tailored to your niche.",
    icon: Compass,
  },
  {
    step: 4,
    title: "Target Locations & Geo-Targeting",
    subtitle: "Global scale or hyper-local precision.",
    description: "Filter candidates by country, state, or metropolitan area. You can target specific cities like New York, London, Toronto, or go worldwide.",
    icon: Compass,
  },
  {
    step: 5,
    title: "Hashtag Research Panel",
    subtitle: "AI-powered volume & relevance validation.",
    description: "Review AI-estimated post volume, engagement velocity, and suitability ratings for every suggested hashtag before adding it to your weekly cycle.",
    icon: Hash,
  },
  {
    step: 6,
    title: "Leads from Hashtags",
    subtitle: "Your daily batch of qualified prospects.",
    description: "Review scraped accounts with complete profile data: follower counts, engagement rates, bio links, and business category labels.",
    icon: Hash,
  },
  {
    step: 7,
    title: "Competitor Intelligence",
    subtitle: "Tap into audiences already buying your solution.",
    description: "Identify up to 5 key competitors. AuraLeads AI maps their follower base to uncover pre-qualified prospects actively interested in your market.",
    icon: Users,
  },
  {
    step: 8,
    title: "Manage Competitors",
    subtitle: "Weekly locked tracking cycles.",
    description: "Add competitor Instagram handles. Competitors are locked for 7-day batches to ensure complete follower scraping and relationship graph mapping.",
    icon: Users,
  },
  {
    step: 9,
    title: "Competitor Leads & Filtering",
    subtitle: "Filter the noise from competitor follow lists.",
    description: "Not all followers are buyers. Our Smart Filtering AI discards bots, inactive profiles, and irrelevant consumers, leaving only high-intent leads.",
    icon: SlidersHorizontal,
  },
  {
    step: 10,
    title: "Smart Filtering & ICP Rules",
    subtitle: "Precision controls for lead qualification.",
    description: "Set follower ranges (e.g. 1k to 100k), enforce verified email or phone requirements, and block unwanted categories like crypto, MLM, or adult content.",
    icon: SlidersHorizontal,
  },
  {
    step: 11,
    title: "Negative Keyword Blocklists",
    subtitle: "Protect your brand reputation.",
    description: "Add banned terms that immediately disqualify accounts, ensuring your sales team never wastes outreach tokens on spammers or bot networks.",
    icon: SlidersHorizontal,
  },
  {
    step: 12,
    title: "Message & Email Templates",
    subtitle: "Dynamic prompt criteria over rigid mail-merge.",
    description: "Instead of robotic templates, give the AI prompt instructions (tone, value proposition, soft CTA). The AI writes a distinct, personalized email and DM for every prospect.",
    icon: Mail,
  },
  {
    step: 13,
    title: "Analytics & Funnel Dashboard",
    subtitle: "Total visibility into outreach performance.",
    description: "Monitor sent messages and reply percentages across Instagram DMs and Gmail. Track which hashtags and competitors generate your highest converting leads.",
    icon: BarChart3,
  },
  {
    step: 14,
    title: "Personalize Your Experience",
    subtitle: "Integrations, webhooks, and automation toggles.",
    description: "Connect your Meta messaging credentials and multiple Gmail inboxes. Toggle daily automated cycles and receive ready notifications straight to your phone.",
    icon: HelpCircle,
  },
  {
    step: 15,
    title: "Ready to Get Started!",
    subtitle: "Your pipeline is ready to fill.",
    description: "Start by defining your business in Hashtag Setup or searching a local region in Maps Discovery. Let's start generating revenue!",
    icon: Sparkles,
  },
];

export function ProductTour() {
  const { tourOpen, setTourOpen, activeTourStep, setActiveTourStep } = useApp();

  useEffect(() => {
    if (!tourOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTourOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [tourOpen, setTourOpen]);

  if (!tourOpen) return null;

  const current = tourSteps[activeTourStep - 1] || tourSteps[0];
  const StepIcon = current.icon;
  const isFirst = activeTourStep === 1;
  const isLast = activeTourStep === tourSteps.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Step {activeTourStep} of {tourSteps.length}
            </span>
            <span className="text-xs text-muted-foreground">Website Guide</span>
          </div>
          <button
            onClick={() => setTourOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <StepIcon className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
            <p className="text-xs text-primary font-medium mt-0.5">{current.subtitle}</p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{current.description}</p>
          </div>

          {/* Progress bar */}
          <div className="pt-2">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(activeTourStep / tourSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 px-6 border-t border-border bg-muted/10 flex items-center justify-between">
          <button
            onClick={() => setTourOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTourStep(Math.max(1, activeTourStep - 1))}
              disabled={isFirst}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {isLast ? (
              <button
                onClick={() => setTourOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 flex items-center gap-1 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Finish Tour
              </button>
            ) : (
              <button
                onClick={() => setActiveTourStep(Math.min(tourSteps.length, activeTourStep + 1))}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 flex items-center gap-1 shadow-sm"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
