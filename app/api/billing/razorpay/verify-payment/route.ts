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

  const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
  if (!plan || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }
  if (!["Silver", "Gold", "Platinum"].includes(plan)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const valid = verifyRazorpayPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    console.error("[razorpay/verify-payment] signature mismatch for order", razorpay_order_id);
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("workspaces").update({ plan }).eq("id", session.workspaceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
