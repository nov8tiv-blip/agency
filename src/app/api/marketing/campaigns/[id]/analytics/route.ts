import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [recipients, clicks] = await Promise.all([
    prisma.emailRecipient.findMany({ where: { campaignId: id } }),
    prisma.emailClick.findMany({
      where: { recipient: { campaignId: id } },
      select: { url: true },
    }),
  ]);

  const sent = recipients.filter((r) => r.status !== "PENDING").length;
  const opened = recipients.filter((r) => r.openedAt !== null).length;
  const clicked = recipients.filter((r) => r.clickedAt !== null).length;
  const bounced = recipients.filter((r) => r.status === "BOUNCED").length;

  // Aggregate click URLs
  const urlCounts: Record<string, number> = {};
  for (const c of clicks) {
    urlCounts[c.url] = (urlCounts[c.url] ?? 0) + 1;
  }
  const clicksByUrl = Object.entries(urlCounts)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    sent,
    opened,
    clicked,
    bounced,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    clicks: clicksByUrl,
    recipients,
  });
}
