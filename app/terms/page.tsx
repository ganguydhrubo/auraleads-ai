import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <Link href="/" className="text-sm text-primary hover:underline">← Back to AuraLeads.ai</Link>
          <h1 className="text-3xl font-bold mt-4">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: [DATE — fill in when this is finalized]</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            These terms govern your use of AuraLeads AI, operated by <strong>[LEGAL ENTITY NAME]</strong>. By using
            the service, you agree to them.
          </p>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Acceptable use</h2>
            <p>
              You are responsible for how you use AuraLeads AI, including compliance with the terms of any
              third-party platform you connect (Meta/Instagram/WhatsApp, X, Google, Gmail). Some AuraLeads AI
              features — specifically LinkedIn and Instagram cold-outreach automation — operate outside those
              platforms' official terms of service and carry a real risk of account restriction. You accept that
              risk by choosing to connect and use those features; AuraLeads AI is not liable for account actions
              taken by third-party platforms as a result.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Your account</h2>
            <p>
              You're responsible for keeping your login credentials secure and for all activity under your
              account. You must be at least 18 years old to use this service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Billing</h2>
            <p>
              Paid plans are billed monthly via PayPal. Fees are non-refundable except where required by law. We
              may change prices with at least 30 days' notice. Your account may be suspended for non-payment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Data you send through the platform</h2>
            <p>
              You are the data controller for any outreach you send through AuraLeads AI (Instagram DMs, WhatsApp
              messages, cold emails). You're responsible for complying with applicable law (e.g. CAN-SPAM, GDPR,
              India's DPDP Act) — including consent requirements, opt-out handling, and truthful sender
              identification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Limitation of liability</h2>
            <p>
              The service is provided "as is". To the maximum extent permitted by law, [LEGAL ENTITY NAME] is not
              liable for indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Governing law</h2>
            <p>These terms are governed by the laws of [YOUR JURISDICTION].</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mt-8 mb-2">Contact</h2>
            <p>Questions about these terms: [SUPPORT EMAIL].</p>
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
