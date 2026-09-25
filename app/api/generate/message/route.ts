import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { lead, templates } = await request.json();

    if (!lead) {
      return NextResponse.json({ error: "Lead is required" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const firstName = (lead.name || lead.username).split(" ")[0];

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
                  "You are AuraLeads AI Copywriter. Generate two personalized outreach messages: 1) a conversational Instagram DM under 3 sentences with a soft CTA, and 2) a short, high-conversion cold email. Output ONLY valid JSON with keys: generatedDm, generatedEmail. Do not wrap in markdown.",
              },
              {
                role: "user",
                content: `Prospect: Name "${lead.name}", Username "@${lead.username}", Bio: "${lead.bio}", Category: "${lead.category}". Sender Name: "${templates?.fromName || "Devon"}".`,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const raw = data.choices[0]?.message?.content?.trim() || "";
          const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(clean);
          return NextResponse.json({
            source: "groq-gpt-oss-20b",
            generatedDm: parsed.generatedDm,
            generatedEmail: parsed.generatedEmail,
          });
        }
      } catch (err) {
        console.error("Groq message generation failed:", err);
      }
    }

    // High quality fallback
    const category = lead.category || "growth marketing";
    const company = lead.name ? `${lead.name.split(" ")[0]} Studio` : "your team";

    return NextResponse.json({
      source: "fallback",
      generatedDm: `Hey ${firstName}! Loved your recent breakdown on ${category} bottlenecks. We built an AI pipeline specifically for high-growth teams to automate prospect discovery without losing human touch. Open to a 2-min look?`,
      generatedEmail: `Hi ${firstName},\n\nI noticed how ${company} is scaling acquisition in ${category}. Our system combines multi-channel discovery with AI qualification to feed sales teams verified prospects directly.\n\nCould I share a 90-second demo video?\n\nBest,\n${templates?.fromName || "Devon Carter"}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}