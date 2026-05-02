import type { Client, Project, Proposal, AppSettings } from "./types";

// ─── Proposal email ───────────────────────────────────────────────────────────

export function proposalEmailHtml(
  client: Client,
  project: Project,
  proposal: Proposal,
  settings: AppSettings
): { subject: string; html: string; text: string } {
  const co = settings.company;
  const subject = `Your Fencing Proposal - ${co.name} (Proposal #${proposal.proposalNumber})`;
  const validUntil = new Date(proposal.validUntil).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background:#1a365d;color:white;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:24px;">${co.name}</h1>
    <p style="margin:4px 0 0;opacity:0.8;">${co.phone} &bull; ${co.email}</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <p>Dear ${client.firstName},</p>
    <p>Thank you for the opportunity to provide you with a fencing proposal for your project. We are excited to help you with your fencing needs!</p>

    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:20px 0;">
      <h3 style="margin:0 0 12px;color:#1a365d;">Proposal Summary</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#666;">Proposal #:</td><td style="padding:4px 0;font-weight:bold;">${proposal.proposalNumber}</td></tr>
        <tr><td style="padding:4px 0;color:#666;">Project:</td><td style="padding:4px 0;">${project.name}</td></tr>
        <tr><td style="padding:4px 0;color:#666;">Valid Until:</td><td style="padding:4px 0;">${validUntil}</td></tr>
        <tr style="border-top:2px solid #1a365d;margin-top:8px;">
          <td style="padding:12px 0 4px;font-size:18px;font-weight:bold;color:#1a365d;">Total:</td>
          <td style="padding:12px 0 4px;font-size:18px;font-weight:bold;color:#1a365d;">$${proposal.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;">Deposit Required:</td>
          <td style="padding:4px 0;">$${proposal.depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${proposal.depositPercent}%)</td>
        </tr>
      </table>
    </div>

    ${proposal.notes ? `<p><strong>Notes:</strong> ${proposal.notes}</p>` : ""}

    <p style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:12px;font-size:14px;"><strong>To approve this proposal,</strong> please reply to this email or call us at ${co.phone}. Your deposit can be paid by check, credit card, or bank transfer.</p>

    <p>We look forward to working with you!</p>
    <p style="margin:0;">Sincerely,<br/><strong>${co.name}</strong><br/>${co.phone}<br/>${co.email}${co.website ? `<br/>${co.website}` : ""}</p>

    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;"/>
    <p style="font-size:12px;color:#999;">${proposal.terms}</p>
  </div>
</body>
</html>`;

  const text = `Dear ${client.firstName},

Thank you for the opportunity to provide a fencing proposal.

Proposal #${proposal.proposalNumber}
Project: ${project.name}
Total: $${proposal.total.toFixed(2)}
Deposit: $${proposal.depositAmount.toFixed(2)} (${proposal.depositPercent}%)
Valid Until: ${validUntil}

${proposal.notes || ""}

To approve this proposal, reply to this email or call ${co.phone}.

${co.name}
${co.phone}
${co.email}

${proposal.terms}`;

  return { subject, html, text };
}

// ─── Follow-up email ──────────────────────────────────────────────────────────

export function followUpEmailHtml(
  client: Client,
  settings: AppSettings,
  customMessage?: string
): { subject: string; html: string; text: string } {
  const co = settings.company;
  const subject = `Following Up - ${co.name}`;

  const message =
    customMessage ||
    `We wanted to follow up regarding your fencing project. We would love to answer any questions you may have about your proposal or the project details.`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background:#1a365d;color:white;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:24px;">${co.name}</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <p>Dear ${client.firstName},</p>
    <p>${message}</p>
    <p>Please feel free to reach out at any time:</p>
    <ul>
      <li>Phone: ${co.phone}</li>
      <li>Email: ${co.email}</li>
    </ul>
    <p>We look forward to hearing from you!</p>
    <p>Sincerely,<br/><strong>${co.name}</strong></p>
  </div>
</body>
</html>`;

  const text = `Dear ${client.firstName},\n\n${message}\n\nPhone: ${co.phone}\nEmail: ${co.email}\n\nSincerely,\n${co.name}`;

  return { subject, html, text };
}

// ─── Job complete / review request ───────────────────────────────────────────

export function reviewRequestEmailHtml(
  client: Client,
  settings: AppSettings
): { subject: string; html: string; text: string } {
  const co = settings.company;
  const subject = `Thank You - We'd Love Your Review! - ${co.name}`;
  const { yelpUrl, googleReviewUrl } = settings.integrations;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background:#1a365d;color:white;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:24px;">${co.name}</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <p>Dear ${client.firstName},</p>
    <p>Thank you so much for choosing <strong>${co.name}</strong> for your fencing project! We hope you are thrilled with the results.</p>
    <p>Your satisfaction is our top priority. If there is anything at all that needs attention, please do not hesitate to contact us and we will make it right.</p>
    <p>If you are happy with our work, we would greatly appreciate if you could take a moment to leave us a review. It helps us serve more customers like you!</p>

    <div style="text-align:center;margin:24px 0;">
      ${googleReviewUrl ? `<a href="${googleReviewUrl}" style="display:inline-block;background:#4285f4;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:0 8px;">⭐ Review on Google</a>` : ""}
      ${yelpUrl ? `<a href="${yelpUrl}" style="display:inline-block;background:#d32323;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:0 8px;">⭐ Review on Yelp</a>` : ""}
    </div>

    <p>Thank you again for your business. We hope to be your trusted fencing contractor for years to come!</p>
    <p>Warm regards,<br/><strong>${co.name}</strong><br/>${co.phone}<br/>${co.email}</p>
  </div>
</body>
</html>`;

  const text = `Dear ${client.firstName},\n\nThank you for choosing ${co.name}!\n\n${googleReviewUrl ? `Google Review: ${googleReviewUrl}\n` : ""}${yelpUrl ? `Yelp Review: ${yelpUrl}\n` : ""}\n\nThank you!\n${co.name}`;

  return { subject, html, text };
}

// ─── Thank you letter ─────────────────────────────────────────────────────────

export function thankYouLetterHtml(
  client: Client,
  settings: AppSettings
): { subject: string; html: string; text: string } {
  const co = settings.company;
  const subject = `Thank You for Your Business - ${co.name}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background:#1a365d;color:white;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:24px;">${co.name}</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <p>Dear ${client.firstName},</p>
    <p>On behalf of the entire team at <strong>${co.name}</strong>, we sincerely thank you for choosing us for your fencing project. It was a pleasure working with you!</p>
    <p>Your new fence has been installed with the highest quality materials and craftsmanship. We stand behind our work, and if you ever have any questions or concerns, please do not hesitate to contact us.</p>
    <p>We would love to earn your referrals! If you know of anyone who needs fencing, we would be honored if you shared our name.</p>
    <p>With appreciation,<br/><strong>${co.name}</strong><br/>${co.phone}<br/>${co.email}${co.website ? `<br/>${co.website}` : ""}</p>
  </div>
</body>
</html>`;

  const text = `Dear ${client.firstName},\n\nThank you for choosing ${co.name} for your fencing project!\n\nSincerely,\n${co.name}\n${co.phone}`;

  return { subject, html, text };
}
