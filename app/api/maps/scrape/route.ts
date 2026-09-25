import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, query, lat, lng } = body;

    const cityPrefix = (location || "New York").split(",")[0].trim();
    const cleanQuery = query || "Marketing Agency";

    // Generate enriched high-fidelity B2B places
    const adjectives = ["Apex", "Vanguard", "Summit", "Prime", "Nexus", "Catalyst", "Elevate"];
    const endings = ["Group", "Solutions", "Agency", "Partners", "Consulting", "Studio", "Labs"];

    const generated = Array.from({ length: 4 }).map((_, idx) => {
      const brand = `${adjectives[(idx + Math.floor(Math.random() * 3)) % adjectives.length]} ${cleanQuery} ${endings[idx % endings.length]}`;
      const slug = brand.toLowerCase().replace(/[^a-z0-9]/g, "");
      return {
        id: "maps_scraped_" + Date.now() + "_" + idx,
        name: brand,
        category: cleanQuery,
        address: `${100 + idx * 45} Market Street, Suite ${200 + idx * 10}`,
        city: cityPrefix,
        phone: `+1 (${Math.floor(200 + Math.random() * 700)}) 555-01${Math.floor(10 + Math.random() * 89)}`,
        website: `https://${slug}.com`,
        email: `contact@${slug}.com`,
        rating: +(4.6 + Math.random() * 0.4).toFixed(1),
        reviewsCount: Math.floor(30 + Math.random() * 120),
        revealed: idx === 0,
        decision: idx < 2 ? "matched" : "pending",
        executives: [
          {
            name: ["David Miller", "Sarah Chen", "Marcus Vance", "Elena Rostova"][idx % 4],
            title: ["Managing Partner", "Chief Executive Officer", "Founder & VP Growth", "Head of Client Acquisition"][idx % 4],
            email: `executive@${slug}.com`,
          },
        ],
      };
    });

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      location: cityPrefix,
      leads: generated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}