"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#e5e8eb",
  SCHEDULED: "#d6eaf8",
  SENDING: "#fdebd0",
  SENT: "#d5f5e3",
  PAUSED: "#f0f0f0",
};

export default function MarketingPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await fetch("/api/marketing/campaigns");
    setCampaigns(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const createCampaign = async () => {
    setCreating(true);
    const res = await fetch("/api/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Campaign", subject: "Your subject here", fromName: "Agency CRM", fromEmail: process.env.NEXT_PUBLIC_SES_FROM ?? "noreply@example.com" }),
    });
    if (res.ok) {
      const c = await res.json();
      router.push(`/marketing/${c.id}`);
    }
    setCreating(false);
  };

  return (
    <div>
      <PageHeader
        title="Email Campaigns"
        action={
          <button onClick={createCampaign} disabled={creating} style={{ background: "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            {creating ? "Creating..." : "+ New Campaign"}
          </button>
        }
      />

      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--hs-gray-light)", borderBottom: "1px solid var(--hs-gray-mid)" }}>
              {["Campaign", "Subject", "Recipients", "Status", "Sent", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "var(--hs-text-light)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>Loading...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>No campaigns yet</td></tr>
            ) : campaigns.map((c) => {
              const camp = c as { id: string; name: string; subject: string; status: string; sentAt?: string; _count: { recipients: number } };
              return (
                <tr key={camp.id} style={{ borderBottom: "1px solid var(--hs-gray-mid)", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                  <td onClick={() => router.push(`/marketing/${camp.id}`)} style={{ padding: "12px 16px", fontWeight: 600, color: "var(--hs-blue)", fontSize: 13.5 }}>{camp.name}</td>
                  <td onClick={() => router.push(`/marketing/${camp.id}`)} style={{ padding: "12px 16px", fontSize: 13 }}>{camp.subject}</td>
                  <td onClick={() => router.push(`/marketing/${camp.id}`)} style={{ padding: "12px 16px", fontSize: 13 }}>{camp._count.recipients}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: STATUS_COLORS[camp.status] ?? "#e5e8eb", borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{camp.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--hs-text-light)" }}>{camp.sentAt ? new Date(camp.sentAt).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => router.push(`/marketing/${camp.id}/analytics`)} style={{ background: "none", border: "1px solid var(--hs-gray-mid)", borderRadius: 4, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Analytics</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
