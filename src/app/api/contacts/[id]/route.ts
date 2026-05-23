import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  lifecycleStage: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, deletedAt: null },
    include: {
      company: { select: { id: true, name: true } },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
      notes: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      deals: {
        include: {
          deal: {
            include: { stage: true },
          },
        },
      },
    },
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const data = updateSchema.parse(body);

  const contact = await prisma.contact.update({
    where: { id },
    data,
    include: { company: { select: { id: true, name: true } } },
  });

  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
