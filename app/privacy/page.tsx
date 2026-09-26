import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <Link href="/" className="text-sm text-primary hover:underline">← Back to AuraLeads.ai</Link>
          <h1 className="text-3xl font-bold mt-4">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: [DATE — fill in when this is finalized]</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            <strong>[LEGAL ENTITY NAME]</strong> ("we", "us", "AuraLeads AI") operates auraleads.online. This policy
            explains what data we collect, why, and how you can control it.
          </p>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Data we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information you provide directly: email address, password (hashed, never stored in plain text).</li>
              <li>Business profile information you enter: business description, target region, hashtags, filter criteria, message templates.</li>
              <li>Third-party credentials you choose to connect: Instagram, WhatsApp, X, and Gmail access tokens — encrypted at rest, used only to operate the features you connect them for.</li>
              <li>Lead data you collect through the product from public sources (Instagram, OpenStreetMap) or your own connected accounts.</li>
              <li>Usage data necessary to operate the service (e.g. which features you use, error logs).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">How we use it</h2>
            <p>
              To provide the core product (lead discovery, AI-assisted messaging, analytics), to maintain account
              security, and to communicate with you about your account. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Third-party connections</h2>
            <p>
              When you connect Instagram, WhatsApp, X, or Gmail, you authorize AuraLeads AI to act on your behalf
              within the scopes you grant. You can revoke access at any time from that platform's own settings
              (e.g. Facebook Business Integrations for Meta products) or by disconnecting it inside AuraLeads AI.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Data retention</h2>
            <p>
              We retain your data while your account is active. You can request deletion of your account and
              associated data by contacting us at [SUPPORT EMAIL].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Children's privacy</h2>
            <p>This service is not directed to individuals under 13, and we do not knowingly collect data from them.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Contact</h2>
            <p>
              Questions about this policy: [SUPPORT EMAIL]. Business address: [BUSINESS ADDRESS]. Jurisdiction: [YOUR
              JURISDICTION].
            </p>
          </section>

          <p className="text-xs text-muted-foreground italic pt-4 border-t border-border">
            This is a functional starting template, not a substitute for legal advice — have it reviewed before
            relying on it, and fill in the bracketed placeholders with your real business details.
          </p>
        </div>
      </div>
    </div>
  );
}
