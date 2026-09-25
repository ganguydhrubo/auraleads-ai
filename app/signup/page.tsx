"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, Building, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is required by the Supabase project settings.
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.rpc("bootstrap_workspace", {
        p_user_id: data.user.id,
        p_workspace_name: company,
      });
    }

    router.refresh();
    router.push("/app");
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <h2 className="text-xl font-bold text-foreground">Check your inbox</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
        </p>
        <Link href="/login" className="text-primary font-semibold text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-primary selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            AL
          </div>
          <span className="font-extrabold text-foreground text-xl tracking-tight">
            AuraLeads<span className="text-primary">.ai</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Create your 7-day free trial workspace
        </h2>
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-card py-8 px-6 sm:px-10 border border-border rounded-2xl shadow-xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-4 text-xs" onSubmit={handleSignup}>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Company / Agency Name</label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Apex Growth Partners"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Work Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@apexgrowth.com"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Choose a Strong Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Provisioning Workspace..." : "Start 7-Day Free Trial"}</span>
            </button>
          </form>

          <div className="pt-2 border-t border-border/80 text-[11px] text-muted-foreground space-y-1.5">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 10 Free Hashtags & 70 Qualified Leads
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No credit card required upfront
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
