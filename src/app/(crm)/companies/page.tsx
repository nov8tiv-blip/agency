"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "", industry: "", size: "", city: "", country: "" });
  const [saving, setSaving] = useState(false);

  const fetchCompanies = async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/companies?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCompanies(data.companies ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", domain: "", industry: "", size: "", city: "", country: "" });
      fetchCompanies(search);
    }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader
        title={`Companies (${total})`}
        action={
          <button onClick={() => setShowForm(true)} style={{ background: "var(--hs-orange)", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            + Create Company
          </button>
        }
      />

      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); fetchCompanies(e.target.value); }}
          placeholder="Search companies..."
          style={{ border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 12px", fontSize: 13.5, width: 320, outline: "none" }}
        />
      </div>

      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--hs-gray-mid)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--hs-gray-light)", borderBottom: "1px solid var(--hs-gray-mid)" }}>
              {["Company", "Domain", "Industry", "Size", "Contacts", "Deals"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "var(--hs-text-light)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>Loading...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--hs-text-light)" }}>No companies found</td></tr>
            ) : companies.map((c) => {
              const co = c as { id: string; name: string; domain?: string; industry?: string; size?: string; _count: { contacts: number; deals: number } };
              return (
                <tr key={co.id} onClick={() => router.push(`/companies/${co.id}`)} style={{ borderBottom: "1px solid var(--hs-gray-mid)", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--hs-blue)", fontSize: 13.5 }}>{co.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--hs-text-light)" }}>{co.domain ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{co.industry ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{co.size ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{co._count.contacts}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{co._count.deals}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 32, width: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>Create Company</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(["name", "domain", "industry", "city", "country"] as const).map((f) => (
                <div key={f}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{f === "name" ? "Company Name *" : f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  <input required={f === "name"} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} style={{ width: "100%", border: "1px solid var(--hs-gray-mid)", borderRadius: 6, padding: "7px 10px", fontSize: 13 }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--hs-gray-mid)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "var(--hs-orange)", color: "white", fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
