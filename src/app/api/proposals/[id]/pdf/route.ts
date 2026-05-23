import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePdf } from "@/lib/pdf";
import { uploadBuffer, getPresignedUrl } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const renderUrl = `${appUrl}/proposals/${id}/preview?print=1`;
  const pdf = await generatePdf(renderUrl);

  const s3Key = `proposals/${id}/proposal.pdf`;
  await uploadBuffer(s3Key, pdf, "application/pdf");

  await prisma.proposal.update({ where: { id }, data: { pdfS3Key: s3Key } });

  const url = await getPresignedUrl(s3Key, 900);
  return NextResponse.json({ url });
}
