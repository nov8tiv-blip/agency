import { NextRequest, NextResponse } from "next/server";
import {
  createOrUpdateContact,
  createDeal,
  updateDeal,
  addNote,
  logEmail,
  projectStatusToDealStage,
} from "@/lib/hubspot";
import type { Client, Project } from "@/lib/types";

export interface HubSpotSyncRequest {
  action: "sync_client" | "sync_deal" | "add_note" | "log_email" | "update_stage";
  apiKey: string;
  client: Client;
  project?: Project;
  note?: string;
  emailSubject?: string;
  emailBody?: string;
  pipelineId?: string;
}

export async function POST(req: NextRequest) {
  const body: HubSpotSyncRequest = await req.json();
  const { action, apiKey, client, project, note, emailSubject, emailBody, pipelineId } = body;

  if (!apiKey) {
    return NextResponse.json({ error: "HubSpot API key not configured." }, { status: 400 });
  }

  switch (action) {
    case "sync_client": {
      const res = await createOrUpdateContact(apiKey, client);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
      return NextResponse.json({ ok: true, contactId: res.contactId });
    }

    case "sync_deal": {
      if (!project) return NextResponse.json({ error: "project required" }, { status: 400 });
      const contactRes = await createOrUpdateContact(apiKey, client);
      if (!contactRes.ok) return NextResponse.json({ error: contactRes.error }, { status: 500 });
      const contactId = contactRes.contactId!;

      if (project.hubspotDealId) {
        const stage = projectStatusToDealStage(project.status);
        const updateRes = await updateDeal(apiKey, project.hubspotDealId, { dealstage: stage });
        return updateRes.ok
          ? NextResponse.json({ ok: true, contactId, dealId: project.hubspotDealId })
          : NextResponse.json({ error: updateRes.error }, { status: 500 });
      }

      const dealRes = await createDeal(apiKey, client, project, contactId, pipelineId);
      return dealRes.ok
        ? NextResponse.json({ ok: true, contactId, dealId: dealRes.dealId })
        : NextResponse.json({ error: dealRes.error }, { status: 500 });
    }

    case "add_note": {
      if (!note) return NextResponse.json({ error: "note required" }, { status: 400 });
      const contactRes = await createOrUpdateContact(apiKey, client);
      if (!contactRes.ok) return NextResponse.json({ error: contactRes.error }, { status: 500 });
      const addRes = await addNote(apiKey, contactRes.contactId!, project?.hubspotDealId, note);
      return addRes.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: addRes.error }, { status: 500 });
    }

    case "log_email": {
      if (!emailSubject || !emailBody) return NextResponse.json({ error: "emailSubject and emailBody required" }, { status: 400 });
      const contactRes = await createOrUpdateContact(apiKey, client);
      if (!contactRes.ok) return NextResponse.json({ error: contactRes.error }, { status: 500 });
      const logRes = await logEmail(apiKey, contactRes.contactId!, project?.hubspotDealId, emailSubject, emailBody);
      return logRes.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: logRes.error }, { status: 500 });
    }

    case "update_stage": {
      if (!project?.hubspotDealId) return NextResponse.json({ error: "No deal ID on project" }, { status: 400 });
      const stage = projectStatusToDealStage(project.status);
      const res = await updateDeal(apiKey, project.hubspotDealId, { dealstage: stage });
      return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: res.error }, { status: 500 });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
