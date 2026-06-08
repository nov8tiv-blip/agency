"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Badge, Button, Card, StatCard } from "@/components/ui";
import { getQuickQuotes, saveQuickQuote } from "@/lib/storage";
import type { QuickQuote, QuickQuoteStatus } from "@/lib/types";
import { FENCE_TYPE_LABELS } from "@/lib/quote-estimator";

const STATUS_COLOR: Record<QuickQuoteStatus, "gray" | "blue" | "green" | "red" | "yellow" | "purple"> = {
  new:       "blue",
  contacted: "yellow",
  converted: "green",
  lost:      "red",
};

const STATUS_LABEL: Record<QuickQuoteStatus, string> = {
  new:       "New",
  contacted: "Contacted",
  converted: "Converted",
  lost:      "Lost",
};

export default function ProposalsPage() {
  const [quotes, setQuotes] = useState<QuickQuote[]>([]);
  const [filter, setFilter] = useState<QuickQuoteStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setQuotes(getQuickQuotes().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  function refresh() {
    setQuotes(getQuickQuotes().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }

  function updateStatus(q: QuickQuote, status: QuickQuoteStatus) {
    saveQuickQuote({ ...q, status });
    refresh();
  }

  const filtered = quotes.filter((q) => {
    if (filter !== "all" && q.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        `${q.firstName} ${q.lastName}`.toLowerCase().includes(s) ||
        q.email.toLowerCase().includes(s) ||
        q.phone.includes(s) ||
        q.city.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const counts = {
    all:       quotes.length,
    new:       quotes.filter(q => q.status === "new").length,
    contacted: quotes.filter(q => q.status === "contacted").length,
    converted: quotes.filter(q => q.status === "converted").length,
    lost:      quotes.filter(q => q.status === "lost").length,
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Quotes</h1>
          <p className="text-sm text-gray-500 mt-1">All estimates submitted via the quick quote form</p>
        </div>
        <div className="flex gap-2">
          <Link href="/proposals/q" target="_blank">
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Quote Form
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Quotes" value={counts.all} sub="All time" color="blue" />
        <StatCard label="New" value={counts.new} sub="Need follow-up" color="yellow" />
        <StatCard label="Contacted" value={counts.contacted} sub="In progress" color="purple" />
        <StatCard label="Converted" value={counts.converted} sub="Became clients" color="green" />
      </div>

      {/* Filters + search */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {(["all", "new", "contacted", "converted", "lost"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABEL[s]}
                <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
              </button>
            ))}
          </div>
          <input
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search name, email, city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No quick quotes yet.</p>
            <Link href="/proposals/q" target="_blank" className="mt-3 inline-block">
              <Button size="sm">Share the Quote Form</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Fence</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase px-4 py-3">Estimate</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900 text-sm">{q.firstName} {q.lastName}</div>
                      <div className="text-xs text-gray-400">{q.email}</div>
                      <div className="text-xs text-gray-400">{q.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{FENCE_TYPE_LABELS[q.fenceType]}</div>
                      <div className="text-xs text-gray-400">{q.linearFeet} lf · {q.fenceHeight}ft{q.gateCount > 0 ? ` · ${q.gateCount}g` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${q.estimateMin.toLocaleString()} – ${q.estimateMax.toLocaleString()}
                      </div>
                      {q.existingRemoval && <div className="text-xs text-gray-400">incl. removal</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {q.sentAt && (
                        <div className="text-green-600">
                          Sent {new Date(q.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={q.status}
                        onChange={e => updateStatus(q, e.target.value as QuickQuoteStatus)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        {(["new", "contacted", "converted", "lost"] as QuickQuoteStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/proposals/${q.id}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
