"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Textarea, Card, Alert } from "@/components/ui";
import { saveClient, saveProject, generateId } from "@/lib/storage";
import { syncClientToHubSpot, syncProjectToHubSpot } from "@/lib/actions";
import { getSettings } from "@/lib/storage";
import type { Client, Project } from "@/lib/types";

const STEPS = ["Contact Info", "Property & Source", "First Meeting"];

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hsStatus, setHsStatus] = useState<string>("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    altPhone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    type: "residential" as "residential" | "commercial",
    source: "",
    notes: "",
    // Meeting
    meetingDate: new Date().toISOString().split("T")[0],
    meetingTime: "",
    siteAddress: "",
    siteCity: "",
    siteState: "",
    siteZip: "",
    propertyType: "residential" as "residential" | "commercial" | "hoa" | "municipal",
    existingFence: "false",
    existingFenceDescription: "",
    removalNeeded: "false",
    soilType: "normal" as "normal" | "clay" | "sandy" | "rocky" | "mixed",
    terrain: "flat" as "flat" | "slight_slope" | "moderate_slope" | "steep" | "mixed",
    accessNotes: "",
    clientNotes: "",
    internalNotes: "",
    permitRequired: "false",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function useSiteAsHome() {
    set("siteAddress", form.address);
    set("siteCity", form.city);
    set("siteState", form.state);
    set("siteZip", form.zip);
  }

  const canAdvance = [
    form.firstName && form.lastName && form.phone,
    form.address && form.city && form.state && form.zip,
    form.meetingDate,
  ][step];

  async function handleSave() {
    setSaving(true);
    const now = new Date().toISOString();
    const clientId = generateId();
    const projectId = generateId();

    const client: Client = {
      id: clientId,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      altPhone: form.altPhone || undefined,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      type: form.type,
      status: "lead",
      source: form.source || undefined,
      notes: form.notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const siteAddr = form.siteAddress || form.address;
    const project: Project = {
      id: projectId,
      clientId,
      name: `${form.firstName} ${form.lastName} - Fencing Project`,
      status: "discovery",
      discovery: {
        meetingDate: form.meetingDate,
        meetingTime: form.meetingTime || undefined,
        siteAddress: siteAddr,
        siteCity: form.siteCity || form.city,
        siteState: form.siteState || form.state,
        siteZip: form.siteZip || form.zip,
        propertyType: form.propertyType,
        existingFence: form.existingFence === "true",
        existingFenceDescription: form.existingFenceDescription || undefined,
        removalNeeded: form.removalNeeded === "true",
        permitRequired: form.permitRequired === "true",
        soilType: form.soilType,
        terrain: form.terrain,
        accessNotes: form.accessNotes || undefined,
        clientNotes: form.clientNotes || undefined,
        internalNotes: form.internalNotes || undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    saveClient(client);
    saveProject(project);

    // Sync to HubSpot
    const settings = getSettings();
    if (settings.integrations.hubspotApiKey) {
      setHsStatus("Syncing to HubSpot...");
      const syncRes = await syncProjectToHubSpot(client, project, settings);
      if (syncRes.ok) {
        client.hubspotContactId = syncRes.contactId;
        project.hubspotDealId = syncRes.dealId;
        saveClient(client);
        saveProject(project);
        setHsStatus("Synced to HubSpot!");
      } else {
        setHsStatus(`HubSpot sync failed: ${syncRes.error}`);
      }
    }

    setSaving(false);
    router.push(`/clients/${clientId}/project/${projectId}/fencing`);
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === step ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        <Card title={STEPS[step]}>
          {/* Step 0: Contact Info */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name *" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="John" />
              <Input label="Last Name *" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Smith" />
              <Input label="Phone *" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 555-5555" />
              <Input label="Alt Phone" type="tel" value={form.altPhone} onChange={(e) => set("altPhone", e.target.value)} placeholder="(555) 555-5555" />
              <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" className="col-span-2" />
              <Textarea label="Internal Notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="col-span-2" placeholder="Initial contact notes..." />
            </div>
          )}

          {/* Step 1: Property & Source */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Street Address *" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St" className="col-span-2" />
              <Input label="City *" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Dallas" />
              <Input label="State *" value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="TX" maxLength={2} />
              <Input label="Zip *" value={form.zip} onChange={(e) => set("zip", e.target.value)} placeholder="75001" />
              <Select
                label="Client Type"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                options={[
                  { value: "residential", label: "Residential" },
                  { value: "commercial", label: "Commercial" },
                ]}
              />
              <Select
                label="How did they find us?"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                options={[
                  { value: "", label: "Select source..." },
                  { value: "Google", label: "Google Search" },
                  { value: "Yelp", label: "Yelp" },
                  { value: "Facebook", label: "Facebook" },
                  { value: "Instagram", label: "Instagram" },
                  { value: "Nextdoor", label: "Nextdoor" },
                  { value: "Referral", label: "Referral / Word of Mouth" },
                  { value: "Yard Sign", label: "Yard Sign" },
                  { value: "Repeat Customer", label: "Repeat Customer" },
                  { value: "Other", label: "Other" },
                ]}
                className="col-span-2"
              />
            </div>
          )}

          {/* Step 2: First Meeting */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Meeting Date *" type="date" value={form.meetingDate} onChange={(e) => set("meetingDate", e.target.value)} />
              <Input label="Meeting Time" type="time" value={form.meetingTime} onChange={(e) => set("meetingTime", e.target.value)} />

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Site Address</label>
                  <button type="button" onClick={useSiteAsHome} className="text-xs text-blue-600 hover:text-blue-700">
                    Same as billing address
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input value={form.siteAddress} onChange={(e) => set("siteAddress", e.target.value)} placeholder="Site street address" className="col-span-2" />
                  <Input value={form.siteCity} onChange={(e) => set("siteCity", e.target.value)} placeholder="City" />
                  <Input value={form.siteState} onChange={(e) => set("siteState", e.target.value)} placeholder="ST" maxLength={2} />
                </div>
              </div>

              <Select
                label="Property Type"
                value={form.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
                options={[
                  { value: "residential", label: "Residential" },
                  { value: "commercial", label: "Commercial" },
                  { value: "hoa", label: "HOA / Community" },
                  { value: "municipal", label: "Municipal / Government" },
                ]}
              />
              <Select
                label="Soil Type"
                value={form.soilType}
                onChange={(e) => set("soilType", e.target.value)}
                options={[
                  { value: "normal", label: "Normal / Loam" },
                  { value: "clay", label: "Clay" },
                  { value: "sandy", label: "Sandy" },
                  { value: "rocky", label: "Rocky" },
                  { value: "mixed", label: "Mixed" },
                ]}
              />
              <Select
                label="Terrain"
                value={form.terrain}
                onChange={(e) => set("terrain", e.target.value)}
                options={[
                  { value: "flat", label: "Flat" },
                  { value: "slight_slope", label: "Slight Slope" },
                  { value: "moderate_slope", label: "Moderate Slope" },
                  { value: "steep", label: "Steep" },
                  { value: "mixed", label: "Mixed" },
                ]}
              />
              <Select
                label="Existing Fence?"
                value={form.existingFence}
                onChange={(e) => set("existingFence", e.target.value)}
                options={[
                  { value: "false", label: "No" },
                  { value: "true", label: "Yes" },
                ]}
              />
              {form.existingFence === "true" && (
                <>
                  <Select
                    label="Removal Needed?"
                    value={form.removalNeeded}
                    onChange={(e) => set("removalNeeded", e.target.value)}
                    options={[
                      { value: "false", label: "No" },
                      { value: "true", label: "Yes" },
                    ]}
                  />
                  <Textarea
                    label="Existing Fence Description"
                    value={form.existingFenceDescription}
                    onChange={(e) => set("existingFenceDescription", e.target.value)}
                    rows={2}
                    placeholder="Type, condition, material..."
                    className="col-span-2"
                  />
                </>
              )}
              <Select
                label="Permit Required?"
                value={form.permitRequired}
                onChange={(e) => set("permitRequired", e.target.value)}
                options={[
                  { value: "false", label: "Unknown / No" },
                  { value: "true", label: "Yes" },
                ]}
              />
              <Textarea
                label="What Client Wants"
                value={form.clientNotes}
                onChange={(e) => set("clientNotes", e.target.value)}
                rows={3}
                placeholder="Client described wanting 6' wood privacy fence along back yard..."
                className="col-span-2"
              />
              <Textarea
                label="Internal Notes"
                value={form.internalNotes}
                onChange={(e) => set("internalNotes", e.target.value)}
                rows={3}
                placeholder="Notes for our team only..."
                className="col-span-2"
              />
              <Textarea
                label="Access Notes"
                value={form.accessNotes}
                onChange={(e) => set("accessNotes", e.target.value)}
                rows={2}
                placeholder="Gate code, access restrictions..."
                className="col-span-2"
              />
            </div>
          )}

          {hsStatus && (
            <div className="mt-4">
              <Alert type={hsStatus.includes("fail") ? "error" : "info"}>{hsStatus}</Alert>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} loading={saving} disabled={!canAdvance || saving}>
                Save & Add Fence Specs
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
