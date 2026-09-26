import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyRazorpayWebhookSignature, RAZORPAY_PRODUCT_TAG } from "@/lib/razorpay";

// Razorpay webhooks are configured per ACCOUNT, not per website/app — if
// this Razorpay account is ever shared with another business (it currently
// is, with Ropes), this endpoint will receive that business's events too.
// Every event that isn't tagged notes.product === "auraleads" (set at order
// creation — see create-order route) is acknowledged and silently ignored
// rather than processed, so a Ropes payment can never touch an AuraLeads
// workspace.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.error("[webhooks/razorpay] invalid or missing signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const paymentEntity = event.payload?.payment?.entity;

  if (!paymentEntity || paymentEntity.notes?.product !== RAZORPAY_PRODUCT_TAG) {
    // Not ours (a different business on this account, or an event type with
    // no payment entity, e.g. a subscription event we don't act on yet).
    return NextResponse.json({ ignored: true });
  }

  const workspaceId = paymentEntity.notes?.workspace_id;
  const plan = paymentEntity.notes?.plan;

  if (event.event === "payment.captured" && workspaceId && ["Silver", "Gold", "Platinum"].includes(plan)) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("workspaces").update({ plan }).eq("id", workspaceId);
    if (error) {
      console.error("[webhooks/razorpay] failed to upgrade workspace:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Keep the audit trail consistent whether the upgrade happened via the
    // instant verify-payment path or this webhook (e.g. tab closed early).
    await supabase
      .from("payment_orders")
      .update({ status: "completed" })
      .eq("provider", "razorpay")
      .eq("provider_order_id", paymentEntity.order_id)
      .eq("workspace_id", workspaceId);
  } else if (event.event === "payment.failed") {
    console.error(`[webhooks/razorpay] payment failed for workspace ${workspaceId}, plan ${plan}`);
  }

  return NextResponse.json({ received: true });
}
