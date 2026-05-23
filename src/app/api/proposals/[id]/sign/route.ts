import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadBuffer } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { signatureName, signatureDataUrl } = await req.json();

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let signatureS3Key: string | undefined;

  if (signatureDataUrl) {
    const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    signatureS3Key = `proposals/${id}/signature.png`;
    await uploadBuffer(signatureS3Key, buffer, "image/png");
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown";

  await prisma.proposal.update({
    where: { id },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      signatureName,
      signatureIp: ip,
      signatureS3Key: signatureS3Key ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
