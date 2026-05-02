"use client";

import type { Client, Project, Proposal, AppSettings } from "./types";
import {
  proposalEmailHtml,
  followUpEmailHtml,
  reviewRequestEmailHtml,
  thankYouLetterHtml,
} from "./email-templates";

// ─── Email actions (calls our /api/email route) ───────────────────────────────

async function sendEmail(
  settings: AppSettings,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const { gmailUser, gmailAppPassword } = settings.integrations;
  if (!gmailUser || !gmailAppPassword) {
    return { ok: false, error: "Gmail credentials not configured in Settings." };
  }
  const res = await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html, text, gmailUser, gmailAppPassword }),
  });
  return res.ok ? { ok: true } : { ok: false, error: await res.text() };
}

export async function sendProposalEmail(
  client: Client,
  project: Project,
  proposal: Proposal,
  settings: AppSettings
): Promise<{ ok: boolean; error?: string }> {
  const { subject, html, text } = proposalEmailHtml(client, project, proposal, settings);
  return sendEmail(settings, client.email, subject, html, text);
}

export async function sendFollowUpEmail(
  client: Client,
  settings: AppSettings,
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  const { subject, html, text } = followUpEmailHtml(client, settings, message);
  return sendEmail(settings, client.email, subject, html, text);
}

export async function sendReviewRequest(
  client: Client,
  settings: AppSettings
): Promise<{ ok: boolean; error?: string }> {
  const { subject, html, text } = reviewRequestEmailHtml(client, settings);
  return sendEmail(settings, client.email, subject, html, text);
}

export async function sendThankYou(
  client: Client,
  settings: AppSettings
): Promise<{ ok: boolean; error?: string }> {
  const { subject, html, text } = thankYouLetterHtml(client, settings);
  return sendEmail(settings, client.email, subject, html, text);
}

// ─── HubSpot actions ──────────────────────────────────────────────────────────

async function callHubSpot(payload: Record<string, unknown>): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const res = await fetch("/api/hubspot/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    return { ok: true, data: await res.json() };
  }
  return { ok: false, error: await res.text() };
}

export async function syncClientToHubSpot(
  client: Client,
  settings: AppSettings
): Promise<{ ok: boolean; contactId?: string; error?: string }> {
  const apiKey = settings.integrations.hubspotApiKey;
  if (!apiKey) return { ok: false, error: "HubSpot API key not configured." };
  const result = await callHubSpot({ action: "sync_client", apiKey, client });
  if (result.ok) {
    return { ok: true, contactId: (result.data as { contactId?: string })?.contactId };
  }
  return { ok: false, error: result.error };
}

export async function syncProjectToHubSpot(
  client: Client,
  project: Project,
  settings: AppSettings
): Promise<{ ok: boolean; contactId?: string; dealId?: string; error?: string }> {
  const apiKey = settings.integrations.hubspotApiKey;
  if (!apiKey) return { ok: false, error: "HubSpot API key not configured." };
  const result = await callHubSpot({
    action: "sync_deal",
    apiKey,
    client,
    project,
    pipelineId: settings.integrations.hubspotPipelineId,
  });
  if (result.ok) {
    const d = result.data as { contactId?: string; dealId?: string };
    return { ok: true, contactId: d?.contactId, dealId: d?.dealId };
  }
  return { ok: false, error: result.error };
}

export async function addHubSpotNote(
  client: Client,
  project: Project | undefined,
  note: string,
  settings: AppSettings
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = settings.integrations.hubspotApiKey;
  if (!apiKey) return { ok: false, error: "HubSpot API key not configured." };
  const result = await callHubSpot({ action: "add_note", apiKey, client, project, note });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function logEmailToHubSpot(
  client: Client,
  project: Project | undefined,
  emailSubject: string,
  emailBody: string,
  settings: AppSettings
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = settings.integrations.hubspotApiKey;
  if (!apiKey) return { ok: false, error: "HubSpot API key not configured." };
  const result = await callHubSpot({
    action: "log_email",
    apiKey,
    client,
    project,
    emailSubject,
    emailBody,
  });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
