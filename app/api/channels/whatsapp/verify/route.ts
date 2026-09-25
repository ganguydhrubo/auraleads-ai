import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";

// Verifies real WhatsApp Business Cloud API credentials (Meta Graph API) and,
// on success, persists them so /send and the inbound webhook can use them.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { phoneNumberId, businessAccountId, accessToken } = await request.json();
  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: "phoneNumberId and accessToken are required" }, { status: 400 });
  }

  let verifyRes: Response;
  try {
    verifyRes = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name&access_token=${encodeURIComponent(accessToken)}`
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Could not reach Meta Graph API: ${err.message}` }, { status: 502 });
  }

  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) {
    return NextResponse.json({ error: verifyData?.error?.message || "WhatsApp credential verification failed." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("whatsapp")
    .eq("workspace_id", session.workspaceId)
    .maybeSingle();

  const { error: upsertError } = await supabase.from("workspace_settings").upsert({
    workspace_id: session.workspaceId,
    whatsapp: {
      ...(current?.whatsapp || {}),
      connected: true,
      phoneNumberId,
      businessAccountId,
      accessToken,
      displayPhone: verifyData.display_phone_number,
      webhookConfigured: true,
      verifyToken: process.env.META_VERIFY_TOKEN || "auraleads_wh_token",
    },
  });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ success: true, displayPhone: verifyData.display_phone_number });
}
