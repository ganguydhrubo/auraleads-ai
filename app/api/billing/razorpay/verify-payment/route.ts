import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";

// Called by the frontend right after Razorpay Checkout's success handler
// fires. This is a convenience path for instant UI feedback — the webhook
// (app/api/webhooks/razorpay) is the source of truth and will independently
// upgrade the plan even if the browser tab closes before this ever runs.
export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const valid = verifyRazorpayPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    console.error("[razorpay/verify-payment] signature mismatch for order", razorpay_order_id);
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // The signature only proves (order_id, payment_id) are a genuine Razorpay
  // pair — it says nothing about which plan was paid for. Never trust a
  // client-supplied plan here; only grant whatever THIS workspace's own
  // pending order for THIS exact order_id was created for.
  const { data: order } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("provider", "razorpay")
    .eq("provider_order_id", razorpay_order_id)
    .eq("workspace_id", session.workspaceId)
    .eq("status", "pending")
    .maybeSingle();

  if (!order) {
    console.error("[razorpay/verify-payment] no matching pending order for", razorpay_order_id, "workspace", session.workspaceId);
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const { error } = await supabase.from("workspaces").update({ plan: order.plan }).eq("id", session.workspaceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("payment_orders").update({ status: "completed" }).eq("id", order.id);

  return NextResponse.json({ success: true, plan: order.plan });
}
