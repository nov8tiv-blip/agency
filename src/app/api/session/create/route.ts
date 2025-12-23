import { NextResponse } from "next/server";
import { createSession } from "@/lib/agency/store";
export async function POST() {
  const session = createSession();
  return NextResponse.json({ session });
}