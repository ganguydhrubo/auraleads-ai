// Plain data module (no "use client") so both the client-rendered landing
// page and the server-rendered FAQPage structured data in app/page.tsx can
// import the exact same content — a Server Component can't call array
// methods on anything imported from a "use client" module.
export const landingFaqs = [
  {
    q: "How does AuraLeads source prospects from Instagram without getting banned?",
    a: "Instagram's official API doesn't support cold outreach or hashtag-based discovery for third parties — no legitimate tool can do that through Meta's API. AuraLeads uses the official Graph API for what it's actually built for (replying to inbound DMs and AI auto-replies within Meta's messaging window), and a separate browser-automation worker — using your own logged-in Instagram session, with daily volume caps — for cold discovery and first-touch outreach. That second part runs outside Instagram's Terms of Service, same as similar tools on the market, and carries a real risk of account restrictions if overused.",
  },
  {
    q: "Is Google Maps business data real?",
    a: "Yes — it's sourced live from OpenStreetMap, with no fabricated results. Contact enrichment checks the business's own public website for a listed email/phone; it's only as complete as what that business has published, so some listings will have gaps rather than invented data.",
  },
  {
    q: "Can I connect multiple Gmail inboxes for cold outreach?",
    a: "Yes. Connect multiple Gmail accounts with an App Password (each one is verified with a real SMTP login before being saved), and sends automatically round-robin to whichever connected account has sent the least that day. Replies aren't pushed in real time — Gmail App Passwords don't support that — but a \"Check for new emails\" button in the Unified Inbox pulls in new replies from the last few days on demand.",
  },
  {
    q: "How does Groq AI power the qualification and messaging pipeline?",
    a: "AuraLeads runs ultra-fast Groq LPU inference (openai/gpt-oss-20b) to generate hashtag suggestions and personalized DM/email copy from your business description and each lead's profile, typically in a few seconds.",
  },
  {
    q: "Does AuraLeads handle CAN-SPAM, GDPR, and opt-out requests automatically?",
    a: "AuraLeads focuses on publicly listed B2B business data, and you can configure AI Reply Rules to instruct the assistant to stop messaging someone who opts out. There's no automated suppression-list or one-click-unsubscribe system built in yet — you remain the data controller and are responsible for complying with CAN-SPAM, GDPR, and similar laws in how you use the platform.",
  },
  {
    q: "Can I try AuraLeads for free without a credit card?",
    a: "Yes! Every new user receives a full 7-day trial of our platform with up to 10 hashtags per week and 10 qualified leads per day. No credit card is required to begin.",
  },
];
