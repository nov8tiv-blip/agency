import { NextResponse } from "next/server";
import { updateSessionSettings } from "@/lib/agency/store";
import type { SessionSettings } from "@/lib/agency/types";

type Body = {
  sessionId: string;
  settings: Partial<SessionSettings>;
};

export async function POST(req: Request) {
  let body: Body;

  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId, settings } = body;

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Missing settings" }, { status: 400 });
  }

  const session = updateSessionSettings(sessionId, settings);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session }, { status: 200 });
}
