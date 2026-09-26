import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { getPaypalAccessToken, paypalHost } from "@/lib/paypal";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  if (!token) {
    return NextResponse.redirect(new URL("/app?billing=error", request.url));
  }

  const supabase = createSupabaseServerClient();

  // Never trust a client-suppliable plan (it was previously a query param
  // on this very URL) — only grant whatever THIS workspace's own pending
  // order for THIS exact token was actually created for.
  const { data: order } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("provider", "paypal")
    .eq("provider_order_id", token)
    .eq("workspace_id", session.workspaceId)
    .eq("status", "pending")
    .maybeSingle();

  if (!order) {
    console.error("[paypal/capture-order] no matching pending order for", token, "workspace", session.workspaceId);
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

    const { error } = await supabase.from("workspaces").update({ plan: order.plan }).eq("id", session.workspaceId);
    if (error) return NextResponse.redirect(new URL("/app?billing=error", request.url));

    await supabase.from("payment_orders").update({ status: "completed" }).eq("id", order.id);

    return NextResponse.redirect(new URL("/app?billing=success", request.url));
  } catch {
    return NextResponse.redirect(new URL("/app?billing=error", request.url));
  }
}
