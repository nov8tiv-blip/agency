import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id")!;
  const { stageId } = await req.json();

  const current = await prisma.deal.findUnique({
    where: { id },
    include: { stage: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
  if (!newStage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  const [deal] = await prisma.$transaction([
    prisma.deal.update({
      where: { id },
      data: { stageId, probability: newStage.probability },
      include: { stage: true },
    }),
    prisma.activity.create({
      data: {
        type: "NOTE",
        subject: `Deal moved from "${current.stage.name}" to "${newStage.name}"`,
        dealId: id,
        userId,
      },
    }),
  ]);

  return NextResponse.json(deal);
}
