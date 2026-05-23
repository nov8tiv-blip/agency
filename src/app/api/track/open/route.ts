import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRANSPARENT_GIF } from "@/lib/tracking";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("t");

  if (token) {
    try {
      await prisma.emailRecipient.updateMany({
        where: { trackingToken: token, openedAt: null },
        data: {
          openedAt: new Date(),
          status: "OPENED",
        },
      });
    } catch {
      // Don't fail the request if tracking update fails
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
