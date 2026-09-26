import { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { landingFaqs } from "@/lib/landing-faqs";

const SITE_URL = "https://auraleads.online";

export const metadata: Metadata = {
  title: "AuraLeads AI — Instagram, Google Maps & WhatsApp Lead Generation",
  description:
    "B2B lead generation software for agencies, DTC brands, and SaaS founders. Source real prospects from Instagram, Google Maps/OpenStreetMap, and WhatsApp, qualify with Groq AI, and manage outreach from one workflow.",
  keywords: [
    "AI lead generation",
    "Instagram lead generation",
    "Google Maps business discovery",
    "WhatsApp Business API",
    "B2B cold outreach",
    "Groq AI",
    "local business lead finder",
    "agency sales pipeline",
  ],
  authors: [{ name: "AuraLeads AI" }],
  creator: "AuraLeads AI",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "AuraLeads AI — Instagram, Google Maps & WhatsApp Lead Generation",
    description:
      "Find real prospects on Instagram and Google Maps, qualify with Groq AI, and scale personalized DM, email, and WhatsApp outreach.",
    siteName: "AuraLeads AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuraLeads AI — Instagram, Google Maps & WhatsApp Lead Generation",
    description: "Real Instagram, Google Maps, and WhatsApp lead generation with Groq AI qualification.",
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "AuraLeads AI",
        url: SITE_URL,
        // No logo/sameAs listed here — we don't have a dedicated square logo
        // asset or real, active social profiles to point to yet. Add them
        // once they exist rather than inventing placeholders.
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "AuraLeads AI",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "AuraLeads AI",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: [
          { "@type": "Offer", name: "Silver", price: "20.00", priceCurrency: "USD" },
          { "@type": "Offer", name: "Gold", price: "50.00", priceCurrency: "USD" },
          { "@type": "Offer", name: "Platinum", price: "100.00", priceCurrency: "USD" },
        ],
        featureList: [
          "Instagram Graph API messaging with AI auto-replies",
          "WhatsApp Business Cloud API messaging",
          "Google Maps / OpenStreetMap business discovery",
          "Groq AI hashtag and message generation",
          "Unified multi-channel outreach inbox",
          "Gmail cold email sending",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        // Sourced from the exact same array rendered visibly on the page —
        // see components/landing/LandingPage.tsx — so this can't drift from
        // what a visitor actually reads.
        mainEntity: landingFaqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
