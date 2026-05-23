import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  amount: z.number().optional(),
  closeDate: z.string().optional(),
  stageId: z.string(),
  pipelineId: z.string(),
  companyId: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId");

  const deals = await prisma.deal.findMany({
    where: {
      deletedAt: null,
      ...(pipelineId ? { pipelineId } : {}),
    },
    include: {
      stage: true,
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      _count: { select: { contacts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const body = await req.json();
  const data = createSchema.parse(body);

  const deal = await prisma.deal.create({
    data: {
      ...data,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      ownerId: userId,
    },
    include: {
      stage: true,
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(deal, { status: 201 });
}
