import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "TASK"]),
  subject: z.string().min(1),
  body: z.string().optional(),
  durationMin: z.number().optional(),
  outcome: z.string().optional(),
  direction: z.string().optional(),
  occurredAt: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id: contactId } = await params;
  const userId = req.headers.get("x-user-id")!;
  const body = await req.json();
  const data = createSchema.parse(body);

  const activity = await prisma.activity.create({
    data: {
      ...data,
      contactId,
      userId,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(activity, { status: 201 });
}
