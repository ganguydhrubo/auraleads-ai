import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CAN-SPAM & GDPR" };

export default function CanSpamGdprPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <Link href="/" className="text-sm text-primary hover:underline">← Back to AuraLeads.ai</Link>
          <h1 className="text-3xl font-bold mt-4">CAN-SPAM &amp; GDPR</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: September 27, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            AuraLeads AI is a tool you use to send outreach (Instagram DMs, WhatsApp messages, and cold emails) to
            leads you've discovered or connected. Under CAN-SPAM, GDPR, and India's DPDP Act 2023, <strong>you are
            the data controller / sender of record</strong> for that outreach, not AuraLeads AI — the same way a
            mail-merge tool doesn't become the sender of the letters it formats. This page explains what that means
            in practice and what AuraLeads AI does and doesn't automate for you.
          </p>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">What you're responsible for</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Truthful sender identification in every message you send.</li>
              <li>Honoring opt-out/unsubscribe requests you receive, promptly.</li>
              <li>Having a lawful basis to contact each lead (e.g. legitimate interest for B2B outreach under GDPR,
                or your jurisdiction's equivalent).</li>
              <li>Not using AuraLeads AI to contact anyone who has already asked you to stop.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">What AuraLeads AI does and doesn't automate</h2>
            <p>
              Being direct about this rather than implying more than is built: AuraLeads AI does not currently
              inject an automatic unsubscribe link or manage a suppression list across every channel for you.
              Gmail sends go through your own connected account via standard SMTP, so any unsubscribe handling is
              whatever you build into your own message templates. WhatsApp template messages sent through the
              official Meta Cloud API follow Meta's own opt-out/quality-rating enforcement on top of your legal
              obligations. If you need automated list-suppression across every channel, that isn't built yet —
              track requests yourself until it is.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">EU/UK data subject rights (GDPR)</h2>
            <p>
              If you are an individual in the EU/UK whose data AuraLeads AI holds (as an account holder, or because
              a customer of ours added you as a lead), you can request access, correction, deletion, or export of
              that data by emailing contact@auraleads.online. We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">India's DPDP Act 2023</h2>
            <p>
              As a business operating from India, we process personal data as a Data Fiduciary under the DPDP Act
              for our own account holders, and our customers act as Data Fiduciaries for the lead data they collect
              and message through the product. Data principal rights requests (access, correction, erasure) can be
              sent to contact@auraleads.online.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Contact</h2>
            <p>Questions about compliance on the platform: contact@auraleads.online.</p>
          </section>

          <p className="text-xs text-muted-foreground italic pt-4 border-t border-border">
            This page explains how the product works and where responsibility sits between you and us — it isn't a
            substitute for your own legal advice on compliance obligations in your specific market.
          </p>
        </div>
      </div>
    </div>
  );
}
