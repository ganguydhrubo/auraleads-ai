import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

const CATEGORY_TAGS: { match: string; key: string; value: string }[] = [
  { match: "marketing", key: "office", value: "advertising_agency" },
  { match: "advertising", key: "office", value: "advertising_agency" },
  { match: "hvac", key: "craft", value: "hvac" },
  { match: "saas", key: "office", value: "it" },
  { match: "software", key: "office", value: "it" },
  { match: "real estate", key: "office", value: "estate_agent" },
  { match: "dental", key: "amenity", value: "dentist" },
];

function escapeForRegex(query: string): string {
  const words = query
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return words.join("|");
}

function buildOverpassQuery(lat: number, lng: number, query: string): string {
  const nameRegex = escapeForRegex(query);
  const lowerQuery = query.toLowerCase();
  const matchedTags = CATEGORY_TAGS.filter((c) => lowerQuery.includes(c.match));

  const nameClauses = nameRegex
    ? `node["name"~"${nameRegex}",i](around:5000,${lat},${lng});\n  way["name"~"${nameRegex}",i](around:5000,${lat},${lng});`
    : "";

  const tagClauses = matchedTags
    .map(
      (c) =>
        `node["${c.key}"="${c.value}"](around:5000,${lat},${lng});\n  way["${c.key}"="${c.value}"](around:5000,${lat},${lng});`
    )
    .join("\n  ");

  return `[out:json][timeout:25];\n(\n  ${nameClauses}\n  ${tagClauses}\n);\nout center 20;`;
}

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`,
      {
        headers: { "User-Agent": "AuraLeadsAI/1.0 (contact@auraleads.ai)" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { location, query } = body;
  let { lat, lng } = body;

  if (!location || !query) {
    return NextResponse.json({ error: "location and query are required" }, { status: 400 });
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    const geo = await geocode(location);
    if (!geo) return NextResponse.json({ error: "Could not resolve that location." }, { status: 400 });
    lat = geo.lat;
    lng = geo.lng;
  }

  const overpassQuery = buildOverpassQuery(lat, lng, query);

  // The public Overpass instances reject requests with no descriptive
  // User-Agent (often with a 406), and any single mirror can be briefly
  // down — try a short list in order before giving up.
  const OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];

  let elements: any[] = [];
  let lastError = "";
  let succeeded = false;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "AuraLeadsAI/1.0 (+https://auraleads.online; contact@auraleads.online)",
          Accept: "*/*",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        lastError = `${mirror} returned ${res.status}`;
        continue;
      }

      const data = await res.json();
      elements = data.elements || [];
      succeeded = true;
      break;
    } catch (err: any) {
      lastError = `${mirror} failed: ${err.message}`;
      continue;
    }
  }

  if (!succeeded) {
    return NextResponse.json({ error: `All Overpass mirrors failed (${lastError}) — try again shortly.` }, { status: 502 });
  }

  const supabase = createSupabaseServerClient();

  const { data: existingLeads } = await supabase
    .from("leads")
    .select("name, city")
    .eq("workspace_id", session.workspaceId)
    .eq("platform", "maps");

  const existingKeys = new Set(
    (existingLeads || []).map((l: any) => `${(l.name || "").toLowerCase()}|${(l.city || "").toLowerCase()}`)
  );

  const seenInBatch = new Set<string>();
  const toInsert: any[] = [];

  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name;
    if (!name) continue;

    const key = `${name.toLowerCase()}|${location.toLowerCase()}`;
    if (existingKeys.has(key) || seenInBatch.has(key)) continue;
    seenInBatch.add(key);

    const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");

    toInsert.push({
      workspace_id: session.workspaceId,
      platform: "maps",
      name,
      category: query,
      address: address || "",
      city: location,
      phone: tags.phone || tags["contact:phone"] || null,
      website: tags.website || tags["contact:website"] || null,
      email: tags.email || tags["contact:email"] || null,
      rating: null,
      reviews_count: null,
      revealed: false,
      decision: "pending",
      source: "maps_search",
      found_at: new Date().toISOString(),
    });
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from("leads").insert(toInsert);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ count: toInsert.length });
}
