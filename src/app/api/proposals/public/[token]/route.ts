import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    include: { lineItems: { orderBy: { order: "asc" } } },
  });

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark as viewed
  if (!proposal.viewedAt) {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        viewedAt: new Date(),
        status: proposal.status === "SENT" ? "VIEWED" : proposal.status,
      },
    });
  }

  return NextResponse.json(proposal);
}
