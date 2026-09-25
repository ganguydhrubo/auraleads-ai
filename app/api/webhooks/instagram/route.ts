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

async function ingestMessagingEvent(admin: ReturnType<typeof createSupabaseAdminClient>, igAccountId: string, event: any) {
  const text: string | undefined = event.message?.text;
  const senderPsid: string | undefined = event.sender?.id;
  if (!text || !senderPsid) return;

  const { data: settingsRows } = await admin
    .from("workspace_settings")
    .select("workspace_id, instagram")
    .contains("instagram", { igUserId: igAccountId })
    .limit(1);

  const workspaceId = settingsRows?.[0]?.workspace_id;
  if (!workspaceId) {
    console.warn(`[instagram webhook] no workspace connected for IG account ${igAccountId}`);
    return;
  }

  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "instagram")
    .contains("metadata", { senderPsid })
    .maybeSingle();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: created } = await admin
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        channel: "instagram",
        contact_name: "Instagram User",
        contact_handle: senderPsid,
        contact_type: "lead",
        needs_human: true,
        unread: true,
        metadata: { senderPsid },
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
      channel: "instagram",
      content: text,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const payload = JSON.parse(rawBody);
    const admin = createSupabaseAdminClient();

    for (const entry of payload.entry || []) {
      const igAccountId = entry.id;
      for (const event of entry.messaging || []) {
        try {
          await ingestMessagingEvent(admin, igAccountId, event);
        } catch (err) {
          console.error("[instagram webhook] failed to ingest one messaging event:", err);
        }
      }
    }

    // Meta requires a fast 200 ack regardless of downstream processing outcome.
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (err: any) {
    console.error("[instagram webhook] top-level error:", err);
    return new Response("EVENT_RECEIVED", { status: 200 });
  }
}
