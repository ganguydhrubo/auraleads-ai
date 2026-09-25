"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  useEffect(() => {
    // The emailed link points at /auth/confirm, a server route that verifies
    // the token via token_hash + verifyOtp and sets the session cookie
    // *before* redirecting here — this works from any device/browser,
    // unlike a client-side PKCE code exchange (which needs the same browser
    // that requested the reset to still have the code verifier stored).
    // So by the time this page loads, a valid session should already exist.
    const linkError = searchParams.get("error");
    if (linkError) {
      setError(linkError === "invalid_link" ? "This link is invalid or has expired." : linkError);
      setChecked(true);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecked(true);
    });
  }, [searchParams]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus("loading");
    const supabase = createSupabaseBrowserClient();
    const { error: resendError } = await supabase.auth.resetPasswordForEmail(resendEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResendStatus(resendError ? "error" : "sent");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/app"), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            AL
          </div>
          <span className="font-extrabold text-foreground text-xl tracking-tight">
            AuraLeads<span className="text-primary">.ai</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Set a new password</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-card py-8 px-6 sm:px-10 border border-border rounded-2xl shadow-xl space-y-6">
          {!checked && !success && (
            <p className="text-xs text-muted-foreground text-center">Checking your link...</p>
          )}

          {checked && !ready && !success && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-600 font-semibold text-center">
                {error || "This link is missing, expired, or already used."}
              </div>

              {resendStatus === "sent" ? (
                <p className="text-center text-muted-foreground">
                  New link sent to <strong>{resendEmail}</strong> — check your inbox.
                </p>
              ) : (
                <form onSubmit={handleResend} className="space-y-3">
                  <p className="text-center text-muted-foreground">Enter your email to get a fresh reset link:</p>
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center"
                  />
                  <button
                    type="submit"
                    disabled={resendStatus === "loading"}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {resendStatus === "loading" ? "Sending..." : "Send Reset Link"}
                  </button>
                  {resendStatus === "error" && (
                    <p className="text-center text-rose-600">Couldn't send — try again in a moment.</p>
                  )}
                </form>
              )}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-2 py-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Password updated — signing you in...</p>
            </div>
          ) : (
            ready && (
              <>
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 font-semibold">
                    {error}
                  </div>
                )}
                <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">New Password</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span>{loading ? "Updating..." : "Update Password"}</span>
                  </button>
                </form>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
