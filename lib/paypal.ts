const PLAN_PRICES: Record<string, string> = {
  Silver: "20.00",
  Gold: "50.00",
  Platinum: "100.00",
};

export function planPrice(plan: string): string | null {
  return PLAN_PRICES[plan] || null;
}

function paypalHost(): string {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export async function getPaypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal isn't configured — add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to your environment.");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${paypalHost()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Could not authenticate with PayPal.");
  const data = await res.json();
  return data.access_token;
}

export { paypalHost };
