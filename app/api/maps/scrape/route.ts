import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const CATEGORY_TAGS: { match: string; key: string; value: string }[] = [
  { match: "marketing", key: "office", value: "advertising_agency" },
  { match: "advertising", key: "office", value: "advertising_agency" },
  { match: "hvac", key: "craft", value: "hvac" },
  { match: "saas", key: "office", value: "it" },
  { match: "software", key: "office", value: "it" },
  { match: "real estate", key: "office", value: "estate_agent" },
  { match: "dental", key: "amenity", value: "dentist" },
];

interface NormalizedResult {
  name: string;
  category: string;
  address: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  rating: number | null;
  reviewsCount: number | null;
  metadata: Record<string, any>;
}

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
        headers: { "User-Agent": "AuraLeadsAI/1.0 (contact@auraleads.online)" },
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

// Real Google Places Text Search — used when GOOGLE_PLACES_API_KEY is set.
// Returns real ratings/review counts (something OSM simply doesn't have).
// Phone/website aren't included in Text Search results (that costs a
// separate Place Details call per business), so those are fetched lazily
// when the user clicks "Reveal" — see /api/channels/maps/enrich.
async function runGooglePlacesSearch(location: string, query: string, apiKey: string): Promise<{ results: NormalizedResult[] } | { error: string }> {
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", `${query} in ${location}`);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return { error: `Google Places API: ${data.status}${data.error_message ? " — " + data.error_message : ""}` };
    }

    const results: NormalizedResult[] = (data.results || []).map((r: any) => ({
      name: r.name,
      category: query,
      address: r.formatted_address || "",
      phone: null,
      website: null,
      email: null,
      rating: typeof r.rating === "number" ? r.rating : null,
      reviewsCount: typeof r.user_ratings_total === "number" ? r.user_ratings_total : null,
      metadata: { placeId: r.place_id, source: "google_places" },
    }));

    return { results };
  } catch (err: any) {
    return { error: `Google Places request failed: ${err.message}` };
  }
}

async function runOverpassSearch(lat: number, lng: number, query: string): Promise<{ results: NormalizedResult[] } | { error: string }> {
  const overpassQuery = buildOverpassQuery(lat, lng, query);

  // The public Overpass instances reject requests with no descriptive
  // User-Agent (often with a 406), and any single mirror can be briefly
  // down — try a short list in order before giving up.
  const OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];

  // Public Overpass instances are frequently overloaded, and a query can
  // legitimately hang for 20s+ before failing. Racing all mirrors at once
  // (instead of trying them one at a time) means a single slow/dead mirror
  // no longer adds its full timeout to the user's wait.
  const attempts = OVERPASS_MIRRORS.map(async (mirror) => {
    const res = await fetch(mirror, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AuraLeadsAI/1.0 (+https://auraleads.online; contact@auraleads.online)",
        Accept: "*/*",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`${mirror} returned ${res.status}`);
    return res.json();
  });

  const outcomes = await Promise.allSettled(attempts);
  const succeeded = outcomes.find((o) => o.status === "fulfilled") as PromiseFulfilledResult<any> | undefined;

  if (!succeeded) {
    const errors = outcomes.map((o) => (o as PromiseRejectedResult).reason?.message || "unknown error");
    console.error(`[maps/scrape] all Overpass mirrors failed: ${errors.join(" | ")}`);
    return { error: "The map data provider is temporarily unavailable — try again shortly." };
  }

  const elements = succeeded.value.elements || [];
  const results: NormalizedResult[] = [];
  for (const el of elements) {
    const tags = el.tags || {};
    if (!tags.name) continue;
    const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    results.push({
      name: tags.name,
      category: query,
      address: address || "",
      phone: tags.phone || tags["contact:phone"] || null,
      website: tags.website || tags["contact:website"] || null,
      email: tags.email || tags["contact:email"] || null,
      rating: null,
      reviewsCount: null,
      metadata: { source: "osm" },
    });
  }

  return { results };
}

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabaseForRateLimit = createSupabaseServerClient();
  // Each call can trigger a billed Google Places Text Search, so this stays
  // tight — legitimate use is "search a city, look at results", not a loop.
  const rate = await checkRateLimit(supabaseForRateLimit, session.workspaceId, "maps_scrape", { max: 5, windowSeconds: 60 });
  if (!rate.ok) return NextResponse.json({ error: rate.error }, { status: 429 });

  const body = await request.json();
  const { location, query } = body;
  let { lat, lng } = body;

  if (!location || !query) {
    return NextResponse.json({ error: "location and query are required" }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  let outcome: { results: NormalizedResult[] } | { error: string };

  if (googleKey) {
    outcome = await runGooglePlacesSearch(location, query, googleKey);
    // Fall back to OSM if Google's call itself failed (not for zero results,
    // which is a valid real outcome).
    if ("error" in outcome) {
      if (typeof lat !== "number" || typeof lng !== "number") {
        const geo = await geocode(location);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }
      if (typeof lat === "number" && typeof lng === "number") {
        outcome = await runOverpassSearch(lat, lng, query);
      }
    }
  } else {
    if (typeof lat !== "number" || typeof lng !== "number") {
      const geo = await geocode(location);
      if (!geo) return NextResponse.json({ error: "Could not resolve that location." }, { status: 400 });
      lat = geo.lat;
      lng = geo.lng;
    }
    outcome = await runOverpassSearch(lat, lng, query);
  }

  if ("error" in outcome) {
    return NextResponse.json({ error: outcome.error }, { status: 502 });
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

  for (const r of outcome.results) {
    const key = `${r.name.toLowerCase()}|${location.toLowerCase()}`;
    if (existingKeys.has(key) || seenInBatch.has(key)) continue;
    seenInBatch.add(key);

    toInsert.push({
      workspace_id: session.workspaceId,
      platform: "maps",
      name: r.name,
      category: r.category,
      address: r.address,
      city: location,
      phone: r.phone,
      website: r.website,
      email: r.email,
      rating: r.rating,
      reviews_count: r.reviewsCount,
      revealed: false,
      decision: "pending",
      source: "maps_search",
      found_at: new Date().toISOString(),
      metadata: r.metadata,
    });
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from("leads").insert(toInsert);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ count: toInsert.length });
}
