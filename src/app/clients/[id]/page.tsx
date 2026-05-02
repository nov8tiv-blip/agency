"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Badge, Modal, Input, Select, Textarea, Alert } from "@/components/ui";
import {
  getClient,
  saveClient,
  getClientProjects,
  saveProject,
  getClientFollowUps,
  saveFollowUp,
  generateId,
  getSettings,
} from "@/lib/storage";
import {
  syncClientToHubSpot,
  syncProjectToHubSpot,
  sendFollowUpEmail,
  sendReviewRequest,
  sendThankYou,
} from "@/lib/actions";
import type { Client, Project, FollowUp } from "@/lib/types";

const PROJECT_STATUS_COLOR: Record<string, "gray" | "blue" | "green" | "yellow" | "red" | "purple"> = {
  discovery: "blue",
  measuring: "purple",
  proposal_draft: "yellow",
  proposal_sent: "purple",
  approved: "green",
  in_progress: "yellow",
  completed: "green",
  lost: "red",
};

const PROJECT_STATUS_LABEL: Record<string, string> = {
  discovery: "Discovery",
  measuring: "Measuring",
  proposal_draft: "Proposal Draft",
  proposal_sent: "Proposal Sent",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  lost: "Lost",
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [followUpForm, setFollowUpForm] = useState({
    type: "call" as FollowUp["type"],
    scheduledAt: new Date().toISOString().slice(0, 16),
    notes: "",
  });
  const [emailType, setEmailType] = useState<"followup" | "review" | "thankyou">("followup");
  const [emailMsg, setEmailMsg] = useState("");

  useEffect(() => {
    const c = getClient(id);
    if (!c) { router.push("/clients"); return; }
    setClient(c);
    setEditForm(c);
    setProjects(getClientProjects(id));
    setFollowUps(getClientFollowUps(id));
  }, [id, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function handleSaveEdit() {
    if (!client) return;
    const updated = { ...client, ...editForm, updatedAt: new Date().toISOString() } as Client;
    saveClient(updated);
    setClient(updated);
    setEditOpen(false);
    showToast("Client updated.");
  }

  async function handleHubSpotSync() {
    if (!client) return;
    setLoading(true);
    const settings = getSettings();
    const res = await syncClientToHubSpot(client, settings);
    setLoading(false);
    if (res.ok) {
      const updated = { ...client, hubspotContactId: res.contactId };
      saveClient(updated as Client);
      setClient(updated as Client);
      showToast("Synced to HubSpot!");
    } else {
      showToast(`HubSpot error: ${res.error}`);
    }
  }

  function handleAddFollowUp() {
    if (!client) return;
    const fu: FollowUp = {
      id: generateId(),
      clientId: client.id,
      type: followUpForm.type,
      status: "pending",
      scheduledAt: new Date(followUpForm.scheduledAt).toISOString(),
      notes: followUpForm.notes || undefined,
      createdAt: new Date().toISOString(),
    };
    saveFollowUp(fu);
    setFollowUps(getClientFollowUps(client.id));
    setFollowUpOpen(false);
    showToast("Follow-up scheduled.");
  }

  async function handleSendEmail() {
    if (!client) return;
    setLoading(true);
    const settings = getSettings();
    let res: { ok: boolean; error?: string };
    if (emailType === "followup") res = await sendFollowUpEmail(client, settings, emailMsg);
    else if (emailType === "review") res = await sendReviewRequest(client, settings);
    else res = await sendThankYou(client, settings);
    setLoading(false);
    setEmailOpen(false);
    showToast(res.ok ? "Email sent!" : `Email error: ${res.error}`);
  }

  function handleNewProject() {
    if (!client) return;
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId(),
      clientId: client.id,
      name: `${client.firstName} ${client.lastName} - Project ${projects.length + 2}`,
      status: "discovery",
      createdAt: now,
      updatedAt: now,
    };
    saveProject(project);
    router.push(`/clients/${client.id}/project/${project.id}/fencing`);
  }

  if (!client) return null;

  return (
    <AppLayout>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/clients" className="hover:text-gray-700">Clients</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{client.firstName} {client.lastName}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{client.firstName} {client.lastName}</h1>
          <p className="text-sm text-gray-500">{client.type === "commercial" ? "Commercial" : "Residential"} &bull; Added {new Date(client.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEmailOpen(true)}>Send Email</Button>
          <Button variant="secondary" size="sm" onClick={handleHubSpotSync} loading={loading}>Sync HubSpot</Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
          <Button size="sm" onClick={handleNewProject}>+ New Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: contact info */}
        <div className="space-y-4">
          <Card title="Contact Info">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide">Phone</div>
                <a href={`tel:${client.phone}`} className="text-blue-700 hover:underline font-medium">{client.phone}</a>
              </div>
              {client.altPhone && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Alt Phone</div>
                  <a href={`tel:${client.altPhone}`} className="text-blue-700 hover:underline">{client.altPhone}</a>
                </div>
              )}
              {client.email && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Email</div>
                  <a href={`mailto:${client.email}`} className="text-blue-700 hover:underline">{client.email}</a>
                </div>
              )}
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide">Address</div>
                <div className="text-gray-900">{client.address}</div>
                <div className="text-gray-700">{client.city}, {client.state} {client.zip}</div>
              </div>
              {client.source && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Source</div>
                  <div className="text-gray-700">{client.source}</div>
                </div>
              )}
              {client.hubspotContactId && (
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">HubSpot ID</div>
                  <div className="text-gray-600 font-mono text-xs">{client.hubspotContactId}</div>
                </div>
              )}
            </div>
          </Card>

          {client.notes && (
            <Card title="Notes">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
            </Card>
          )}

          {/* Follow-ups */}
          <Card
            title="Follow-Ups"
            actions={
              <Button size="sm" variant="secondary" onClick={() => setFollowUpOpen(true)}>+ Schedule</Button>
            }
          >
            {followUps.length === 0 ? (
              <p className="text-sm text-gray-400">No follow-ups scheduled.</p>
            ) : (
              <div className="space-y-2">
                {followUps.map((fu) => (
                  <div key={fu.id} className="flex items-start gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${fu.status === "completed" ? "bg-green-500" : "bg-yellow-500"}`} />
                    <div>
                      <div className="font-medium capitalize">{fu.type} — {new Date(fu.scheduledAt).toLocaleDateString()}</div>
                      {fu.notes && <div className="text-gray-500 text-xs">{fu.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: projects */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Projects"
            actions={<Button size="sm" onClick={handleNewProject}>+ New Project</Button>}
          >
            {projects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm mb-3">No projects yet.</p>
                <Button size="sm" onClick={handleNewProject}>Create First Project</Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 -mx-6">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/clients/${client.id}/project/${project.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                        {project.discovery?.meetingDate && ` &bull; Meeting: ${new Date(project.discovery.meetingDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge color={PROJECT_STATUS_COLOR[project.status] || "gray"}>
                        {PROJECT_STATUS_LABEL[project.status]}
                      </Badge>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Client" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={editForm.firstName || ""} onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
          <Input label="Last Name" value={editForm.lastName || ""} onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
          <Input label="Phone" value={editForm.phone || ""} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Alt Phone" value={editForm.altPhone || ""} onChange={(e) => setEditForm(f => ({ ...f, altPhone: e.target.value }))} />
          <Input label="Email" type="email" value={editForm.email || ""} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="col-span-2" />
          <Input label="Address" value={editForm.address || ""} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="col-span-2" />
          <Input label="City" value={editForm.city || ""} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} />
          <Input label="State" value={editForm.state || ""} onChange={(e) => setEditForm(f => ({ ...f, state: e.target.value }))} maxLength={2} />
          <Input label="Zip" value={editForm.zip || ""} onChange={(e) => setEditForm(f => ({ ...f, zip: e.target.value }))} />
          <Select
            label="Status"
            value={editForm.status || "lead"}
            onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value as Client["status"] }))}
            options={[
              { value: "lead", label: "Lead" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "lost", label: "Lost" },
            ]}
          />
          <Textarea label="Notes" value={editForm.notes || ""} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit}>Save Changes</Button>
        </div>
      </Modal>

      {/* Follow-up Modal */}
      <Modal open={followUpOpen} onClose={() => setFollowUpOpen(false)} title="Schedule Follow-Up">
        <div className="space-y-4">
          <Select
            label="Type"
            value={followUpForm.type}
            onChange={(e) => setFollowUpForm(f => ({ ...f, type: e.target.value as FollowUp["type"] }))}
            options={[
              { value: "call", label: "Phone Call" },
              { value: "email", label: "Email" },
              { value: "text", label: "Text Message" },
              { value: "in_person", label: "In Person" },
            ]}
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            value={followUpForm.scheduledAt}
            onChange={(e) => setFollowUpForm(f => ({ ...f, scheduledAt: e.target.value }))}
          />
          <Textarea
            label="Notes"
            value={followUpForm.notes}
            onChange={(e) => setFollowUpForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="What to discuss..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFollowUp}>Schedule</Button>
          </div>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Send Email">
        <div className="space-y-4">
          <Select
            label="Email Type"
            value={emailType}
            onChange={(e) => setEmailType(e.target.value as typeof emailType)}
            options={[
              { value: "followup", label: "Follow-Up Email" },
              { value: "review", label: "Review Request (Yelp/Google)" },
              { value: "thankyou", label: "Thank You Letter" },
            ]}
          />
          {emailType === "followup" && (
            <Textarea
              label="Custom Message (optional)"
              value={emailMsg}
              onChange={(e) => setEmailMsg(e.target.value)}
              rows={4}
              placeholder="Leave blank for default follow-up message..."
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} loading={loading}>Send Email</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
