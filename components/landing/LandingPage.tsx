"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Instagram,
  Mail,
  Zap,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Bot,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Users,
  SlidersHorizontal,
  Flame,
  Globe,
  HelpCircle,
  Play,
  Lock,
  MessageCircle,
  Linkedin,
  Twitter,
} from "lucide-react";
import { landingFaqs } from "@/lib/landing-faqs";
import { Logo, LogoMark } from "@/components/shell/Logo";

function ProductPreview() {
  return (
    <div className="product-preview" aria-label="Illustration of the AuraLeads discovery and qualification workspace">
      <div className="preview-sidebar">
        <LogoMark className="h-8 w-8" />
        <div className="preview-sidebar-line active" /><div className="preview-sidebar-line" />
        <div className="preview-sidebar-line short" /><div className="preview-sidebar-line" />
      </div>
      <div className="preview-main">
        <div className="preview-topbar"><span>Discovery workspace</span><span className="preview-topbar-tag">Workspace preview</span></div>
        <div className="preview-heading"><div><span className="eyebrow">SOURCE / QUALIFY / REACH OUT</span><strong>Find the right people. Then start the conversation.</strong></div><span className="preview-step">01 — 03</span></div>
        <div className="preview-search"><MapPin size={16} /><span>Local businesses in a selected region</span><SlidersHorizontal size={16} /></div>
        <div className="preview-grid">
          <div className="preview-panel"><span className="preview-label">DISCOVERY SOURCES</span><div className="preview-source"><Instagram size={16} /><span>Instagram hashtags</span><CheckCircle2 size={15} /></div><div className="preview-source"><Users size={16} /><span>Competitor audiences</span><CheckCircle2 size={15} /></div><div className="preview-source"><MapPin size={16} /><span>Maps businesses</span><CheckCircle2 size={15} /></div></div>
          <div className="preview-panel preview-flow"><span className="preview-label">QUALIFICATION FLOW</span><div><span className="flow-dot" />Source matched</div><div><span className="flow-dot" />Apply ICP rules</div><div><span className="flow-dot muted-dot" />Review before outreach</div></div>
        </div>
        <div className="preview-bottom"><ShieldCheck size={15} /> Illustrative interface · No live customer data shown</div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [annualBilling, setAnnualBilling] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState<"hashtags" | "competitors" | "maps" | "outreach">("hashtags");
  const [calculatorLeads, setCalculatorLeads] = useState(80);
  const [dealSize, setDealSize] = useState(1500);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const monthlyLeads = calculatorLeads * 30;
  const estimatedMeetings = Math.round(monthlyLeads * 0.05);
  const projectedRevenue = estimatedMeetings * Math.round(dealSize * 0.25);
  const hoursSaved = Math.round((monthlyLeads * 8) / 60);

  const faqs = landingFaqs;

  return (
    <div className="landing-page min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-white">
      {/* Top Banner */}
      <div className="landing-banner bg-primary text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>7-day free trial · No credit card required</span>
        <Link href="/signup" className="underline hover:text-white/80 ml-2 font-bold">
          Get Started →
        </Link>
      </div>

      {/* Sticky Header */}
      <header className="landing-header sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Logo className="shrink-0" />

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
          <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          <a href="#channels" className="hover:text-foreground transition-colors">Channels</a>
          <a href="#calculator" className="hover:text-foreground transition-colors">ROI Calculator</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="hidden sm:inline-block text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/app"
            className="px-3 sm:px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="status-pulse" /> ONE WORKSPACE FOR OUTBOUND</div>
          <h1>Find your next customers <span>where they already are.</span></h1>
          <p>Source prospects from Instagram hashtags, competitor audiences, and local business listings. Apply your ICP rules, review the fit, and move into personalized outreach.</p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2"
          >
            <span>Start 7-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-primary fill-primary/20" />
            <span>Explore Interactive Demo</span>
          </a>
        </div>

        <div className="hero-proof flex items-center gap-6 pt-4 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 7-day trial</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> No card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> ICP controls</span>
        </div>
        </div>
        <ProductPreview />
      </section>

      {/* Supported Channels Bar */}
      <section id="channels" className="py-8 bg-muted/30 border-y border-border px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">Supported Channels:</span>
          <div className="flex flex-wrap items-center gap-3 font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-card border border-border flex items-center gap-1.5 text-foreground shadow-2xs">
              <Instagram className="w-3.5 h-3.5 text-rose-500" /> Instagram (Hashtags, Followers & DMs)
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-card border border-border flex items-center gap-1.5 text-foreground shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Maps (Places & Executives)
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-card border border-border flex items-center gap-1.5 text-foreground shadow-2xs">
              <Mail className="w-3.5 h-3.5 text-primary" /> Gmail (Multi-Inbox Cold Email)
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-card border border-border flex items-center gap-1.5 text-foreground shadow-2xs">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp (Business Cloud API)
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-card border border-border flex items-center gap-1.5 text-foreground shadow-2xs">
              <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn (Connections & DMs)
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-card border border-border flex items-center gap-1.5 text-foreground shadow-2xs">
              <Twitter className="w-3.5 h-3.5 text-sky-500" /> X (Twitter DMs)
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="landing-section py-20 px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Interactive Demo</span>
          <h2 className="text-3xl font-extrabold text-foreground">Experience the 4-Stage Lead Pipeline</h2>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Explore an illustrative view of how sourcing, qualification, and outreach fit together. Examples are not live prospect data.
          </p>
        </div>

        {/* Demo Tabs */}
        <div className="demo-tabs grid grid-cols-2 lg:grid-cols-4 border-b border-border text-xs font-semibold gap-1 sm:gap-3">
          {[
            { id: "hashtags", label: "1. Hashtag Engine", icon: Sparkles },
            { id: "competitors", label: "2. Competitor Audience", icon: Users },
            { id: "maps", label: "3. Maps Polygon Radar", icon: MapPin },
            { id: "outreach", label: "4. Multi-Channel Inbox", icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDemoTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDemoTab(tab.id as any)}
                aria-pressed={isActive}
                className={`min-h-11 py-3 px-2 sm:px-3 transition-colors border-b-2 flex items-center justify-center gap-1.5 text-center ${
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Demo Display Card */}
        <div className="demo-card bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {activeDemoTab === "hashtags" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-xs font-bold text-primary uppercase">Natural Language Sourcing</span>
                <h3 className="text-xl font-bold text-foreground">Turn Plain English into Verified Leads</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your business definition and target geography. Our Groq AI analyzes niche volume and relevance, proposing high-intent Instagram discovery hashtags.
                </p>
                <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs font-mono text-muted-foreground">
                  "B2B outbound sales acceleration agency targeting SaaS founders in United States & Europe"
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground block">Example discovery themes</span>
                {[
                  { tag: "#saasgrowth", volume: "SaaS operators" },
                  { tag: "#b2bmarketing", volume: "B2B teams" },
                  { tag: "#agencyfounders", volume: "Agency owners" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-background flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-primary font-mono">{item.tag}</span>
                    <span className="text-muted-foreground">{item.volume}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeDemoTab === "competitors" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-xs font-bold text-orange-600 uppercase">Audience Ingestion</span>
                <h3 className="text-xl font-bold text-foreground">Tap Audiences Already Buying</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add competitor handles and review relevant audiences using your qualification rules before starting outreach.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Competitor audience A</span>
                    <span className="text-[11px] text-muted-foreground block">Example source</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    Ready for review
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Competitor audience B</span>
                    <span className="text-[11px] text-muted-foreground block">Example source</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    Ready for review
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeDemoTab === "maps" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-600 uppercase">Polygonal Geocoding</span>
                <h3 className="text-xl font-bold text-foreground">Hyper-Local B2B Business Scraping</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Search a region and business category, inspect listings on a map, and review public contact details where available.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border gap-3">
                  <span className="font-bold text-foreground">Example local business listing</span>
                  <span className="text-emerald-600 font-bold">Public source</span>
                </div>
                <div className="space-y-1 text-muted-foreground text-[11px]">
                  <p>Business category · Selected region</p>
                  <p>Website and contact fields when published</p>
                </div>
              </div>
            </div>
          )}

          {activeDemoTab === "outreach" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-xs font-bold text-primary uppercase">Autonomous Outreach</span>
                <h3 className="text-xl font-bold text-foreground">AI Personalized DMs & Auto-Replies</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Never send generic mail-merge blasts. AuraLeads drafts individual messages based on the prospect's real bio and answers incoming replies automatically with built-in human handoff alerts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <Bot className="w-3.5 h-3.5" /> Example message draft
                </div>
                <p className="text-foreground leading-relaxed">
                  "Hi Alex — your recent post about agency growth caught my eye. We help teams spend less time on prospect research. Open to a short conversation?"
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section id="workflow" className="landing-section py-16 bg-muted/20 border-t border-border px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">The Core Loop</span>
            <h2 className="text-3xl font-extrabold text-foreground">Discover · Qualify · Outreach · Measure</h2>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Bring discovery, qualification, and outreach into a single, reviewable workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">1. Lead Discovery Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Discover prospects through niche hashtags, competitor audiences, and local business listings.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">2. Neural ICP Qualification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Strict follower brackets, content theme alignment, contact requirements, and negative keyword blocklists filter spam before outreach.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">3. Unified Multi-Channel Outreach</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Personalized Instagram DMs and Gmail sequences dispatched with human typing delays, 200/hr safety caps, and AI conversational auto-replies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences Grid */}
      <section className="landing-section py-16 px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Built For Closers</span>
          <h2 className="text-3xl font-extrabold text-foreground">Designed for the Teams That Win Deals</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <h4 className="text-sm font-bold text-foreground">Lead-Gen & Marketing Agencies</h4>
            <p className="text-muted-foreground leading-relaxed">
              Set client-specific ICP rules and find relevant businesses and creators across Maps and Instagram.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <h4 className="text-sm font-bold text-foreground">Ecommerce & DTC Brands</h4>
            <p className="text-muted-foreground leading-relaxed">
              Explore relevant lifestyle hashtags and competitor audiences to identify potential creators and partners.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <h4 className="text-sm font-bold text-foreground">B2B SaaS Founders</h4>
            <p className="text-muted-foreground leading-relaxed">
              Find founders and operators who fit your target market, then draft more relevant first messages.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <h4 className="text-sm font-bold text-foreground">Local Commercial Services</h4>
            <p className="text-muted-foreground leading-relaxed">
              Win high-ticket local contracts (roofing, HVAC, legal, dental) by sourcing real commercial listings from OpenStreetMap, with contact details enriched from each business's own public website where available.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="calculator" className="landing-section py-16 bg-muted/20 border-y border-border px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">ROI Calculator</span>
            <h2 className="text-3xl font-extrabold text-foreground">Calculate Your Projected Pipeline Value</h2>
            <p className="text-xs text-muted-foreground">
              Model your own assumptions. Estimates are illustrative and are not a forecast of actual results.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Daily Leads Target:</span>
                  <span className="text-primary font-bold font-mono">{calculatorLeads} leads/day</span>
                </div>
                <input
                  type="range"
                  aria-label="Daily leads target"
                  min="20"
                  max="200"
                  step="10"
                  value={calculatorLeads}
                  onChange={(e) => setCalculatorLeads(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Average Deal Value ($):</span>
                  <span className="text-emerald-600 font-bold font-mono">${dealSize.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  aria-label="Average deal value"
                  min="500"
                  max="5000"
                  step="250"
                  value={dealSize}
                  onChange={(e) => setDealSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-muted/40 border border-border space-y-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Monthly Qualified Leads:</span>
                <span className="font-bold text-foreground font-mono">{monthlyLeads.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Est. Inbound Sales Meetings:</span>
                <span className="font-bold text-foreground font-mono">{estimatedMeetings} booked calls</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Manual SDR Hours Saved:</span>
                <span className="font-bold text-emerald-600 font-mono">{hoursSaved} hrs/mo</span>
              </div>
              <div className="pt-2">
                <span className="text-[11px] text-muted-foreground block uppercase font-bold">Est. Monthly Pipeline Value</span>
                <span className="text-3xl font-extrabold text-primary font-mono">${projectedRevenue.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Illustration assumes 5% of sourced leads book a meeting and 25% of meetings convert. Actual results will vary.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="landing-section py-20 px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Transparent Pricing</span>
          <h2 className="text-3xl font-extrabold text-foreground">Simple Monthly & Annual Plans</h2>
          <p className="text-xs text-muted-foreground">Start free for 7 days. Pay with PayPal or credit card. To cancel or change your plan, contact support.</p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-muted border border-border text-xs font-semibold mt-4">
            <button
              onClick={() => setAnnualBilling(false)}
              aria-pressed={!annualBilling}
              className={`px-4 py-1.5 rounded-lg transition-colors ${!annualBilling ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              aria-pressed={annualBilling}
              className={`px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${annualBilling ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"}`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.2 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Silver */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Silver</h3>
                <p className="text-xs text-muted-foreground mt-1">For solo SDRs and boutique outbound consultants.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground font-mono">
                  {annualBilling ? "$16" : "$20"}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 10 Hashtags per week</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 40 Qualified leads / day</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 200 DMs per hour pacing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI hashtag validation</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-2.5 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted text-center block"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Gold */}
          <div className="p-6 rounded-2xl border border-primary ring-1 ring-primary bg-card shadow-md space-y-5 flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
              For growing teams
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Gold</h3>
                <p className="text-xs text-muted-foreground mt-1">For scaling agencies, DTC brands, and SaaS teams.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground font-mono">
                  {annualBilling ? "$40" : "$50"}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 20 Hashtags per week</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 80 Qualified leads / day</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Unified DM + Email sequence</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> OpenStreetMap business enrichment</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Priority support</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 text-center block shadow-sm"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Platinum */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Platinum</h3>
                <p className="text-xs text-muted-foreground mt-1">High-volume prospecting machine for growth teams.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground font-mono">
                  {annualBilling ? "$80" : "$100"}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 30 Hashtags per week</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 200 Qualified leads / day</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI Instagram auto-replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Advanced yield analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Dedicated account manager</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full py-2.5 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted text-center block"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="landing-section py-16 bg-muted/20 border-t border-border px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Frequently Asked Questions</span>
            <h2 className="text-3xl font-extrabold text-foreground">Everything You Need to Know</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border border-border rounded-xl bg-card overflow-hidden transition-colors">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 px-5 text-left text-xs font-bold text-foreground flex items-center justify-between hover:bg-muted/30"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 px-5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="landing-final-cta p-10 rounded-3xl bg-primary text-white shadow-2xl space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Make prospecting a repeatable process.</h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto">
            Start your free 7-day trial — no credit card required.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/95 shadow-md transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="border-t border-border py-12 px-6 bg-card text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Logo />
            <p className="text-[11px] leading-relaxed">
              Autonomous AI Instagram and Maps lead generation engine built for growth teams.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-2">Product</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#workflow" className="hover:text-foreground">Discovery Engine</a></li>
              <li><a href="#channels" className="hover:text-foreground">Maps Geocoding</a></li>
              <li><a href="#outreach" className="hover:text-foreground">Multi-Channel DM</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing Plans</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-2">Integrations</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/app" className="hover:text-foreground">Meta Graph API</Link></li>
              <li><Link href="/app" className="hover:text-foreground">OpenStreetMap</Link></li>
              <li><Link href="/app" className="hover:text-foreground">Gmail Multi-Inbox</Link></li>
              <li><Link href="/app" className="hover:text-foreground">Groq AI Inference</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-2">Legal & Privacy</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><a href="#" className="hover:text-foreground">CAN-SPAM & GDPR</a></li>
              <li><a href="#" className="hover:text-foreground">Security Overview</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© 2026 AuraLeads AI Inc. All rights reserved.</span>
          <span>Designed with high-speed Groq AI reasoning engine.</span>
        </div>
      </footer>
    </div>
  );
}
