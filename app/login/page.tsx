"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("primary-org");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate multi-tenant authentication & Supabase session
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem(
          "auraleads_user_session",
          JSON.stringify({
            email,
            workspace,
            role: "owner",
            loginTime: new Date().toISOString(),
          })
        );
        router.push("/app");
      } else {
        setError("Please enter both email and password.");
        setLoading(false);
      }
    }, 800);
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

          <form className="space-y-4 text-xs" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Workspace / Organization ID</label>
              <input
                type="text"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                placeholder="primary-org"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
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
                  placeholder="founder@company.com"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-foreground">Password</label>
                <a href="#" className="text-[11px] text-primary hover:underline">
                  Forgot?
                </a>
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

          <div className="pt-2 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Multi-Tenant Role Isolation
            </span>
            <Link href="/app" className="text-primary font-medium hover:underline">
              Bypass to App →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
