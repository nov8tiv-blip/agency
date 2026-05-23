import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t");
  const url = searchParams.get("url");

  if (token && url) {
    try {
      const recipient = await prisma.emailRecipient.findUnique({
        where: { trackingToken: token },
      });

      if (recipient) {
        await Promise.all([
          prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              clickedAt: recipient.clickedAt ?? new Date(),
              status: "CLICKED",
            },
          }),
          prisma.emailClick.create({
            data: { recipientId: recipient.id, url },
          }),
        ]);
      }
    } catch {
      // Don't fail the redirect
    }

    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Invalid tracking link" }, { status: 400 });
}
