import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { createRazorpayOrder, planPriceInrPaise, RAZORPAY_PRODUCT_TAG } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan } = await request.json();
  const amountPaise = planPriceInrPaise(plan);
  if (!amountPaise) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return NextResponse.json({ error: "Payments aren't available yet — please contact support." }, { status: 500 });
  }

  try {
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: `${session.workspaceId}_${plan}_${Date.now()}`,
      notes: { product: RAZORPAY_PRODUCT_TAG, workspace_id: session.workspaceId, plan },
    });

    // Recorded here, server-side, at the price we actually quoted — verify-payment
    // trusts THIS row for which plan to grant, never whatever the client claims.
    const supabase = createSupabaseServerClient();
    const { error: recordErr } = await supabase.from("payment_orders").insert({
      workspace_id: session.workspaceId,
      provider: "razorpay",
      provider_order_id: order.id,
      plan,
      amount: amountPaise,
      currency: "INR",
    });
    if (recordErr) throw new Error(`Could not record order: ${recordErr.message}`);

    return NextResponse.json({ orderId: order.id, amountPaise, keyId });
  } catch (err: any) {
    console.error("[razorpay/create-order] failed:", err.message);
    return NextResponse.json({ error: "Payments aren't available yet — please contact support." }, { status: 500 });
  }
}
