"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/companies/${id}`)
      .then((r) => r.json())
      .then((d) => { setCompany(d); setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ padding: 32, color: "var(--hs-text-light)" }}>Loading...</div>;
  if (!company || company.error) return <div style={{ padding: 32 }}>Company not found</div>;

  const co = company as {
    id: string; name: string; domain?: string; industry?: string; size?: string; city?: string; country?: string; createdAt: string;
    contacts: { id: string; firstName: string; lastName: string; email?: string; jobTitle?: string }[];
    deals: { id: string; name: string; amount?: number; stage: { name: string } }[];
  };

  return (
    <div>
      <PageHeader
        title={co.name}
        subtitle={co.domain ?? undefined}
        action={<button onClick={() => router.back()} style={{ padding: "7px 14px", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 13 }}>← Back</button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "var(--hs-text-light)", textTransform: "uppercase" }}>Company Info</h3>
          {[["Industry", co.industry], ["Size", co.size], ["City", co.city], ["Country", co.country]].map(([label, value]) => (
            <div key={label as string} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--hs-text-light)", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13.5 }}>{value ?? "—"}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Contacts ({co.contacts.length})</h3>
            {co.contacts.length === 0 ? (
              <p style={{ color: "var(--hs-text-light)", fontSize: 13 }}>No contacts</p>
            ) : co.contacts.map((c) => (
              <div key={c.id} onClick={() => router.push(`/contacts/${c.id}`)} style={{ padding: "10px 0", borderBottom: "1px solid var(--hs-gray-mid)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--hs-blue)" }}>{c.firstName} {c.lastName}</div>
                  <div style={{ fontSize: 12, color: "var(--hs-text-light)" }}>{c.jobTitle ?? c.email ?? "—"}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Deals ({co.deals.length})</h3>
            {co.deals.length === 0 ? (
              <p style={{ color: "var(--hs-text-light)", fontSize: 13 }}>No deals</p>
            ) : co.deals.map((d) => (
              <div key={d.id} onClick={() => router.push(`/deals/${d.id}`)} style={{ padding: "10px 0", borderBottom: "1px solid var(--hs-gray-mid)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--hs-blue)" }}>{d.name}</div>
                <div style={{ fontSize: 13, color: "var(--hs-text-light)" }}>
                  {d.amount ? `$${Number(d.amount).toLocaleString()}` : "—"} · {d.stage.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
