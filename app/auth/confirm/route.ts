import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Handles every emailed auth link (signup confirmation, password recovery,
// invite, magic link) server-side via token_hash + verifyOtp. This works
// regardless of which browser/device opens the link — unlike a client-side
// PKCE code exchange, which requires the *same browser* that initiated the
// request to still have the code verifier in storage (breaks the moment
// someone opens the email on their phone after requesting from a laptop).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/app";

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/reset-password?error=invalid_link", request.url));
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error || !data.user) {
    const dest = type === "recovery" ? "/reset-password" : "/login";
    return NextResponse.redirect(new URL(`${dest}?error=${encodeURIComponent(error?.message || "invalid_link")}`, request.url));
  }

  // Signup confirmations land a brand-new user here with no workspace yet —
  // bootstrap one now so /app isn't empty of even a workspace row.
  if (type === "signup" || type === "invite" || type === "email") {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!membership) {
      const admin = createSupabaseAdminClient();
      await admin.rpc("bootstrap_workspace", {
        p_user_id: data.user.id,
        p_workspace_name: data.user.email?.split("@")[0] || "My Workspace",
      });
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
