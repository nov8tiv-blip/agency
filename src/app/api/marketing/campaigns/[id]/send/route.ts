import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { injectTracking, resolveMergeTags } from "@/lib/tracking";

type Params = { params: Promise<{ id: string }> };

const BATCH_SIZE = 14; // SES default ~14/sec
const BATCH_DELAY_MS = 1000;

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { recipients: { where: { status: "PENDING" } } },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (campaign.status === "SENT") {
    return NextResponse.json({ error: "Already sent" }, { status: 400 });
  }

  await prisma.campaign.update({ where: { id }, data: { status: "SENDING" } });

  // Fire-and-forget (no await) so the response returns immediately
  sendBatches(campaign).catch(console.error);

  return NextResponse.json({ ok: true, message: "Sending started" });
}

async function sendBatches(campaign: {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  bodyText?: string | null;
  recipients: { id: string; email: string; trackingToken: string }[];
}) {
  const recipients = campaign.recipients;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (recipient) => {
        const personalizedHtml = resolveMergeTags(campaign.bodyHtml, {
          email: recipient.email,
        });
        const trackedHtml = injectTracking(personalizedHtml, recipient.trackingToken);

        try {
          const messageId = await sendEmail({
            to: recipient.email,
            subject: campaign.subject,
            html: trackedHtml,
            text: campaign.bodyText ?? undefined,
            fromName: campaign.fromName,
            from: campaign.fromEmail,
          });

          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: { status: "SENT", messageId, sentAt: new Date() },
          });
        } catch (err) {
          console.error(`Failed to send to ${recipient.email}:`, err);
          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: { status: "BOUNCED", bouncedAt: new Date() },
          });
        }
      })
    );

    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "SENT", sentAt: new Date() },
  });
}
