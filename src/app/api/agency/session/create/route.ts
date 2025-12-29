import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/agencyStore";

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase(); // 6 chars
}

export async function POST() {
  // make a unique code
  let code = makeCode();
  while (getSession(code)) code = makeCode();

  const session = createSession(code);

  return NextResponse.json({ ok: true, code: session.code });
}