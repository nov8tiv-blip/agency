import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
  gmailUser: string;
  gmailAppPassword: string;
  replyTo?: string;
}

export async function POST(req: NextRequest) {
  const body: SendEmailRequest = await req.json();
  const { to, subject, html, text, gmailUser, gmailAppPassword, replyTo } = body;

  if (!gmailUser || !gmailAppPassword) {
    return NextResponse.json({ error: "Gmail credentials not configured. Please add them in Settings." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  try {
    await transporter.sendMail({
      from: `"${gmailUser}" <${gmailUser}>`,
      to,
      replyTo: replyTo || gmailUser,
      subject,
      html,
      text,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
