"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Badge, Input, Select, SectionHeader } from "@/components/ui";
import { getClients } from "@/lib/storage";
import type { Client } from "@/lib/types";

const STATUS_COLOR: Record<string, "gray" | "blue" | "green" | "yellow" | "red" | "purple"> = {
  lead: "blue",
  active: "yellow",
  completed: "green",
  lost: "red",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setClients(getClients());
  }, []);

  const filtered = clients
    .filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      const q = search.toLowerCase();
      return (
        !q ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AppLayout>
      <SectionHeader
        title="Clients"
        subtitle={`${clients.length} total clients`}
        actions={
          <Link href="/clients/new">
            <Button>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Client
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Search name, email, phone, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "lead", label: "Leads" },
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "lost", label: "Lost" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 mb-4">
            {search || statusFilter !== "all" ? "No clients match your search." : "No clients yet. Add your first client!"}
          </p>
          {!search && statusFilter === "all" && (
            <Link href="/clients/new">
              <Button>Add First Client</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Contact</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Location</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Added</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    <div>{client.phone}</div>
                    <div className="text-xs text-gray-400">{client.email}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {client.city}, {client.state}
                  </td>
                  <td className="px-6 py-3 capitalize text-gray-600">{client.type}</td>
                  <td className="px-6 py-3">
                    <Badge color={STATUS_COLOR[client.status] || "gray"}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/clients/${client.id}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
