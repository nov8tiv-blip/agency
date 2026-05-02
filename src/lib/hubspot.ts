import type { Client, Project, Proposal } from "./types";

// ─── HubSpot REST API v3 client (no SDK dependency) ───────────────────────────

const BASE = "https://api.hubapi.com";

async function hs(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `HubSpot ${res.status}: ${txt.slice(0, 200)}` };
    }

    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function createOrUpdateContact(
  apiKey: string,
  client: Client
): Promise<{ ok: boolean; contactId?: string; error?: string }> {
  const props = {
    email: client.email,
    firstname: client.firstName,
    lastname: client.lastName,
    phone: client.phone,
    mobilephone: client.altPhone || "",
    address: client.address,
    city: client.city,
    state: client.state,
    zip: client.zip,
    hs_lead_status: statusToHubspot(client.status),
    lifecyclestage: "lead",
    lead_source: client.source || "Direct",
  };

  // Try to find existing contact by email
  const search = await hs(apiKey, "POST", "/crm/v3/objects/contacts/search", {
    filterGroups: [
      {
        filters: [{ propertyName: "email", operator: "EQ", value: client.email }],
      },
    ],
    properties: ["email", "hs_object_id"],
    limit: 1,
  });

  if (search.ok) {
    const results = (search.data as { results?: { id: string }[] }).results || [];
    if (results.length > 0) {
      const contactId = results[0].id;
      const update = await hs(apiKey, "PATCH", `/crm/v3/objects/contacts/${contactId}`, {
        properties: props,
      });
      return update.ok ? { ok: true, contactId } : { ok: false, error: update.error };
    }
  }

  const create = await hs(apiKey, "POST", "/crm/v3/objects/contacts", {
    properties: props,
  });

  if (create.ok) {
    const contactId = (create.data as { id: string }).id;
    return { ok: true, contactId };
  }
  return { ok: false, error: create.error };
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export async function createDeal(
  apiKey: string,
  client: Client,
  project: Project,
  contactId: string,
  pipelineId?: string
): Promise<{ ok: boolean; dealId?: string; error?: string }> {
  const res = await hs(apiKey, "POST", "/crm/v3/objects/deals", {
    properties: {
      dealname: `${client.firstName} ${client.lastName} - ${project.name}`,
      pipeline: pipelineId || "default",
      dealstage: "appointmentscheduled",
      closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: project.discovery?.clientNotes || "",
    },
    associations: [
      {
        to: { id: contactId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }],
      },
    ],
  });

  if (res.ok) {
    return { ok: true, dealId: (res.data as { id: string }).id };
  }
  return { ok: false, error: res.error };
}

export async function updateDeal(
  apiKey: string,
  dealId: string,
  props: Record<string, string | number>
): Promise<{ ok: boolean; error?: string }> {
  const res = await hs(apiKey, "PATCH", `/crm/v3/objects/deals/${dealId}`, {
    properties: props,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function updateDealStage(
  apiKey: string,
  dealId: string,
  stage: string,
  amount?: number
): Promise<{ ok: boolean; error?: string }> {
  return updateDeal(apiKey, dealId, {
    dealstage: stage,
    ...(amount ? { amount: amount.toString() } : {}),
  });
}

// ─── Notes / Engagements ──────────────────────────────────────────────────────

export async function addNote(
  apiKey: string,
  contactId: string,
  dealId: string | undefined,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const associations: unknown[] = [
    {
      to: { id: contactId },
      types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
    },
  ];
  if (dealId) {
    associations.push({
      to: { id: dealId },
      types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }],
    });
  }

  const res = await hs(apiKey, "POST", "/crm/v3/objects/notes", {
    properties: {
      hs_note_body: body,
      hs_timestamp: Date.now(),
    },
    associations,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function logEmail(
  apiKey: string,
  contactId: string,
  dealId: string | undefined,
  subject: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const associations: unknown[] = [
    {
      to: { id: contactId },
      types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 198 }],
    },
  ];
  if (dealId) {
    associations.push({
      to: { id: dealId },
      types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 210 }],
    });
  }

  const res = await hs(apiKey, "POST", "/crm/v3/objects/emails", {
    properties: {
      hs_email_direction: "EMAIL",
      hs_email_status: "SENT",
      hs_email_subject: subject,
      hs_email_text: body,
      hs_timestamp: Date.now(),
    },
    associations,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function statusToHubspot(status: Client["status"]): string {
  const map: Record<string, string> = {
    lead: "NEW",
    active: "IN_PROGRESS",
    completed: "OPEN",
    lost: "UNQUALIFIED",
  };
  return map[status] || "NEW";
}

export function projectStatusToDealStage(status: Project["status"]): string {
  const map: Record<string, string> = {
    discovery: "appointmentscheduled",
    measuring: "qualifiedtobuy",
    proposal_draft: "presentationscheduled",
    proposal_sent: "decisionmakerboughtin",
    approved: "contractsent",
    in_progress: "closedwon",
    completed: "closedwon",
    lost: "closedlost",
  };
  return map[status] || "appointmentscheduled";
}
