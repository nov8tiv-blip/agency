import { NextResponse } from "next/server";
import { getSession, setSessionCase } from "@/lib/agencyStore";
import { getCaseById } from "@/lib/cases";

export async function POST(
  req: Request,
  ctx: { params: { code: string } }
) {
  const raw = ctx.params.code;
  const code = (raw || "").trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const session = getSession(code, { createIfMissing: true });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const caseId = String(body.caseId || "").trim();

  if (!caseId) {
    return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
  }

  const c = getCaseById(caseId);
  if (!c) {
    return NextResponse.json({ error: "Invalid caseId" }, { status: 400 });
  }

  const updated = setSessionCase(code, caseId);
  return NextResponse.json({ session: updated });
}