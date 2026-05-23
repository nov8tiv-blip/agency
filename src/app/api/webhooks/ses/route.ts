import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // SNS subscription confirmation
  if (body.Type === "SubscriptionConfirmation") {
    await fetch(body.SubscribeURL);
    return NextResponse.json({ ok: true });
  }

  if (body.Type === "Notification") {
    const message = JSON.parse(body.Message ?? "{}");
    const notifType = message.notificationType;

    if (notifType === "Bounce" && message.bounce) {
      const emails: string[] = message.bounce.bouncedRecipients.map(
        (r: { emailAddress: string }) => r.emailAddress
      );
      await prisma.emailRecipient.updateMany({
        where: { email: { in: emails } },
        data: { status: "BOUNCED", bouncedAt: new Date() },
      });
    }

    if (notifType === "Complaint" && message.complaint) {
      const emails: string[] = message.complaint.complainedRecipients.map(
        (r: { emailAddress: string }) => r.emailAddress
      );
      await prisma.emailRecipient.updateMany({
        where: { email: { in: emails } },
        data: { status: "COMPLAINED" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
