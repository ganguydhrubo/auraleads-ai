import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { leadId } = await request.json();
  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

  const supabase = createSupabaseServerClient();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).eq("workspace_id", session.workspaceId).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.generated_dm) return NextResponse.json({ error: "This lead has no generated message yet." }, { status: 400 });

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("x")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const x = settings?.x;
  if (!x?.connected) return NextResponse.json({ error: "X is not connected. Verify your API keys in Settings first." }, { status: 400 });

  const client = new TwitterApi({ appKey: x.appKey, appSecret: x.appSecret, accessToken: x.accessToken, accessSecret: x.accessSecret });

  try {
    const recipient = await client.v2.userByUsername(lead.username);
    if (!recipient?.data?.id) throw new Error(`Could not resolve @${lead.username} on X.`);

    // v1 DM-send endpoint is used because it's available at X's Basic API tier
    // for many developer accounts, whereas v2's DM-send endpoints require a
    // higher (Pro+) access tier. If your account can't send DMs at all, X's
    // API returns a clear permissions error below rather than a fake success.
    await client.v1.sendDm({ recipient_id: recipient.data.id, text: lead.generated_dm });
  } catch (err: any) {
    return NextResponse.json({ error: err?.data?.detail || err?.errors?.[0]?.message || err?.message || "X DM send failed." }, { status: 400 });
  }

  await supabase.from("leads").update({ dm_sent: true }).eq("id", leadId);

  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("workspace_id", session.workspaceId)
    .eq("lead_id", leadId)
    .maybeSingle();

  let conversationId = existingConv?.id;
  if (!conversationId) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({
        workspace_id: session.workspaceId,
        lead_id: leadId,
        channel: "x",
        contact_name: lead.name,
        contact_handle: "@" + lead.username,
        contact_type: "lead",
      })
      .select()
      .single();
    conversationId = created?.id;
  }

  if (conversationId) {
    await supabase.from("messages").insert({
      workspace_id: session.workspaceId,
      conversation_id: conversationId,
      sender: "me",
      channel: "x",
      content: lead.generated_dm,
    });
    await supabase.from("conversations").update({ last_active: new Date().toISOString() }).eq("id", conversationId);
  }

  return NextResponse.json({ success: true });
}
