import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { order: "asc" } }, deal: { select: { name: true } } },
  });

  if (!proposal) notFound();

  const subtotal = Number(proposal.subtotal);
  const discount = Number(proposal.discount);
  const tax = Number(proposal.tax);
  const total = Number(proposal.total);
  const discountAmt = subtotal * (discount / 100);
  const taxAmt = (subtotal - discountAmt) * (tax / 100);

  return (
    <html>
      <head>
        <title>{proposal.title}</title>
        <style>{`
          body { font-family: -apple-system, sans-serif; color: #33475b; margin: 0; padding: 40px; background: white; }
          .header { border-bottom: 3px solid #ff7a59; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 24px; font-weight: 800; color: #2d3e50; }
          .logo span { color: #ff7a59; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          th { background: #f5f8fa; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #516f90; border-bottom: 1px solid #e5e8eb; }
          td { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
          .totals { width: 280px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .grand-total { border-top: 2px solid #2d3e50; padding-top: 10px; font-weight: 800; font-size: 18px; margin-top: 6px; }
          @media print { body { padding: 20px; } }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <div className="logo"><span>Agency</span> CRM</div>
            <div style={{ fontSize: 13, color: "#516f90", marginTop: 4 }}>Proposal</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{proposal.title}</div>
            {proposal.validUntil && (
              <div style={{ fontSize: 12, color: "#516f90", marginTop: 4 }}>
                Valid until {new Date(proposal.validUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {proposal.recipientEmail && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "#516f90", fontWeight: 700, marginBottom: 4 }}>PREPARED FOR</div>
            <div style={{ fontSize: 14 }}>{proposal.recipientEmail}</div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th style={{ textAlign: "center" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Unit Price</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {proposal.lineItems.map((li) => (
              <tr key={li.id}>
                <td style={{ fontWeight: 600 }}>{li.name}</td>
                <td style={{ color: "#516f90" }}>{li.description ?? ""}</td>
                <td style={{ textAlign: "center" }}>{Number(li.quantity)}</td>
                <td style={{ textAlign: "right" }}>${Number(li.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>${Number(li.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="total-row"><span style={{ color: "#516f90" }}>Subtotal</span><span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          {discount > 0 && <div className="total-row"><span style={{ color: "#516f90" }}>Discount ({discount}%)</span><span>-${discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
          {tax > 0 && <div className="total-row"><span style={{ color: "#516f90" }}>Tax ({tax}%)</span><span>${taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
          <div className="total-row grand-total"><span>Total</span><span style={{ color: "#ff7a59" }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
        </div>

        {proposal.notes && (
          <div style={{ marginTop: 40, padding: 16, background: "#f5f8fa", borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Notes</div>
            <div style={{ fontSize: 13, color: "#516f90" }}>{proposal.notes}</div>
          </div>
        )}

        {proposal.signedAt && (
          <div style={{ marginTop: 40, borderTop: "1px solid #e5e8eb", paddingTop: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>SIGNED</div>
            <div style={{ fontSize: 13 }}>{proposal.signatureName} — {new Date(proposal.signedAt).toLocaleDateString()}</div>
          </div>
        )}
      </body>
    </html>
  );
}
