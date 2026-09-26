import crypto from "crypto";

// Placeholder INR pricing — the app's PayPal prices ($20/$50/$100) were a
// business decision made elsewhere; these are a reasonable first pass at
// INR equivalents, NOT a precise FX conversion. Confirm/adjust before
// relying on this for real Live-mode charges.
const PLAN_PRICES_INR_PAISE: Record<string, number> = {
  Silver: 149900,
  Gold: 399900,
  Platinum: 799900,
};

export function planPriceInrPaise(plan: string): number | null {
  return PLAN_PRICES_INR_PAISE[plan] ?? null;
}

function razorpayAuthHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay isn't configured — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.");
  }
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string }> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: razorpayAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || "Could not create Razorpay order.");
  return data;
}

// Every AuraLeads order is tagged with notes.product = "auraleads" at
// creation (see create-order route) specifically so the webhook handler can
// tell an AuraLeads payment apart from any other business sharing this same
// Razorpay account/webhook — Razorpay webhooks are account-wide, not
// scoped to one integration.
export const RAZORPAY_PRODUCT_TAG = "auraleads";

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
