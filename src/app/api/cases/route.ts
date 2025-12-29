// src/app/api/cases/route.ts
import { NextResponse } from "next/server";
import { CASES } from "@/lib/cases";

export async function GET() {
  return NextResponse.json({ cases: CASES });
}