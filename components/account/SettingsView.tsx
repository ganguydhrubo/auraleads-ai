"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Instagram,
  Mail,
  MessageCircle,
  Twitter,
  Linkedin,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

function StatusPill({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
        connected
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          : "bg-rose-500/10 text-rose-600 border-rose-500/20"
      }`}
    >
      {label || (connected ? "Connected" : "Not Connected")}
    </span>
  );
}

export function SettingsView() {
  const { state, loading, updateSettings, refresh } = useApp();
  const [activeTab, setActiveTab] = useState<"platforms" | "automation" | "preferences">("platforms");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Preferences & Connections</h2>
            <p className="text-xs text-muted-foreground">Connect your own channel accounts — every credential below is verified live, nothing is simulated.</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border text-xs font-semibold gap-6 px-2 overflow-x-auto">
        {(["platforms", "automation", "preferences"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "platforms" ? "Official APIs" : tab === "automation" ? "Browser Automation" : "Preferences"}
          </button>
        ))}
      </div>

      {activeTab === "platforms" && (
        <div className="space-y-6">
          <InstagramGraphCard state={state} loading={loading} refresh={refresh} />
          <WhatsAppCard state={state} loading={loading} refresh={refresh} />
          <XCard state={state} refresh={refresh} />
          <GmailCard state={state} refresh={refresh} />
        </div>
      )}

      {activeTab === "automation" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              LinkedIn has no public API for outreach, and Instagram's official Hashtag Search API doesn't expose post
              authors. Both sections below run a real headless browser against <strong>your own logged-in session</strong>.
              This is outside each platform's supported integration path and can result in account restrictions — keep
              volumes low.
              {state.user.role === "admin" && (
                <> (Runs on a separate worker service you deploy — see <code>/workers/social-worker</code>.)</>
              )}
            </p>
          </div>
          <LinkedInAutomationCard state={state} refresh={refresh} />
          <InstagramAutomationCard state={state} refresh={refresh} />
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Automation Toggles</h3>
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Automated Lead Generation</span>
                <span className="text-muted-foreground text-[11px]">Queue a discovery job automatically each day based on saved criteria.</span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.automatedLeadGeneration}
                onChange={(e) => updateSettings({ automatedLeadGeneration: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Automated Weekly Cycle</span>
                <span className="text-muted-foreground text-[11px]">Trigger a new cycle automatically each week with your configured active hashtags.</span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.automatedWeeklyCycle}
                onChange={(e) => updateSettings({ automatedWeeklyCycle: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>
          </div>
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground">Email & Push Notifications</h3>
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Daily Leads Summary Email</span>
                <span className="text-muted-foreground text-[11px]">Receive an email digest when new leads are discovered.</span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.dailyLeadsEmail}
                onChange={(e) => updateSettings({ dailyLeadsEmail: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <div>
                <span className="font-semibold text-foreground block">Cycle Expiration Reminder</span>
                <span className="text-muted-foreground text-[11px]">Send alert 24 hours before your weekly hashtag cycle expires.</span>
              </div>
              <input
                type="checkbox"
                checked={state.settings.cycleExpirationReminder}
                onChange={(e) => updateSettings({ cycleExpirationReminder: e.target.checked })}
                className="rounded border-border text-primary w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function CardShell({ icon, iconColor, title, desc, connected, children }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className={iconColor}>{icon}</span>
          <div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <StatusPill connected={connected} />
      </div>
      {children}
    </div>
  );
}

function InstagramGraphCard({ state, loading, refresh }: any) {
  const [appId, setAppId] = useState(state.integrations.instagram.appId || "");
  const [appSecret, setAppSecret] = useState(state.integrations.instagram.appSecret || "");
  const [token, setToken] = useState(state.integrations.instagram.token || "");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  useEffect(() => {
    if (!loading) {
      setAppId(state.integrations.instagram.appId || "");
      setAppSecret(state.integrations.instagram.appSecret || "");
      setToken(state.integrations.instagram.token || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    fetch("/api/config/verify-token")
      .then((r) => r.json())
      .then((d) => d.verifyToken && setVerifyToken(d.verifyToken))
      .catch(() => {});
  }, []);

  const verify = async () => {
    setStatus("loading");
    const res = await fetch("/api/channels/instagram/graph-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId, appSecret, token }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage(`Connected — messaging Page for @${data.username || "your IG business account"}.`);
      await refresh();
    } else {
      setStatus("error");
      setMessage(data.error || "Verification failed.");
    }
  };

  const isInstagramLogin = state.integrations.instagram.authMethod === "instagram_login";

  return (
    <CardShell
      icon={<Instagram className="w-5 h-5" />}
      iconColor="text-rose-500"
      title="Instagram Messaging (Official Graph API)"
      desc="For real-time inbound DM webhooks and AI auto-replies within Meta's messaging window."
      connected={state.integrations.instagram.connected}
    >
      {isInstagramLogin ? (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
          Connected as @{state.integrations.instagram.username || "your account"} via Instagram Login.
        </div>
      ) : (
        <a
          href="/api/channels/instagram/oauth/start"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-bold hover:opacity-90 shadow-sm"
        >
          <Instagram className="w-4 h-4" /> Connect with Instagram
        </a>
      )}

      <p className="text-[11px] text-muted-foreground text-center">— or, connect manually with a Page Access Token (older method) —</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-foreground">Meta App ID</label>
          <input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="e.g. 198273910283921" autoComplete="off" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-foreground">Meta App Secret</label>
          <input type="password" autoComplete="new-password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder="••••••••••••••••" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="font-semibold text-foreground">Page Access Token (long-lived)</label>
          <input type="password" autoComplete="new-password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAAG... with instagram_manage_messages scope" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-[11px]" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
        <span className="font-bold text-foreground block">Webhook Configuration (Meta App Dashboard)</span>
        <div className="text-muted-foreground text-[11px]">Callback URL: <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/instagram</span></div>
        <div className="text-muted-foreground text-[11px]">Verify Token: <span className="font-mono">{state.integrations.instagram.verifyToken || verifyToken || "Loading..."}</span></div>
      </div>

      {message && <p className={`text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}

      <div className="flex justify-end">
        <button onClick={verify} disabled={status === "loading" || !appId || !token} className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50 flex items-center gap-2">
          {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Verify & Connect
        </button>
      </div>
    </CardShell>
  );
}

