import { NextRequest, NextResponse } from "next/server";
import { initialAppState } from "@/lib/store/initial-data";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    if (supabaseAdmin) {
      const { data: workspaces, error: wsErr } = await supabaseAdmin
        .from("workspaces")
        .select("*")
        .limit(1);

      const { data: leads, error: leadsErr } = await supabaseAdmin
        .from("leads")
        .select("*")
        .limit(50);

      if (!wsErr && workspaces && workspaces.length > 0) {
        return NextResponse.json({
          success: true,
          source: "supabase",
          workspace: workspaces[0],
          leads: leads || [],
          serverTime: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      source: "memory-fallback",
      data: initialAppState,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (supabaseAdmin && body.workspace) {
      await supabaseAdmin.from("workspaces").upsert({
        id: body.workspace.id || undefined,
        name: body.workspace.name || "Default Workspace",
        plan: body.workspace.plan || "trial",
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      receivedKeys: Object.keys(body),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}