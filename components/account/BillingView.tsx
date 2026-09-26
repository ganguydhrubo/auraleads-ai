"use client";

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

export function BillingView() {
  const { state, setChatOpen, refresh } = useApp();
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<"Silver" | "Gold" | "Platinum" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      name: "Silver" as const,
      price: "$20",
      period: "/month",
      desc: "Ideal for solo SDRs and boutique lead-gen consultants.",
      hashtagsWeek: 10,
      leadsDay: 40,
      dmsHour: 200,
      features: [
        "10 Hashtags per weekly cycle",
        "40 Qualified leads per day",
        "200 DMs per hour pacing limit",
        "Instagram account integration",
        "AI-powered hashtag validation",
        "AI personalized emails & DMs",
      ],
      popular: false,
    },
    {
      name: "Gold" as const,
      price: "$50",
      period: "/month",
      desc: "Our most popular tier for fast-growing agencies & DTC brands.",
      hashtagsWeek: 20,
      leadsDay: 80,
      dmsHour: 200,
      features: [
        "20 Hashtags per weekly cycle",
        "80 Qualified leads per day",
        "200 DMs per hour pacing limit",
        "Unified DM + Email sequences",
        "Real business contact enrichment",
        "Priority support access",
      ],
      popular: true,
    },
    {
      name: "Platinum" as const,
      price: "$100",
      period: "/month",
      desc: "High-volume prospecting machine for growth marketing teams.",
      hashtagsWeek: 30,
      leadsDay: 200,
      dmsHour: 200,
      features: [
        "30 Hashtags per weekly cycle",
        "200 Qualified leads per day",
        "200 DMs per hour pacing limit",
        "AI Instagram Auto-Replies engine",
        "Advanced yield analytics",
        "Dedicated account specialist",
      ],
      popular: false,
    },
  ];

  const [checkoutError, setCheckoutError] = useState("");

  const handlePaypalCheckout = async () => {
    if (!selectedPlanForModal) return;
    setIsProcessing(true);
    setCheckoutError("");

    try {
      const createRes = await fetch("/api/billing/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlanForModal }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Could not create PayPal order.");

      if (createData.approveUrl) {
        // Real PayPal Checkout — hand off to PayPal's own hosted page.
        window.location.href = createData.approveUrl;
        return;
      }
    } catch (err: any) {
      setIsProcessing(false);
      setCheckoutError(err.message);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleRazorpayCheckout = async () => {
    if (!selectedPlanForModal) return;
    setIsProcessing(true);
    setCheckoutError("");

    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Could not load Razorpay Checkout — check your connection and try again.");

      const createRes = await fetch("/api/billing/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlanForModal }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Could not create Razorpay order.");

      const razorpay = new (window as any).Razorpay({
        key: createData.keyId,
        order_id: createData.orderId,
        amount: createData.amountPaise,
        currency: "INR",
        name: "AuraLeads AI",
        description: `${selectedPlanForModal} plan — monthly`,
        prefill: { email: state.user.email },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/billing/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan: selectedPlanForModal,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Could not verify payment.");
            await refresh();
            setSelectedPlanForModal(null);
          } catch (err: any) {
            setCheckoutError(err.message);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
        theme: { color: "#4f46e5" },
      });

      razorpay.open();
    } catch (err: any) {
      setIsProcessing(false);
      setCheckoutError(err.message);
    }
  };

  const trialDaysRemaining = Math.max(0, Math.ceil((new Date(state.user.trialEndsAt).getTime() - Date.now()) / 86400000));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Current Plan Overview Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              {state.user.plan} Active
            </span>
            {state.user.plan === "Trial" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {trialDaysRemaining > 0 ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} remaining` : "Trial expired"}
                {" "}(ends {new Date(state.user.trialEndsAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })})
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-foreground">Current Plan Quotas</h2>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span>Hashtags: <strong className="text-foreground">{state.user.limits.hashtagsWeek}/week</strong></span>
            <span>·</span>
            <span>Daily Leads: <strong className="text-foreground">{state.user.limits.leadsDay}/day</strong></span>
            <span>·</span>
            <span>DM Dispatch: <strong className="text-foreground">{state.user.limits.dmsHour}/hr</strong></span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs space-y-2 max-w-sm">
          <span className="font-bold text-foreground block">Want a plan for free?</span>
          <p className="text-[11px] text-muted-foreground">
            Apply through early access support to get your Silver, Gold, or Platinum plan sponsored in exchange for workflow feedback.
          </p>
          <div className="flex gap-2 pt-1">
            {(["Silver", "Gold", "Platinum"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setChatOpen(true)}
                className="px-2.5 py-1 rounded bg-card border border-border text-foreground hover:bg-muted font-medium text-[11px]"
              >
                Request {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {plans.map((p) => {
          const isCurrent = state.user.plan === p.name;
          return (
            <div
              key={p.name}
              className={`rounded-2xl border p-6 flex flex-col justify-between relative bg-card shadow-sm transition-all hover:shadow-md ${
                p.popular ? "border-primary ring-1 ring-primary" : "border-border"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{p.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground font-mono">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.period}</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Included Features
                  </span>
                  <ul className="space-y-2 text-xs">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setSelectedPlanForModal(p.name)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : p.popular
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-muted border border-border"
                  }`}
                >
                  {isCurrent ? "Current Active Tier" : `Upgrade to ${p.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-on Card: Comments Scraping */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-foreground">Comments Scraping Add-on</h3>
            <span className="text-[10px] bg-purple-500/10 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
              Power Add-on
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Extract up to 10,000 Instagram comments per daily round across 30 hashtags. Perfect for harvesting hyper-engaged micro-influencer and buyer profiles.
          </p>
        </div>

        <button
          onClick={() => setChatOpen(true)}
          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground whitespace-nowrap"
        >
          Contact Support to Enable
        </button>
      </div>

      {/* Payment Security Notice */}
      <div className="p-4 bg-muted/20 border border-border rounded-xl flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Payments are processed securely via PayPal or major credit/debit cards. To cancel or change your plan, contact support.</span>
        </div>
        <span className="font-mono text-[11px]">256-bit TLS Encrypted</span>
      </div>

      {/* Checkout Modal — real PayPal hosted checkout, or real Razorpay Checkout (Cards/UPI/Netbanking/Wallets) */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Checkout</h3>
              </div>
              <button
                onClick={() => setSelectedPlanForModal(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-foreground">
                <span>AuraLeads AI {selectedPlanForModal} Subscription</span>
                <span>
                  {selectedPlanForModal === "Silver" ? "$20.00" : selectedPlanForModal === "Gold" ? "$50.00" : "$100.00"}/mo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Quota upgrades instantly on payment. To cancel or change your plan, contact support.
              </p>
            </div>

            {checkoutError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-600 font-semibold">
                {checkoutError}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handlePaypalCheckout}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#0070BA] text-white text-xs font-bold hover:bg-[#005ea6] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                <span>{isProcessing ? "Redirecting to PayPal..." : "Pay with PayPal or Card"}</span>
              </button>

              <button
                onClick={handleRazorpayCheckout}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#3395FF] text-white text-xs font-bold hover:bg-[#1a7fe0] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                <span>
                  {isProcessing
                    ? "Opening Razorpay..."
                    : `Pay with UPI / Card / Wallet (₹${selectedPlanForModal === "Silver" ? "1,499" : selectedPlanForModal === "Gold" ? "3,999" : "7,999"})`}
                </span>
              </button>
              <p className="text-[10px] text-muted-foreground text-center">Razorpay checkout is in Test Mode — no real charge yet.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
