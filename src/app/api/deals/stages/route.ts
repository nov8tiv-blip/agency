import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pipeline = await prisma.pipeline.findFirst({
    where: { isDefault: true },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  if (!pipeline) return NextResponse.json([]);

  return NextResponse.json(
    pipeline.stages.map((s) => ({ ...s, pipelineId: pipeline.id }))
  );
}
