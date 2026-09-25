import { NextRequest, NextResponse } from "next/server";
import { initialAppState } from "@/lib/store/initial-data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: initialAppState,
    serverTime: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      receivedKeys: Object.keys(body),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}