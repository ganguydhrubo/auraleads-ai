import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Generate per-request instead of at build time — the local build
// environment fails trying to statically prerender this route (a known
// next/og issue resolving its default-font URL during static generation);
// dynamic rendering is normal for OG images anyway.
export const dynamic = "force-dynamic";

// Generated at request time from real brand colors/marks (same palette as
// app/icon.svg) — not a placeholder image, and not missing entirely like
// it was before this file existed.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #101a2c 0%, #16233a 60%, #1a2c4a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: "#234C83",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 40 40">
              <path d="M9 27.5 18.3 12h5.4l-9.3 15.5H9Z" fill="#fff" />
              <path d="m18.2 27.5 9.3-15.5H33l-9.3 15.5h-5.5Z" fill="#fff" opacity="0.82" />
              <path d="M23.4 28.5h8.5" stroke="#55D6AF" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#ffffff", display: "flex" }}>
            AuraLeads<span style={{ color: "#55D6AF" }}>.ai</span>
          </div>
        </div>
        <div style={{ fontSize: 30, color: "#a9b8cf", maxWidth: 900, textAlign: "center", display: "flex" }}>
          Instagram, Maps &amp; WhatsApp lead generation in one workflow
        </div>
      </div>
    ),
    { ...size }
  );
}
