import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { PLAN_LIMITS } from "@/lib/store/initial-data";
import { isUnlimited } from "@/lib/entitlements";

export async function POST(request: NextRequest) {
  // Was reachable with no login at all — any caller could run up real Groq
  // cost, and the hashtagsWeek quota was only ever checked client-side, so
  // even a logged-in user calling this directly could blow past their plan.
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createSupabaseServerClient();

  // Anti-abuse/cost-control throttle (protects the shared Groq spend from a
  // runaway loop) — this is not a plan benefit, so it applies to everyone,
  // unlimited account included.
  const rate = await checkRateLimit(supabase, session.workspaceId, "gen_hashtags", { max: 10, windowSeconds: 60 });
  if (!rate.ok) return NextResponse.json({ error: rate.error }, { status: 429 });

  const unlimited = await isUnlimited(session.userId);
  if (!unlimited) {
    const { data: workspace } = await supabase.from("workspaces").select("plan").eq("id", session.workspaceId).single();
    const plan = (workspace?.plan || "Trial") as keyof typeof PLAN_LIMITS;
    // Count currently-ACTIVE hashtags, not ones added in a trailing 7-day
    // window — the old window-based count let a hashtag age out and quietly
    // free a slot without ever being deleted, while deleting one added
    // earlier this week didn't free a slot until the window rolled over.
    // "How many of your weeklyCap slots are occupied right now" is the
    // model that matches deletion actually freeing a slot immediately.
    const { count: activeCount } = await supabase
      .from("hashtags")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", session.workspaceId)
      .eq("active", true);

    const weeklyCap = PLAN_LIMITS[plan]?.hashtagsWeek ?? PLAN_LIMITS.Trial.hashtagsWeek;
    if ((activeCount || 0) >= weeklyCap) {
      return NextResponse.json({ error: `Weekly hashtag limit reached (${weeklyCap} on your ${plan} plan) — remove a hashtag to free a slot, or upgrade your plan.` }, { status: 429 });
    }
  }

  try {
    const { description, region } = await request.json();

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [
              {
                role: "system",
                content:
                  "You are AuraLeads AI, an autonomous B2B lead generation algorithm. Output ONLY a valid JSON array of 5 objects with no markdown backticks, no explanations. Each object must have keys: tag (e.g. #b2bmarketing), validationScore (integer 85-98), postsCount (e.g. '850k'), relevanceScore (integer 88-99).",
              },
              {
                role: "user",
                content: `Generate 5 high-converting Instagram discovery hashtags for: "${description}". Target Geo: "${region || "Global"}".`,
              },
            ],
            temperature: 0.6,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const raw = data.choices[0]?.message?.content?.trim() || "";
          const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(clean);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return NextResponse.json({
              source: "groq-gpt-oss-20b",
              hashtags: parsed.map((h: any, idx: number) => ({
                id: "ht_ai_" + Date.now() + "_" + idx,
                tag: (h.tag || "#leads").startsWith("#") ? h.tag : "#" + h.tag,
                source: "ai",
                validationScore: h.validationScore || 92,
                postsCount: h.postsCount || "650k",
                relevanceScore: h.relevanceScore || 94,
                active: true,
              })),
            });
          }
        }
      } catch (err) {
        console.error("Groq call failed, using heuristic:", err);
      }
    }

    // Heuristic fallback
    const words = (description + " " + (region || "")).toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !["with", "from", "that", "this", "help", "your", "their"].includes(w));

    const uniqueWords = Array.from(new Set(words)).slice(0, 5);
    const suffixes = ["growth", "marketing", "leads", "scale", "founders"];

    const hashtags = uniqueWords.map((word, idx) => ({
      id: "ht_ai_" + Date.now() + "_" + idx,
      tag: "#" + word + suffixes[idx % suffixes.length],
      source: "ai",
      validationScore: Math.floor(88 + Math.random() * 10),
      postsCount: `${Math.floor(250 + Math.random() * 800)}k`,
      relevanceScore: Math.floor(90 + Math.random() * 9),
      active: true,
    }));

    return NextResponse.json({
      source: "heuristic-nlp",
      hashtags,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}