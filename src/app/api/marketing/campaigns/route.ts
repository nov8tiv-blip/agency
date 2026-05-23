import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: { _count: { select: { recipients: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const campaign = await prisma.campaign.create({
    data: {
      name: body.name ?? "Untitled Campaign",
      subject: body.subject ?? "",
      fromName: body.fromName ?? "",
      fromEmail: body.fromEmail ?? "",
      bodyHtml: body.bodyHtml ?? "<p>Write your email here.</p>",
      bodyText: body.bodyText ?? "",
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