function WhatsAppCard({ state, loading, refresh }: any) {
  const [phoneNumberId, setPhoneNumberId] = useState(state.integrations.whatsapp.phoneNumberId || "");
  const [businessAccountId, setBusinessAccountId] = useState(state.integrations.whatsapp.businessAccountId || "");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading) {
      setPhoneNumberId(state.integrations.whatsapp.phoneNumberId || "");
      setBusinessAccountId(state.integrations.whatsapp.businessAccountId || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const verify = async () => {
    setStatus("loading");
    const res = await fetch("/api/channels/whatsapp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId, businessAccountId, accessToken: token }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage(`Connected — ${data.displayPhone}.`);
      await refresh();
    } else {
      setStatus("error");
      setMessage(data.error || "Verification failed.");
    }
  };

  return (
    <CardShell icon={<MessageCircle className="w-5 h-5" />} iconColor="text-emerald-500" title="WhatsApp Business (Cloud API)" desc="Official Meta WhatsApp Business Platform — template messages + real webhook inbound." connected={state.integrations.whatsapp.connected}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-foreground">Phone Number ID</label>
          <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} autoComplete="off" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        </div>
        <div className="space-y-1">
          <label className="font-semibold text-foreground">Business Account ID</label>
          <input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} autoComplete="off" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="font-semibold text-foreground">Permanent Access Token</label>
          <input type="password" autoComplete="new-password" value={token} onChange={(e) => setToken(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-[11px]" />
        </div>
      </div>
      {message && <p className={`text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}
      <div className="flex justify-end">
        <button onClick={verify} disabled={status === "loading" || !phoneNumberId || !token} className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50 flex items-center gap-2">
          {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Verify & Connect
        </button>
      </div>
    </CardShell>
  );
}

function XCard({ state, refresh }: any) {
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accessSecret, setAccessSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const verify = async () => {
    setStatus("loading");
    const res = await fetch("/api/channels/x/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appKey, appSecret, accessToken, accessSecret }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage(`Connected as @${data.handle}.`);
      await refresh();
    } else {
      setStatus("error");
      setMessage(data.error || "Verification failed.");
    }
  };

  return (
    <CardShell icon={<Twitter className="w-5 h-5" />} iconColor="text-sky-500" title="X (Twitter) API v2" desc="Paste your own app + access tokens from developer.x.com — no OAuth redirect needed since it's your own account." connected={state.integrations.x.connected}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <input value={appKey} onChange={(e) => setAppKey(e.target.value)} placeholder="API Key" autoComplete="off" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        <input type="password" autoComplete="new-password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder="API Secret" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        <input type="password" autoComplete="new-password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Access Token" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        <input type="password" autoComplete="new-password" value={accessSecret} onChange={(e) => setAccessSecret(e.target.value)} placeholder="Access Token Secret" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
      </div>
      {message && <p className={`text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}
      <div className="flex justify-end">
        <button onClick={verify} disabled={status === "loading" || !appKey || !accessToken} className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50 flex items-center gap-2">
          {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Verify & Connect
        </button>
      </div>
    </CardShell>
  );
}

function GmailCard({ state, refresh }: any) {
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/channels/gmail/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, appPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage("SMTP login verified — inbox connected.");
      setEmail("");
      setAppPassword("");
      await refresh();
    } else {
      setStatus("error");
      setMessage(data.error || "Could not log in with these credentials.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <Mail className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-sm font-bold text-foreground">Connected Gmail Accounts</h3>
          <p className="text-xs text-muted-foreground">Each App Password is verified with a real SMTP login before being saved.</p>
        </div>
      </div>
      <div className="space-y-2">
        {state.integrations.gmail.accounts.map((acc: any, idx: number) => (
          <div key={idx} className="p-3 px-4 rounded-lg border border-border bg-card flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">@</div>
              <div>
                <div className="font-semibold text-foreground">{acc.email}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{acc.dailySent} sent today</div>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">Connected</span>
          </div>
        ))}
        {state.integrations.gmail.accounts.length === 0 && <p className="text-xs text-muted-foreground">No Gmail accounts connected yet.</p>}
      </div>
      <form onSubmit={connect} autoComplete="off" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="outreach@agency.com" autoComplete="off" className="text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground" />
        <input type="password" autoComplete="new-password" required value={appPassword} onChange={(e) => setAppPassword(e.target.value)} placeholder="16-character App Password" className="text-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono" />
        <button type="submit" disabled={status === "loading"} className="sm:col-span-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold border border-border hover:bg-muted flex items-center justify-center gap-2 disabled:opacity-50">
          {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Verify & Connect Inbox
        </button>
      </form>
      {message && <p className={`text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}
    </div>
  );
}

function LinkedInAutomationCard({ state, refresh }: any) {
  const [cookie, setCookie] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const connected = state.integrations.linkedin.connected;

  const save = async () => {
    setStatus("loading");
    const res = await fetch("/api/automation/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "linkedin", sessionCookie: cookie, label: "My LinkedIn" }),
    });
    if (res.ok) {
      setStatus("ok");
      setMessage("Session saved and encrypted.");
      setCookie("");
      await refresh();
    } else {
      const data = await res.json();
      setStatus("error");
      setMessage(data.error || "Could not save session.");
    }
  };

  const disconnect = async () => {
    await fetch("/api/automation/session?platform=linkedin", { method: "DELETE" });
    await refresh();
  };

  return (
    <CardShell icon={<Linkedin className="w-5 h-5" />} iconColor="text-blue-600" title="LinkedIn — Browser Automation" desc="Paste your li_at session cookie (Application → Cookies → linkedin.com → li_at in devtools)." connected={connected}>
      {connected ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Connected as: {state.integrations.linkedin.accountLabel}</span>
          <button onClick={disconnect} className="px-3 py-1.5 rounded-lg border border-border text-rose-600 hover:bg-rose-500/10 font-semibold">Disconnect</button>
        </div>
      ) : (
        <>
          <input type="password" autoComplete="new-password" value={cookie} onChange={(e) => setCookie(e.target.value)} placeholder="li_at cookie value" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-[11px]" />
          {message && <p className={`text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={status === "loading" || !cookie} className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50 flex items-center gap-2">
              {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Session
            </button>
          </div>
        </>
      )}
    </CardShell>
  );
}

function InstagramAutomationCard({ state, refresh }: any) {
  const [cookie, setCookie] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const connected = state.integrations.instagram.sessionConnected;

  const save = async () => {
    setStatus("loading");
    const res = await fetch("/api/automation/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "instagram", sessionCookie: cookie, label: "My Instagram" }),
    });
    if (res.ok) {
      setStatus("ok");
      setMessage("Session saved and encrypted.");
      setCookie("");
      await refresh();
    } else {
      const data = await res.json();
      setStatus("error");
      setMessage(data.error || "Could not save session.");
    }
  };

  const disconnect = async () => {
    await fetch("/api/automation/session?platform=instagram", { method: "DELETE" });
    await refresh();
  };

  return (
    <CardShell icon={<Instagram className="w-5 h-5" />} iconColor="text-rose-500" title="Instagram — Browser Automation" desc="Paste your sessionid cookie (Application → Cookies → instagram.com → sessionid in devtools)." connected={connected}>
      {connected ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Connected as: {state.integrations.instagram.sessionLabel}</span>
          <button onClick={disconnect} className="px-3 py-1.5 rounded-lg border border-border text-rose-600 hover:bg-rose-500/10 font-semibold">Disconnect</button>
        </div>
      ) : (
        <>
          <input type="password" autoComplete="new-password" value={cookie} onChange={(e) => setCookie(e.target.value)} placeholder="sessionid cookie value" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-[11px]" />
          {message && <p className={`text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={status === "loading" || !cookie} className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50 flex items-center gap-2">
              {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Session
            </button>
          </div>
        </>
      )}
    </CardShell>
  );
}
