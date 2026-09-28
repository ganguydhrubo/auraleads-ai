import { SupabaseClient } from "@supabase/supabase-js";

export async function upsertConversationAndMessage(
  supabase: SupabaseClient,
  workspaceId: string,
  leadId: string,
  channel: string,
  contactName: string,
  contactHandle: string,
  text: string
) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", leadId)
    .maybeSingle();

  let conversationId = existing?.id;
  if (!conversationId) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({ workspace_id: workspaceId, lead_id: leadId, channel, contact_name: contactName, contact_handle: contactHandle, contact_type: "lead" })
      .select()
      .single();
    conversationId = created?.id;
  }

  if (conversationId) {
    await supabase.from("messages").insert({ workspace_id: workspaceId, conversation_id: conversationId, sender: "me", channel, content: text });
    await supabase.from("conversations").update({ last_active: new Date().toISOString() }).eq("id", conversationId);
  }
}
