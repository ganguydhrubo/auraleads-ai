import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

function extractMailtos(html: string): string[] {
  const matches = html.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  const emails = new Set<string>();
  for (const m of matches) emails.add(m[1]);
  return Array.from(emails);
}

function extractPhone(html: string): string | null {
  const telMatch = html.match(/tel:([+\d][\d\s\-().]{6,}\d)/);
  if (telMatch) return telMatch[1].trim();
  const textMatch = html.match(/\+?\d[\d\s\-()]{7,}\d/);
  return textMatch ? textMatch[0].trim() : null;
}

async function fetchWebsiteHtml(website: string): Promise<string | null> {
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "AuraLeadsAI/1.0 (contact@auraleads.ai)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { leadId, mode } = await request.json();
  if (!leadId || !["reveal", "enrich"].includes(mode)) {
    return NextResponse.json({ error: "leadId and mode ('reveal'|'enrich') are required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("workspace_id", session.workspaceId)
    .single();

  if (leadErr || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  let foundEmail = false;
  let foundPhone = false;
  const updates: Record<string, any> = { revealed: true, decision: "matched" };

  const placeId = lead.metadata?.placeId;
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;

  if (placeId && googleKey) {
    // Google-sourced lead — fetch real phone/website via Place Details
    // (Text Search doesn't include them; this is a separate, billed call,
    // so it only happens on-demand when the user actually reveals a lead).
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.set("place_id", placeId);
      url.searchParams.set("fields", "formatted_phone_number,website");
      url.searchParams.set("key", googleKey);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      const details = data.result || {};

      if (!lead.phone && details.formatted_phone_number) {
        updates.phone = details.formatted_phone_number;
        foundPhone = true;
      }
      if (!lead.website && details.website) {
        updates.website = details.website;
      }
    } catch {
      // fall through — reveal still marks the lead as matched, just with
      // whatever real data was actually retrievable
    }
  }

  // Google Places has no email field at all — if we now know the website
  // (from Google Place Details above, or it was already on the lead from an
  // OSM search), scrape it for a real contact email the same way either way.
  const websiteToCheck = lead.website || updates.website;
  if (websiteToCheck) {
    const html = await fetchWebsiteHtml(websiteToCheck);
    if (html) {
      const emails = extractMailtos(html);
      const phone = extractPhone(html);

      if (!lead.email && emails.length > 0) {
        updates.email = emails[0];
        foundEmail = true;
      }
      if (!lead.phone && phone) {
        updates.phone = phone;
        foundPhone = true;
      }
      if (mode === "enrich") {
        const existingExecutives = Array.isArray(lead.executives) ? lead.executives : [];
        const existingEmails = new Set(existingExecutives.map((e: any) => e.email).filter(Boolean));
        const secondEmail = emails.find((e) => e !== updates.email && !existingEmails.has(e));
        if (secondEmail) {
          updates.executives = [...existingExecutives, { name: "", title: "", email: secondEmail }];
        }
      }
    }
  }

  const { error: updateErr } = await supabase.from("leads").update(updates).eq("id", leadId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ success: true, foundEmail, foundPhone });
}
