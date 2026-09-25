import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const EXPECTED_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "auraleads_wh_token";

  if (mode === "subscribe" && token === EXPECTED_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signature) {
    return NextResponse.json({ error: "Missing signature or META_APP_SECRET not configured" }, { status: 401 });
  }

  const expectedSignature = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  const valid = sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: "EVENT_RECEIVED" });
  }

  // Always ack quickly; do ingestion best-effort so one bad entry can't 500 the whole webhook.
  const admin = createSupabaseAdminClient();

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      try {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const messages = value?.messages || [];
        if (!phoneNumberId || messages.length === 0) continue;

        const { data: settingsRows } = await admin
          .from("workspace_settings")
          .select("workspace_id, whatsapp");
        const match = (settingsRows || []).find((r: any) => r.whatsapp?.phoneNumberId === phoneNumberId);
        if (!match) continue;

        const workspaceId = match.workspace_id;
        const profileName = value?.contacts?.[0]?.profile?.name;

        for (const msg of messages) {
          const fromPhone = msg.from;
          const text = msg.text?.body || "";
          if (!fromPhone) continue;

          const { data: existingConv } = await admin
            .from("conversations")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("channel", "whatsapp")
            .eq("contact_handle", fromPhone)
            .maybeSingle();

          let conversationId = existingConv?.id;
          if (!conversationId) {
            const { data: created } = await admin
              .from("conversations")
              .insert({
                workspace_id: workspaceId,
                channel: "whatsapp",
                contact_name: profileName || fromPhone,
                contact_handle: fromPhone,
                contact_type: "lead",
                needs_human: true,
                unread: true,
              })
              .select()
              .single();
            conversationId = created?.id;
          } else {
            await admin.from("conversations").update({ unread: true, last_active: new Date().toISOString() }).eq("id", conversationId);
          }

          if (conversationId) {
            await admin.from("messages").insert({
              workspace_id: workspaceId,
              conversation_id: conversationId,
              sender: "them",
              channel: "whatsapp",
              content: text,
              external_id: msg.id,
            });
          }
        }
      } catch (err) {
        console.error("whatsapp webhook entry failed:", err);
        continue;
      }
    }
  }

  return NextResponse.json({ status: "EVENT_RECEIVED" });
}
