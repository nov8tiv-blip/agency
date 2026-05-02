"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Badge } from "@/components/ui";
import { getClient, getProject, saveProject } from "@/lib/storage";
import type { Client, Project } from "@/lib/types";

const STATUS_COLOR: Record<string, "gray" | "blue" | "green" | "yellow" | "red" | "purple"> = {
  discovery: "blue",
  measuring: "purple",
  proposal_draft: "yellow",
  proposal_sent: "purple",
  approved: "green",
  in_progress: "yellow",
  completed: "green",
  lost: "red",
};

const STATUS_LABEL: Record<string, string> = {
  discovery: "Discovery",
  measuring: "Measuring",
  proposal_draft: "Proposal Draft",
  proposal_sent: "Proposal Sent",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  lost: "Lost",
};

export default function ProjectPage() {
  const { id: clientId, projectId } = useParams<{ id: string; projectId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const c = getClient(clientId);
    const p = getProject(projectId);
    if (!c || !p) { router.push("/clients"); return; }
    setClient(c);
    setProject(p);
  }, [clientId, projectId, router]);

  if (!client || !project) return null;

  const d = project.discovery;
  const spec = project.fencingSpec;

  const steps = [
    { label: "Discovery", done: !!d, href: `#` },
    { label: "Fence Specs", done: !!spec, href: `/clients/${clientId}/project/${projectId}/fencing` },
    { label: "Proposal", done: ["proposal_draft", "proposal_sent", "approved"].includes(project.status), href: `/clients/${clientId}/project/${projectId}/proposal` },
    { label: "Materials / PO", done: false, href: `/clients/${clientId}/project/${projectId}/materials` },
  ];

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-gray-700">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${clientId}`} className="hover:text-gray-700">{client.firstName} {client.lastName}</Link>
        <span>/</span>
        <span className="text-gray-900">{project.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <Badge color={STATUS_COLOR[project.status] || "gray"}>{STATUS_LABEL[project.status]}</Badge>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex gap-4 mb-8">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-colors text-center ${
              step.done ? "border-green-300 bg-green-50" : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${step.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
              {step.done ? "✓" : i + 1}
            </div>
            <div className={`text-sm font-medium ${step.done ? "text-green-700" : "text-gray-600"}`}>{step.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discovery info */}
        {d && (
          <Card title="Discovery Info">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-400 text-xs uppercase">Meeting Date</div>
                <div className="font-medium">{new Date(d.meetingDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">Site Address</div>
                <div>{d.siteAddress}, {d.siteCity}, {d.siteState}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">Property Type</div>
                <div className="capitalize">{d.propertyType.replace("_", " ")}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">Terrain</div>
                <div className="capitalize">{d.terrain.replace("_", " ")}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">Soil</div>
                <div className="capitalize">{d.soilType}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase">Existing Fence</div>
                <div>{d.existingFence ? "Yes" : "No"}{d.removalNeeded ? " — Removal needed" : ""}</div>
              </div>
            </div>
            {d.clientNotes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-gray-400 text-xs uppercase mb-1">Client Notes</div>
                <p className="text-sm text-gray-700">{d.clientNotes}</p>
              </div>
            )}
          </Card>
        )}

        {/* Fence spec summary */}
        {spec && (
          <Card
            title="Fence Specifications"
            actions={
              <Link href={`/clients/${clientId}/project/${projectId}/fencing`}>
                <Button size="sm" variant="secondary">Edit</Button>
              </Link>
            }
          >
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium capitalize">{spec.fenceType.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Linear Feet</span>
                <span className="font-medium">{spec.sections.reduce((s, sec) => s + sec.linearFeet, 0)} lf</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sections</span>
                <span className="font-medium">{spec.sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gates</span>
                <span className="font-medium">{spec.gates.reduce((s, g) => s + g.quantity, 0)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Quick actions */}
        <Card title="Quick Actions" className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <Link href={`/clients/${clientId}/project/${projectId}/fencing`}>
              <Button variant={spec ? "secondary" : "primary"}>
                {spec ? "Edit Fence Specs" : "Add Fence Specs"}
              </Button>
            </Link>
            <Link href={`/clients/${clientId}/project/${projectId}/proposal`}>
              <Button variant="secondary">
                {["proposal_draft", "proposal_sent", "approved"].includes(project.status) ? "View Proposal" : "Build Proposal"}
              </Button>
            </Link>
            <Link href={`/clients/${clientId}/project/${projectId}/materials`}>
              <Button variant="secondary">Materials / PO</Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
