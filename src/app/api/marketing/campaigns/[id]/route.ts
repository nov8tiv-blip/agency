import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      recipients: {
        include: { contact: { select: { firstName: true, lastName: true } } },
        orderBy: { email: "asc" },
      },
      _count: { select: { recipients: true } },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const { recipients, ...campaignData } = data;

  const campaign = await prisma.$transaction(async (tx) => {
    const updated = await tx.campaign.update({
      where: { id },
      data: campaignData,
    });

    if (recipients !== undefined) {
      await tx.emailRecipient.deleteMany({ where: { campaignId: id, status: "PENDING" } });

      if (recipients.length > 0) {
        await tx.emailRecipient.createMany({
          data: recipients.map((r: { email: string; contactId?: string }) => ({
            campaignId: id,
            email: r.email,
            contactId: r.contactId ?? null,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  });

  return NextResponse.json(campaign);
}
