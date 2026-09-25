import { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "AuraLeads AI — Autonomous Instagram & Google Maps Lead Generation Engine",
  description:
    "Autonomous B2B lead generation software for agencies, DTC brands, and SaaS founders. Source verified prospects from Instagram hashtags, competitor followers, and Google Maps with instant Groq AI qualification.",
  keywords: [
    "AI lead generation",
    "Instagram lead generation",
    "Google Maps scraper",
    "Instagram DM automation",
    "B2B cold outreach",
    "competitor follower scraper",
    "Groq AI sales agent",
    "local business lead finder",
    "agency sales pipeline",
  ],
  authors: [{ name: "AuraLeads AI" }],
  creator: "AuraLeads AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://auraleads.ai",
    title: "AuraLeads AI — Autonomous Instagram & Google Maps Lead Generation",
    description:
      "Find high-intent prospects on Instagram & Google Maps, qualify with Groq AI, and scale personalized DM and cold email sequences.",
    siteName: "AuraLeads AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuraLeads AI — Autonomous Instagram & Google Maps Lead Generation",
    description: "Scale outbound pipeline with AI Instagram DMs and Google Maps executive enrichment.",
  },
  alternates: {
    canonical: "https://auraleads.ai",
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://auraleads.ai/#organization",
        name: "AuraLeads AI",
        url: "https://auraleads.ai",
        logo: "https://auraleads.ai/logo.png",
        sameAs: ["https://twitter.com/AuraLeadsAI", "https://github.com/ganguydhrubo"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://auraleads.ai/#software",
        name: "AuraLeads AI Platform",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "29.00",
          priceCurrency: "USD",
        },
        featureList: [
          "Instagram Hashtag Discovery Engine",
          "Competitor Follower Audience Scraper",
          "Leaflet Google Maps Polygonal Geocoding",
          "Groq High-Speed AI Qualification",
          "Unified Multi-Channel Outreach Inbox",
          "Automated Cold DM & Gmail Sequences",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://auraleads.ai/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "How does AuraLeads source prospects from Instagram without getting banned?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "AuraLeads utilizes official Meta Graph APIs for messaging while dispatching bulk actions through safe, randomized batch throttling (max 200 DMs/hr with 5-minute cooldowns) and optional residential browser extension dispatch.",
            },
          },
          {
            "@type": "Question",
            name: "Is Google Maps business data accurate and enriched with direct emails?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Our Maps discovery engine queries live geocoded OpenStreetMap and Google Places nodes, identifying verified business contacts and executive decision-makers.",
            },
          },
        ],
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
