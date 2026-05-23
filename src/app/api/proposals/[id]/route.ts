import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { order: "asc" } },
      deal: { select: { id: true, name: true } },
    },
  });

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const { lineItems, ...proposalData } = body;

  // Recalculate totals from line items
  const items: { name: string; description?: string; quantity: number; unitPrice: number; order: number }[] =
    lineItems ?? [];

  const subtotal = items.reduce((sum: number, li) => sum + li.quantity * li.unitPrice, 0);
  const discount = parseFloat(proposalData.discount ?? 0);
  const tax = parseFloat(proposalData.tax ?? 0);
  const discountAmt = subtotal * (discount / 100);
  const taxAmt = (subtotal - discountAmt) * (tax / 100);
  const total = subtotal - discountAmt + taxAmt;

  const proposal = await prisma.$transaction(async (tx) => {
    // Delete existing line items and recreate
    await tx.lineItem.deleteMany({ where: { proposalId: id } });

    const created = await tx.proposal.update({
      where: { id },
      data: {
        title: proposalData.title,
        recipientEmail: proposalData.recipientEmail ?? null,
        validUntil: proposalData.validUntil ? new Date(proposalData.validUntil) : null,
        notes: proposalData.notes ?? null,
        discount: new Decimal(discount),
        tax: new Decimal(tax),
        subtotal: new Decimal(subtotal),
        total: new Decimal(total),
        lineItems: {
          create: items.map((li, i) => ({
            name: li.name,
            description: li.description ?? null,
            quantity: new Decimal(li.quantity),
            unitPrice: new Decimal(li.unitPrice),
            total: new Decimal(li.quantity * li.unitPrice),
            order: i,
          })),
        },
      },
      include: {
        lineItems: { orderBy: { order: "asc" } },
        deal: { select: { id: true, name: true } },
      },
    });

    return created;
  });

  return NextResponse.json(proposal);
}
