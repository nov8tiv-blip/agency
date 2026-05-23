import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  linkedinUrl: z.string().optional(),
  companyId: z.string().optional(),
  lifecycleStage: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const stage = searchParams.get("stage");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;

  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(stage ? { lifecycleStage: stage } : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ contacts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const body = await req.json();
  const data = createSchema.parse(body);

  const contact = await prisma.contact.create({
    data: {
      ...data,
      email: data.email || null,
      ownerId: userId,
      lifecycleStage: data.lifecycleStage ?? "lead",
    },
    include: { company: { select: { id: true, name: true } } },
  });

  return NextResponse.json(contact, { status: 201 });
}
