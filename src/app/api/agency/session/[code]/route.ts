import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/agencyStore";

export async function GET(
  _req: Request,
  ctx: { params: { code: string } | Promise<{ code: string }> }
) {
  // Works for BOTH: params object OR params Promise (your setup)
  const params = await Promise.resolve(ctx.params);
  const raw = params?.code;

  const code = (raw || "").trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  let session = getSession(code);

  // DEV: auto-create if missing (polling / direct links)
  if (!session) {
    session = createSession(code);
  }

  return NextResponse.json({ session });
}
