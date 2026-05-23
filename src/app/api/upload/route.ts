import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  entityType: z.string(),
  entityId: z.string(),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const body = schema.parse(await req.json());

  const s3Key = `attachments/${body.entityType}/${body.entityId}/${Date.now()}-${body.fileName}`;
  const uploadUrl = await getPresignedUploadUrl(s3Key, body.mimeType);

  const attachment = await prisma.attachment.create({
    data: {
      ...body,
      s3Key,
      uploadedBy: userId,
    },
  });

  return NextResponse.json({ uploadUrl, attachment });
}
