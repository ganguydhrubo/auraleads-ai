import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/supabase/server";

// The Meta webhook verify token is a platform-wide constant (checked by our
// own webhook handlers against the same env var) — not a per-workspace
// secret, so any authenticated customer configuring their own Meta App's
// webhook needs to see the real value, not an env-var name they can't set.
export async function GET() {
  const session = await getSessionWorkspaceId();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  return NextResponse.json({ verifyToken: process.env.META_VERIFY_TOKEN || "auraleads_wh_token" });
}
