import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!proposal.recipientEmail) {
    return NextResponse.json({ error: "No recipient email set" }, { status: 400 });
  }

  const signLink = `${appUrl}/sign/${proposal.publicToken}`;

  await sendEmail({
    to: proposal.recipientEmail,
    subject: `Proposal: ${proposal.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#2d3e50;">You've received a proposal</h2>
        <p>Please review and sign the proposal: <strong>${proposal.title}</strong></p>
        <a href="${signLink}" style="display:inline-block;background:#ff7a59;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">
          View & Sign Proposal
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">
          ${proposal.validUntil ? `This proposal expires on ${new Date(proposal.validUntil).toLocaleDateString()}.` : ""}
        </p>
      </div>
    `,
  });

  await prisma.proposal.update({
    where: { id },
    data: { status: "SENT" },
  });

  return NextResponse.json({ ok: true });
}
