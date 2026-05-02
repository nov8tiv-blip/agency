"use client";

import type { Client, Project, Proposal, FollowUp, AppSettings } from "./types";

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  clients: "fnc_clients",
  projects: "fnc_projects",
  proposals: "fnc_proposals",
  followups: "fnc_followups",
  settings: "fnc_settings",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export function getClients(): Client[] {
  return load<Client[]>(KEYS.clients, []);
}

export function getClient(id: string): Client | undefined {
  return getClients().find((c) => c.id === id);
}

export function saveClient(client: Client): void {
  const list = getClients().filter((c) => c.id !== client.id);
  save(KEYS.clients, [...list, { ...client, updatedAt: new Date().toISOString() }]);
}

export function deleteClient(id: string): void {
  save(KEYS.clients, getClients().filter((c) => c.id !== id));
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  return load<Project[]>(KEYS.projects, []);
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function getClientProjects(clientId: string): Project[] {
  return getProjects().filter((p) => p.clientId === clientId);
}

export function saveProject(project: Project): void {
  const list = getProjects().filter((p) => p.id !== project.id);
  save(KEYS.projects, [...list, { ...project, updatedAt: new Date().toISOString() }]);
}

export function deleteProject(id: string): void {
  save(KEYS.projects, getProjects().filter((p) => p.id !== id));
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export function getProposals(): Proposal[] {
  return load<Proposal[]>(KEYS.proposals, []);
}

export function getProposal(id: string): Proposal | undefined {
  return getProposals().find((p) => p.id === id);
}

export function getProjectProposal(projectId: string): Proposal | undefined {
  return getProposals().find((p) => p.projectId === projectId);
}

export function saveProposal(proposal: Proposal): void {
  const list = getProposals().filter((p) => p.id !== proposal.id);
  save(KEYS.proposals, [...list, { ...proposal, updatedAt: new Date().toISOString() }]);
}

// ─── Follow Ups ───────────────────────────────────────────────────────────────

export function getFollowUps(): FollowUp[] {
  return load<FollowUp[]>(KEYS.followups, []);
}

export function getClientFollowUps(clientId: string): FollowUp[] {
  return getFollowUps().filter((f) => f.clientId === clientId);
}

export function getPendingFollowUps(): FollowUp[] {
  const now = new Date();
  return getFollowUps()
    .filter((f) => f.status === "pending" && new Date(f.scheduledAt) <= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export function saveFollowUp(followUp: FollowUp): void {
  const list = getFollowUps().filter((f) => f.id !== followUp.id);
  save(KEYS.followups, [...list, followUp]);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  company: {
    name: "Your Fencing Company",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
  },
  integrations: {
    hubspotApiKey: "",
    yelpUrl: "https://yelp.to/tmZdwGfMAA",
    googleReviewUrl: "https://share.google/NZ8QNan7p8kJleeaK",
  },
  proposal: {
    defaultTaxRate: 8.25,
    defaultValidDays: 30,
    defaultDepositPercent: 50,
    defaultTerms:
      "A deposit of 50% is due upon contract signing. The balance is due upon project completion. All materials remain the property of the contractor until paid in full. Prices are valid for 30 days from the proposal date.",
  },
  pricing: {
    laborRatePerFoot: 18,
    removalRatePerFoot: 4.5,
    permitFlatFee: 350,
    fuelSurcharge: 0,
    markupPercent: 0,
  },
};

export function getSettings(): AppSettings {
  return load<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  save(KEYS.settings, settings);
}
