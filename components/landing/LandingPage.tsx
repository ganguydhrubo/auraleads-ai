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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-white">
      {/* Top Banner */}
      <div className="bg-[#3B50F5] text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>7-day free trial · No credit card required</span>
        <Link href="/signup" className="underline hover:text-white/80 ml-2 font-bold">
          Get Started →
        </Link>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-card/85 backdrop-blur-md border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
            AL
          </div>
          <div>
            <span className="font-extrabold text-foreground text-base tracking-tight flex items-center gap-1.5">
              AuraLeads<span className="text-primary font-black">.ai</span>
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
          <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          <a href="#channels" className="hover:text-foreground transition-colors">Channels</a>
          <a href="#calculator" className="hover:text-foreground transition-colors">ROI Calculator</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/app"
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Outbound Pipeline · Powered by Groq Ultra-Fast AI</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Autonomous <span className="text-primary">Instagram & Google Maps</span> Lead Generation for Growth Teams
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Source verified decision-makers from active hashtags, competitor followers, and local Google Maps businesses.
          Qualify with multi-criteria AI filters and scale personalized DM and cold email sequences from one workflow.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
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

        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant 400ms Groq AI scoring</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
        </div>
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
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Google Maps (Places & Executives)
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
      <section id="demo" className="py-20 px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Interactive Demo</span>
          <h2 className="text-3xl font-extrabold text-foreground">Experience the 4-Stage Lead Pipeline</h2>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Click through our core modules to see how candidate profiles are sourced, qualified, and contacted in real time.
          </p>
        </div>

        {/* Demo Tabs */}
        <div className="flex justify-center border-b border-border text-xs font-semibold gap-2 sm:gap-6 overflow-x-auto">
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
                className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
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
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
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
                <span className="text-xs font-semibold text-foreground block">AI Validated Hashtags</span>
                {[
                  { tag: "#saasgrowth", volume: "1.2M posts", score: 96 },
                  { tag: "#b2bmarketing", volume: "850k posts", score: 94 },
                  { tag: "#agencyfounders", volume: "320k posts", score: 91 },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-background flex items-center justify-between text-xs">
                    <span className="font-bold text-primary font-mono">{item.tag}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{item.volume}</span>
                      <span className="text-emerald-600 font-bold">{item.score}% Match</span>
                    </div>
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
                  Track up to 5 competitor handles per weekly cycle. Our background workers ingest their active followers and filter out bots, leaving only high-intent buyers.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">@growthfunder</span>
                    <span className="text-[11px] text-muted-foreground block">48.2k active followers</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    Ingested & Filtered
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">@hyperlead_ai</span>
                    <span className="text-[11px] text-muted-foreground block">32.1k active followers</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    Ingested & Filtered
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
                  Search any metropolitan region, city, or suburb worldwide. Preview boundary outlines on Leaflet maps and reveal decision-makers with direct phone and email.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="font-bold text-foreground">Apex Digital Marketing Agency</span>
                  <span className="text-emerald-600 font-bold">4.9 ★ (114 reviews)</span>
                </div>
                <div className="space-y-1 text-muted-foreground text-[11px]">
                  <p>📍 350 5th Ave, New York, NY 10118</p>
                  <p>📞 +1 (212) 555-0192 · ✉️ contact@apexdigitalny.com</p>
                  <p>👤 <strong>David Miller</strong> — Managing Partner</p>
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
                  <Bot className="w-3.5 h-3.5" /> AI Generated Instagram DM
                </div>
                <p className="text-foreground leading-relaxed">
                  "Hey Alex! Loved your recent breakdown on agency scaling bottlenecks. We built an outbound system specifically for 7-figure teams to automate lead research. Worth a 2-min look?"
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section id="workflow" className="py-16 bg-muted/20 border-t border-border px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">The Core Loop</span>
            <h2 className="text-3xl font-extrabold text-foreground">Discover · Qualify · Outreach · Measure</h2>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Everything your revenue team needs to build predictable outbound pipeline without paying for expensive database subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">1. Lead Discovery Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Continuous background collection from niche hashtags, competitor followers, and Google Maps listings across any global or local market.
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
      <section className="py-16 px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Built For Closers</span>
          <h2 className="text-3xl font-extrabold text-foreground">Designed for the Teams That Win Deals</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <h4 className="text-sm font-bold text-foreground">Lead-Gen & Marketing Agencies</h4>
            <p className="text-muted-foreground leading-relaxed">
              Fill client sales funnels effortlessly. Enforce custom ICP rules for each client and source local B2B leads from Google Maps plus Instagram creators.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <h4 className="text-sm font-bold text-foreground">Ecommerce & DTC Brands</h4>
            <p className="text-muted-foreground leading-relaxed">
              Find micro-influencers and affiliate partners at scale by monitoring relevant lifestyle hashtags and competitor followers with verified engagement.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <h4 className="text-sm font-bold text-foreground">B2B SaaS Founders</h4>
            <p className="text-muted-foreground leading-relaxed">
              Accelerate early customer discovery and customer interviews by engaging startup founders and tech leaders with AI-personalized outreach.
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
      <section id="calculator" className="py-16 bg-muted/20 border-y border-border px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">ROI Calculator</span>
            <h2 className="text-3xl font-extrabold text-foreground">Calculate Your Projected Pipeline Value</h2>
            <p className="text-xs text-muted-foreground">
              See the direct financial impact of replacing manual prospecting with autonomous AI lead generation.
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
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-20 px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Transparent Pricing</span>
          <h2 className="text-3xl font-extrabold text-foreground">Simple Monthly & Annual Plans</h2>
          <p className="text-xs text-muted-foreground">Start free for 7 days. Pay with PayPal or credit card. Cancel anytime.</p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-muted border border-border text-xs font-semibold mt-4">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-1.5 rounded-lg transition-colors ${!annualBilling ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
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
              Most Popular
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
      <section id="faq" className="py-16 bg-muted/20 border-t border-border px-6">
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
        <div className="p-10 rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-primary text-white shadow-2xl space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ready to Fill Your Pipeline on Autopilot?</h2>
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
            <span className="font-bold text-foreground text-sm">AuraLeads.ai</span>
            <p className="text-[11px] leading-relaxed">
              Autonomous AI Instagram and Google Maps lead generation engine built for growth teams.
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
