import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&limit=5&q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "CelestiaLeadsPlatform/2.0 (discovery@celestialeads.local)",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Nominatim returned ${res.status}`);
    }

    const data = await res.json();

    // Real approximate area from the bounding box Nominatim returns (haversine),
    // not a fabricated number — only shown when a boundingbox is actually present.
    function bboxAreaKm2(bbox: string[] | null): number | null {
      if (!bbox || bbox.length !== 4) return null;
      const [south, north, west, east] = bbox.map(parseFloat);
      const R = 6371;
      const latKm = ((north - south) * Math.PI * R) / 180;
      const midLatRad = ((north + south) / 2) * (Math.PI / 180);
      const lngKm = ((east - west) * Math.PI * R * Math.cos(midLatRad)) / 180;
      return Math.abs(latKm * lngKm);
    }

    const results = data.map((item: any) => {
      const areaKm2 = bboxAreaKm2(item.boundingbox || null);
      return {
        id: item.place_id?.toString() || item.osm_id?.toString() || `${item.lat}_${item.lon}`,
        name: item.display_name,
        type: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Location",
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        area: areaKm2 ? `${areaKm2 < 10 ? areaKm2.toFixed(1) : Math.round(areaKm2)} km²` : null,
        hasPolygon: !!item.geojson,
        geojson: item.geojson || null,
        boundingbox: item.boundingbox || null,
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ results: [], error: "Geocoding service unavailable, try again." }, { status: 502 });
  }
}