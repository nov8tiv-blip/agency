"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

interface LineItem {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  recipientEmail: string;
  validUntil: string;
  notes: string;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
  lineItems: LineItem[];
  deal?: { name: string };
}

export default function ProposalBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ title: "", recipientEmail: "", validUntil: "", notes: "", discount: "0", tax: "0" });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/proposals/${id}`)
      .then((r) => r.json())
      .then((p: Proposal) => {
        setProposal(p);
        setLineItems(p.lineItems.map((li) => ({ ...li, quantity: Number(li.quantity), unitPrice: Number(li.unitPrice) })));
        setForm({
          title: p.title,
          recipientEmail: p.recipientEmail ?? "",
          validUntil: p.validUntil ? p.validUntil.split("T")[0] : "",
          notes: p.notes ?? "",
          discount: String(p.discount ?? 0),
          tax: String(p.tax ?? 0),
        });
      });
  }, [id]);

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const discountAmt = subtotal * (parseFloat(form.discount) / 100);
  const taxAmt = (subtotal - discountAmt) * (parseFloat(form.tax) / 100);
  const total = subtotal - discountAmt + taxAmt;

  const save = useCallback(async () => {
    setSaving(true);
    await fetch(`/api/proposals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lineItems }),
    });
    setSaving(false);
  }, [id, form, lineItems]);

  const send = async () => {
    await save();
    setSending(true);
    const res = await fetch(`/api/proposals/${id}/send`, { method: "POST" });
    if (res.ok) alert("Proposal sent!");
    setSending(false);
  };

  const addItem = () => setLineItems([...lineItems, { name: "", description: "", quantity: 1, unitPrice: 0 }]);
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[i] = { ...updated[i], [field]: value };
    setLineItems(updated);
  };
  const removeItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));

  if (!proposal) return <div style={{ padding: 32, color: "var(--hs-text-light)" }}>Loading...</div>;

  return (
    <div>
      <PageHeader
        title={form.title || "Proposal"}
        subtitle={proposal.deal?.name}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.back()} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>← Back</button>
            <button onClick={() => window.open(`/proposals/${id}/preview`, "_blank")} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>👁 Preview</button>
            <button onClick={save} disabled={saving} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving..." : "Save"}</button>
            <button onClick={send} disabled={sending} style={{ background: "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "7px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{sending ? "Sending..." : "Send"}</button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        {/* Main builder */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Metadata */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Proposal Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onBlur={save} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Recipient Email</label>
                <input type="email" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} onBlur={save} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Valid Until</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} onBlur={save} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} onBlur={save} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Line Items</h3>
              <button onClick={addItem} style={{ background: "var(--hs-blue)", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>+ Add Item</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hs-gray-mid)" }}>
                  {["Item", "Description", "Qty", "Unit Price", "Total", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, fontWeight: 600, color: "var(--hs-text-light)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--hs-gray-mid)" }}>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={li.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="Item name" style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 4, padding: "4px 6px", fontSize: 13 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={li.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Optional" style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 4, padding: "4px 6px", fontSize: 13 }} />
                    </td>
                    <td style={{ padding: "6px 8px", width: 70 }}>
                      <input type="number" min="0" value={li.quantity} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 4, padding: "4px 6px", fontSize: 13 }} />
                    </td>
                    <td style={{ padding: "6px 8px", width: 110 }}>
                      <input type="number" min="0" step="0.01" value={li.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 4, padding: "4px 6px", fontSize: 13 }} />
                    </td>
                    <td style={{ padding: "6px 8px", fontWeight: 600, fontSize: 13 }}>${(li.quantity * li.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: "var(--hs-red)", cursor: "pointer", fontSize: 16 }}>×</button>
                    </td>
                  </tr>
                ))}
                {lineItems.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--hs-text-light)", fontSize: 13 }}>No items yet. Click "+ Add Item" to start.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals sidebar */}
        <div>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: "var(--hs-text-light)" }}>Subtotal</span>
              <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Discount (%)</label>
              <input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "5px 8px", fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Tax (%)</label>
              <input type="number" min="0" max="100" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "5px 8px", fontSize: 13 }} />
            </div>
            <div style={{ borderTop: "2px solid var(--hs-gray-mid)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ color: "var(--hs-green)" }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--hs-text-light)" }}>Status: </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{proposal.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
