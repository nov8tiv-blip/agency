"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#e5e8eb",
  SENT: "#d6eaf8",
  VIEWED: "#fdebd0",
  SIGNED: "#d5f5e3",
  DECLINED: "#fde8e8",
  EXPIRED: "#f0f0f0",
};

export default function ProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [proposals, setProposals] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchProposals = async () => {
    setLoading(true);
    const res = await fetch("/api/proposals");
    setProposals(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchProposals(); }, []);

  const createProposal = async () => {
    setCreating(true);
    const dealId = searchParams.get("dealId");
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Proposal", dealId }),
    });
    if (res.ok) {
      const p = await res.json();
      router.push(`/proposals/${p.id}`);
    }
    setCreating(false);
  };

  return (
    <div>
      <PageHeader
        title="Proposals"
        action={
          <button onClick={createProposal} disabled={creating} style={{ background: "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            {creating ? "Creating..." : "+ New Proposal"}
          </button>
        }
      />

      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--hs-gray-light)", borderBottom: "1px solid var(--hs-gray-mid)" }}>
              {["Title", "Deal", "Recipient", "Total", "Status", "Created"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "var(--hs-text-light)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>Loading...</td></tr>
            ) : proposals.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>No proposals yet. Create your first one.</td></tr>
            ) : proposals.map((p) => {
              const prop = p as { id: string; title: string; recipientEmail?: string; total: number; status: string; createdAt: string; deal?: { name: string } };
              return (
                <tr key={prop.id} onClick={() => router.push(`/proposals/${prop.id}`)} style={{ borderBottom: "1px solid var(--hs-gray-mid)", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--hs-blue)", fontSize: 13.5 }}>{prop.title}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{prop.deal?.name ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--hs-text-light)" }}>{prop.recipientEmail ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--hs-green)" }}>${Number(prop.total).toLocaleString()}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: STATUS_COLORS[prop.status] ?? "#e5e8eb", borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{prop.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--hs-text-light)" }}>{new Date(prop.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
