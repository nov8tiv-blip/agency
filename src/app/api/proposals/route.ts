import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    include: { deal: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const proposal = await prisma.proposal.create({
    data: {
      title: body.title ?? "Untitled Proposal",
      dealId: body.dealId ?? null,
      recipientEmail: body.recipientEmail ?? null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
    },
    include: { lineItems: true, deal: { select: { id: true, name: true } } },
  });

  return NextResponse.json(proposal, { status: 201 });
}
