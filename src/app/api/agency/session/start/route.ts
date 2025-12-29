export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { startSession } from "@/lib/agency/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const sessionId = (body?.sessionId || "").trim();
  const hostId = (body?.hostId || "").trim(); // optional, but enables host-only start

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const result = startSession(sessionId, hostId || undefined);

  // ✅ Handle errors FIRST (before checking result.session)
  if (result.error) {
    const msg = result.error;

    // Choose status codes based on message (simple + practical)
    if (msg === "Session not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    if (msg === "Only host can start") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    if (msg === "Invalid player count") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // fallback
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!result.session) {
    // should not happen if result.error is handled correctly, but keep it safe
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session: result.session });
}
