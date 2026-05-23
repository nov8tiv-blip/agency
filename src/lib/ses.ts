import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.SES_REGION ?? process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<string> {
  const fromAddress = opts.from ?? process.env.SES_FROM_EMAIL ?? "noreply@example.com";
  const fromDisplay = opts.fromName
    ? `${opts.fromName} <${fromAddress}>`
    : fromAddress;

  const toAddresses = Array.isArray(opts.to) ? opts.to : [opts.to];

  const result = await ses.send(
    new SendEmailCommand({
      Source: fromDisplay,
      Destination: { ToAddresses: toAddresses },
      ReplyToAddresses: opts.replyTo ? [opts.replyTo] : undefined,
      Message: {
        Subject: { Data: opts.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: opts.html, Charset: "UTF-8" },
          Text: { Data: opts.text ?? "", Charset: "UTF-8" },
        },
      },
    })
  );

  return result.MessageId ?? "";
}
