import { NextResponse } from "next/server";
import { joinSession } from "@/lib/agencyStore";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = (body?.code || "").toString();
  const codename = (body?.codename || "").toString();

  if (!code || !codename) {
    return NextResponse.json(
      { error: "Missing code or name" },
      { status: 400 }
    );
  }

  const result = joinSession(code, codename);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true, session: result.session });
}