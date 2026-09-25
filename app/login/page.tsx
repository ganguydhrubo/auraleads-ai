"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// This page needs a live user session/auth client at request time, so it
// can't be statically prerendered at build time (which would require real
// Supabase env vars just to produce a build).
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setForgotSent(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!membership) {
        await supabase.rpc("bootstrap_workspace", {
          p_user_id: data.user.id,
          p_workspace_name: data.user.email?.split("@")[0] || "My Workspace",
        });
      }
    }

    router.refresh();
    router.push("/app");
  };

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
          Sign in to your multi-tenant workspace
        </h2>
        <p className="text-xs text-muted-foreground">
          Or{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            start a free 7-day trial
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

          {mode === "forgot" ? (
            forgotSent ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-foreground font-semibold">Check your inbox</p>
                <p className="text-xs text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, a password reset link is on its way.
                </p>
                <button
                  onClick={() => {
                    setMode("login");
                    setForgotSent(false);
                  }}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form className="space-y-4 text-xs" onSubmit={handleForgotPassword}>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Work Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="founder@company.com"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>{loading ? "Sending reset link..." : "Send Password Reset Email"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </button>
              </form>
            )
          ) : (
            <form className="space-y-4 text-xs" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                    }}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
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
                <span>{loading ? "Authenticating Workspace..." : "Sign In to Pipeline"}</span>
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-border/80 flex items-center text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Multi-Tenant Role Isolation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
