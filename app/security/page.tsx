import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security Overview" };

export default function SecurityOverviewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <Link href="/" className="text-sm text-primary hover:underline">← Back to AuraLeads.ai</Link>
          <h1 className="text-3xl font-bold mt-4">Security Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: September 27, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            This page describes the real, specific measures in place today — not a generic security-policy
            template. We're a small, independently-run product, not a SOC 2 or ISO 27001 certified organization,
            and we won't claim otherwise.
          </p>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Credentials and connected accounts</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>LinkedIn/Instagram session cookies and Gmail App Passwords are encrypted at rest with AES-256-GCM
                before they're stored — never saved in plain text.</li>
              <li>OAuth connections (Instagram, WhatsApp, X) use official provider OAuth flows; the X connection
                specifically uses OAuth 2.0 with PKCE. We never see or store your actual platform password for
                those.</li>
              <li>Provider API keys and our database service-role credentials are held as server-side environment
                variables and are never sent to your browser.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Data isolation between customers</h2>
            <p>
              Every workspace's data — leads, messages, templates, settings — is enforced at the database level
              with Postgres Row Level Security, scoped to your own workspace membership. This means a bug in our
              application code isn't the only thing standing between your data and another customer's; the database
              itself refuses cross-workspace reads and writes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Payments</h2>
            <p>
              Card, UPI, and PayPal details are handled entirely by PayPal and Razorpay directly — we never see or
              store your payment credentials. Which plan gets granted after checkout is decided from what our
              server recorded at the moment you started the checkout, verified against a cryptographic signature
              from the payment provider, never from anything the browser sends us afterward.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Webhooks</h2>
            <p>
              Inbound webhooks (Instagram, WhatsApp, Razorpay) verify a cryptographic signature from the sender
              using a timing-safe comparison before any payload is processed — an unsigned or incorrectly-signed
              request is rejected outright.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Infrastructure</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hosted on Vercel with HTTPS/TLS enforced everywhere (HSTS enabled).</li>
              <li>Standard security headers are set on every response: Content-Security-Policy,
                X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and frame-ancestors protection against
                clickjacking.</li>
              <li>Rate limiting is applied to AI-generation and other cost-sensitive endpoints to limit abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">What we can't promise yet</h2>
            <p>
              We don't currently have a formal third-party security audit, a bug bounty program, or a compliance
              certification. If you find a real security issue, we want to know before anyone else does.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Report a security issue</h2>
            <p>
              Email contact@auraleads.online with details. Please don't test against other customers' accounts or
              data — use your own account when investigating something.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
