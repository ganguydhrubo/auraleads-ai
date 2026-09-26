"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  CheckCircle2,
  Compass,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  X,
  Play,
  Clock,
  Loader2,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

interface MapsDiscoverViewProps {
  setCurrentView: (view: string) => void;
}

interface LocationOption {
  id: string;
  name: string;
  type: string;
  area: string | null;
  lat: number;
  lng: number;
  hasPolygon: boolean;
  geojson?: any;
}

const sampleLocations: LocationOption[] = [
  { id: "loc_1", name: "Manhattan, New York, NY, USA", type: "Borough", area: "59.1 km²", lat: 40.7831, lng: -73.9712, hasPolygon: true },
  { id: "loc_2", name: "Austin, Travis County, Texas, USA", type: "City", area: "828.6 km²", lat: 30.2672, lng: -97.7431, hasPolygon: true },
  { id: "loc_3", name: "Chicago, Cook County, Illinois, USA", type: "City", area: "607.4 km²", lat: 41.8781, lng: -87.6298, hasPolygon: true },
  { id: "loc_4", name: "Miami, Miami-Dade County, Florida, USA", type: "City", area: "145.2 km²", lat: 25.7617, lng: -80.1918, hasPolygon: true },
  { id: "loc_5", name: "London, Greater London, England, UK", type: "Metropolis", area: "1,572 km²", lat: 51.5074, lng: -0.1278, hasPolygon: true },
];

export function MapsDiscoverView({ setCurrentView }: MapsDiscoverViewProps) {
  const { addMapsDiscoveryBatch } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationsList, setLocationsList] = useState<LocationOption[]>(sampleLocations);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(sampleLocations[0]);
  const [confirmedLocation, setConfirmedLocation] = useState<LocationOption | null>(null);
  // Was defaulting to real text ("Marketing Agency"), indistinguishable
  // from something the user actually typed — the field already has a
  // placeholder and a matching quick-filter chip for this.
  const [queryInput, setQueryInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);

  // Debounced live geocode search via /api/maps/search
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setLocationsList(sampleLocations);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/maps/search?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setLocationsList(data.results);
            setSelectedLocation(data.results[0]);
          }
        }
      } catch (err) {
        // Keep local fallback
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize or update Leaflet map on client
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      const L = await import("leaflet");

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current).setView([40.7831, -73.9712], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        mapInstanceRef.current = map;
      }

      if (mapInstanceRef.current && selectedLocation && isMounted) {
        const map = mapInstanceRef.current;
        map.setView([selectedLocation.lat, selectedLocation.lng], 12);

        if (polygonLayerRef.current) {
          map.removeLayer(polygonLayerRef.current);
        }

        if (selectedLocation.geojson) {
          // Real OpenStreetMap boundary from Nominatim.
          polygonLayerRef.current = L.geoJSON(selectedLocation.geojson, {
            style: { color: "#3B50F5", fillColor: "#3B50F5", fillOpacity: 0.18, weight: 2 },
          }).addTo(map);
        } else {
          // No real boundary available for this location — show the actual
          // search radius used by discovery (5km), not a fabricated shape.
          polygonLayerRef.current = L.circle([selectedLocation.lat, selectedLocation.lng], {
            radius: 5000,
            color: "#3B50F5",
            fillColor: "#3B50F5",
            fillOpacity: 0.12,
            weight: 2,
            dashArray: "6 4",
          }).addTo(map);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [selectedLocation]);

  const handleStartScrape = async () => {
    setIsScraping(true);
    setScrapeError("");
    const chosenLoc = confirmedLocation ? confirmedLocation.name : selectedLocation?.name || "New York, NY";
    const loc = confirmedLocation || selectedLocation;

    const result = await addMapsDiscoveryBatch(chosenLoc, queryInput, loc?.lat, loc?.lng);

    setIsScraping(false);
    if (result.ok) {
      setScrapeSuccess(true);
      setTimeout(() => setCurrentView("maps_leads"), 1000);
    } else {
      setScrapeError(result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Real Business Discovery Engine</h2>
            <p className="text-xs text-muted-foreground">
              Live Nominatim OpenStreetMap geocoding with boundary preview and background business scraping queue.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView("maps_leads")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-muted"
        >
          <span>View Maps Leads</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Location & Query Form */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step 1: Location Picker */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-semibold text-foreground">Pick a Location</h3>
              </div>
              {isSearching && (
                <span className="flex items-center gap-1 text-[11px] text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" /> Geocoding...
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Type any city worldwide. Shows the real OpenStreetMap boundary when available, or an approximate 5km search radius otherwise.
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search city, suburb, or region worldwide..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            {/* Autocomplete list — dimmed while a new search is in flight so
                stale results (from before the last keystroke) don't read as
                the current answer; the "Geocoding..." label above is easy to
                miss since attention is on this list, not the heading. */}
            <div className={`space-y-1.5 max-h-48 overflow-y-auto transition-opacity ${isSearching ? "opacity-40" : ""}`}>
              {locationsList.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                    selectedLocation?.id === loc.id
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-muted/30 border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate">{loc.name}</div>
                    <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {loc.type}
                    </span>
                    {loc.hasPolygon && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                        {loc.area}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm Area Bar */}
            {selectedLocation && !confirmedLocation && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Use this area for scraping?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmedLocation(selectedLocation)}
                    className="px-3 py-1 rounded bg-primary text-white font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="w-3 h-3" /> Confirm
                  </button>
                </div>
              </div>
            )}

            {confirmedLocation && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                <span className="font-semibold flex items-center gap-1.5 truncate pr-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Confirmed: {confirmedLocation.name.split(",")[0]}
                </span>
                <button
                  onClick={() => setConfirmedLocation(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Search Queries */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-semibold text-foreground">Add Queries</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter target business categories to collect local business listings and websites.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="e.g. Marketing Agency, Commercial Roofing, Dental Practice..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                {["Marketing Agency", "HVAC Services", "SaaS Companies", "Real Estate Broker", "Dental Clinic"].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQueryInput(q)}
                    className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartScrape}
              disabled={isScraping || !queryInput.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
              {/* Not actually a background job — this blocks on a real API
                  call (can take 10s+) — so it shouldn't claim to be one.
                  "Searching..." also no longer names a specific backend,
                  since it depends on whether GOOGLE_PLACES_API_KEY is set
                  server-side, not something the client can see. */}
              <span>{isScraping ? "Searching for businesses..." : "Discover Businesses"}</span>
            </button>
            {scrapeError && (
              <p className="text-[11px] text-rose-600 font-medium">{scrapeError}</p>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">OpenStreetMap Polygon Preview</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
              {selectedLocation?.name.split(",")[0]} · {selectedLocation?.area}
            </span>
          </div>

          <div className="flex-1 w-full mt-3 rounded-lg overflow-hidden border border-border relative">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}