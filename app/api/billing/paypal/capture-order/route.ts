import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { getPaypalAccessToken, paypalHost } from "@/lib/paypal";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const plan = url.searchParams.get("plan");

  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  if (!token || !plan || !["Silver", "Gold", "Platinum"].includes(plan)) {
    return NextResponse.redirect(new URL("/app?billing=error", request.url));
  }

  try {
    const accessToken = await getPaypalAccessToken();
    const res = await fetch(`${paypalHost()}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (!res.ok || data.status !== "COMPLETED") {
      return NextResponse.redirect(new URL("/app?billing=error", request.url));
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("workspaces").update({ plan }).eq("id", session.workspaceId);
    if (error) return NextResponse.redirect(new URL("/app?billing=error", request.url));

    return NextResponse.redirect(new URL("/app?billing=success", request.url));
  } catch {
    return NextResponse.redirect(new URL("/app?billing=error", request.url));
  }
}
