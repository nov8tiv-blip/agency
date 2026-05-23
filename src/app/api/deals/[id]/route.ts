import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const deal = await prisma.deal.findFirst({
    where: { id, deletedAt: null },
    include: {
      stage: true,
      pipeline: { include: { stages: { orderBy: { order: "asc" } } } },
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      contacts: {
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
      notes: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      proposals: {
        select: { id: true, title: true, status: true, total: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...data,
      closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
    },
    include: { stage: true },
  });

  return NextResponse.json(deal);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
