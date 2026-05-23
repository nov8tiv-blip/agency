"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

interface Analytics {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  clicks: { url: string; count: number }[];
  recipients: { id: string; email: string; status: string; openedAt?: string; clickedAt?: string }[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hs-text-light)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--hs-text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--hs-text-light)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketing/campaigns/${id}/analytics`)
      .then((r) => r.json())
      .then((d) => { setAnalytics(d); setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ padding: 32, color: "var(--hs-text-light)" }}>Loading analytics...</div>;
  if (!analytics) return <div style={{ padding: 32 }}>Analytics not found</div>;

  return (
    <div>
      <PageHeader
        title="Campaign Analytics"
        action={
          <button onClick={() => router.push(`/marketing/${id}`)} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>
            ← Back to Campaign
          </button>
        }
      />

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="SENT" value={analytics.sent} />
        <StatCard label="OPENED" value={analytics.opened} sub={`${analytics.openRate}% open rate`} />
        <StatCard label="CLICKED" value={analytics.clicked} sub={`${analytics.clickRate}% click rate`} />
        <StatCard label="BOUNCED" value={analytics.bounced} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top URLs */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Top Links</h3>
          {analytics.clicks.length === 0 ? (
            <p style={{ color: "var(--hs-text-light)", fontSize: 13 }}>No clicks recorded yet</p>
          ) : analytics.clicks.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--hs-gray-mid)", fontSize: 13 }}>
              <span style={{ color: "var(--hs-blue)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 12 }}>{c.url}</span>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>{c.count}</span>
            </div>
          ))}
        </div>

        {/* Recipient status */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Recipients</h3>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {analytics.recipients.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--hs-gray-mid)", fontSize: 12 }}>
                <span style={{ color: "var(--hs-text)" }}>{r.email}</span>
                <span style={{
                  background: r.status === "OPENED" || r.status === "CLICKED" ? "#d5f5e3" : r.status === "BOUNCED" ? "#fde8e8" : "#e5e8eb",
                  borderRadius: 8,
                  padding: "1px 8px",
                  fontWeight: 600,
                  fontSize: 11,
                }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
