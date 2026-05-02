"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { StatCard, Card, Badge, Button } from "@/components/ui";
import { getClients, getProjects, getFollowUps } from "@/lib/storage";
import type { Client, Project, FollowUp } from "@/lib/types";

const STATUS_COLOR: Record<string, "gray" | "blue" | "green" | "yellow" | "red" | "purple"> = {
  lead: "blue",
  active: "yellow",
  completed: "green",
  lost: "red",
  discovery: "blue",
  measuring: "purple",
  proposal_draft: "yellow",
  proposal_sent: "indigo" as "purple",
  approved: "green",
  in_progress: "yellow",
};

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  active: "Active",
  completed: "Completed",
  lost: "Lost",
  discovery: "Discovery",
  measuring: "Measuring",
  proposal_draft: "Proposal Draft",
  proposal_sent: "Proposal Sent",
  approved: "Approved",
  in_progress: "In Progress",
};

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  useEffect(() => {
    setClients(getClients());
    setProjects(getProjects());
    setFollowUps(getFollowUps());
  }, []);

  const activeProjects = projects.filter(
    (p) => !["completed", "lost"].includes(p.status)
  );
  const pendingFollowUps = followUps.filter(
    (f) => f.status === "pending" && new Date(f.scheduledAt) <= new Date()
  );
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const openProposals = projects.filter((p) => p.status === "proposal_sent").length;

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Client
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Clients" value={clients.length} sub={`${clients.filter(c => c.status === 'lead').length} new leads`} color="blue" />
        <StatCard label="Active Projects" value={activeProjects.length} sub="In progress" color="yellow" />
        <StatCard label="Open Proposals" value={openProposals} sub="Awaiting approval" color="purple" />
        <StatCard label="Follow-Ups Due" value={pendingFollowUps.length} sub="Need attention" color={pendingFollowUps.length > 0 ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Card
          title="Recent Clients"
          actions={
            <Link href="/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          }
        >
          {recentClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No clients yet.</p>
              <Link href="/clients/new">
                <Button size="sm" className="mt-3">Add your first client</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 -mx-6">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{client.city}, {client.state} &bull; {client.phone}</div>
                  </div>
                  <Badge color={STATUS_COLOR[client.status] || "gray"}>
                    {STATUS_LABEL[client.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Active Projects */}
        <Card
          title="Active Projects"
          actions={
            activeProjects.length > 5 ? (
              <Link href="/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            ) : undefined
          }
        >
          {activeProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No active projects.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 -mx-6">
              {activeProjects.slice(0, 5).map((project) => {
                const client = clients.find((c) => c.id === project.clientId);
                return (
                  <Link
                    key={project.id}
                    href={`/clients/${project.clientId}/project/${project.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{project.name}</div>
                      <div className="text-xs text-gray-500">
                        {client ? `${client.firstName} ${client.lastName}` : "Unknown client"}
                      </div>
                    </div>
                    <Badge color={STATUS_COLOR[project.status] || "gray"}>
                      {STATUS_LABEL[project.status]}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pending Follow-ups */}
        {pendingFollowUps.length > 0 && (
          <Card title="Follow-Ups Due" className="lg:col-span-2">
            <div className="divide-y divide-gray-100 -mx-6 -mb-6">
              {pendingFollowUps.slice(0, 5).map((fu) => {
                const client = clients.find((c) => c.id === fu.clientId);
                const overdue = new Date(fu.scheduledAt) < new Date();
                return (
                  <div key={fu.id} className="flex items-center gap-4 px-6 py-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${overdue ? "bg-red-500" : "bg-yellow-500"}`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {client ? `${client.firstName} ${client.lastName}` : "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fu.type.toUpperCase()} &bull;{" "}
                        {new Date(fu.scheduledAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {fu.notes && ` — ${fu.notes}`}
                      </div>
                    </div>
                    {overdue && <Badge color="red">Overdue</Badge>}
                    {client && (
                      <Link href={`/clients/${client.id}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
