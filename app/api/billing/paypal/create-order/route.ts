import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSessionWorkspaceId } from "@/lib/supabase/server";
import { getPaypalAccessToken, paypalHost, planPrice } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan } = await request.json();
  const amount = planPrice(plan);
  if (!amount) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  let accessToken: string;
  try {
    accessToken = await getPaypalAccessToken();
  } catch (err: any) {
    // Customers can't set server env vars — log the real cause for whoever
    // operates this deployment, and show them something actionable instead.
    console.error("[paypal/create-order] PayPal not configured:", err.message);
    return NextResponse.json({ error: "Payments aren't available yet — please contact support." }, { status: 500 });
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;

  const res = await fetch(`${paypalHost()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `AuraLeads AI — ${plan} plan (monthly)`,
          amount: { currency_code: "USD", value: amount },
        },
      ],
      application_context: {
        // No `plan` param here anymore — capture-order looks up the plan
        // from the payment_orders row recorded just below, never a
        // client-suppliable value on the redirect URL.
        return_url: `${origin}/api/billing/paypal/capture-order`,
        cancel_url: `${origin}/app`,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.message || "Could not create PayPal order." }, { status: 502 });
  }

  const approveUrl = (data.links || []).find((l: any) => l.rel === "approve")?.href;
  if (!approveUrl) return NextResponse.json({ error: "PayPal did not return an approval link." }, { status: 502 });

  // capture-order looks this up instead of trusting a client-supplied plan —
  // same reasoning as the Razorpay flow (see payment_orders migration).
  const supabase = createSupabaseServerClient();
  const { error: recordErr } = await supabase.from("payment_orders").insert({
    workspace_id: session.workspaceId,
    provider: "paypal",
    provider_order_id: data.id,
    plan,
    amount: parseFloat(amount),
    currency: "USD",
  });
  if (recordErr) return NextResponse.json({ error: `Could not record order: ${recordErr.message}` }, { status: 500 });

  return NextResponse.json({ approveUrl, orderId: data.id });
}
