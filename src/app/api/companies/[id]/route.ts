import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: {
      contacts: {
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
      },
      deals: {
        where: { deletedAt: null },
        include: { stage: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const data = await req.json();

  const company = await prisma.company.update({ where: { id }, data });
  return NextResponse.json(company);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
