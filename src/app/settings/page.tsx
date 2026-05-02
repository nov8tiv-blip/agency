"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Input, Textarea, Alert, SectionHeader } from "@/components/ui";
import { getSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function set(path: string, value: string | number) {
    const keys = path.split(".");
    setSettings(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as AppSettings;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = updated;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function testHubSpot() {
    setTesting(true);
    setTestResult("");
    const apiKey = settings.integrations.hubspotApiKey;
    if (!apiKey) { setTestResult("No API key set."); setTesting(false); return; }
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setTestResult(res.ok ? "✓ HubSpot connection successful!" : `✗ HubSpot error ${res.status}`);
    } catch {
      setTestResult("✗ Connection failed. Check API key.");
    }
    setTesting(false);
  }

  async function testEmail() {
    setTesting(true);
    setTestResult("");
    const { gmailUser, gmailAppPassword } = settings.integrations;
    if (!gmailUser || !gmailAppPassword) {
      setTestResult("Gmail credentials not set.");
      setTesting(false);
      return;
    }
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: gmailUser,
          subject: "FenceFlow Test Email",
          html: "<p>Your Gmail integration is working!</p>",
          text: "Your Gmail integration is working!",
          gmailUser,
          gmailAppPassword,
        }),
      });
      setTestResult(res.ok ? "✓ Test email sent to " + gmailUser : `✗ Email error: ${await res.text()}`);
    } catch (e) {
      setTestResult("✗ Failed: " + String(e));
    }
    setTesting(false);
  }

  return (
    <AppLayout>
      <SectionHeader
        title="Settings"
        subtitle="Configure your company info, integrations, and defaults"
        actions={
          <Button onClick={handleSave}>
            {saved ? "✓ Saved!" : "Save Settings"}
          </Button>
        }
      />

      {saved && <Alert type="success" className="mb-6">Settings saved successfully.</Alert>}

      <div className="space-y-6">
        {/* Company Info */}
        <Card title="Company Information">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={settings.company.name}
              onChange={e => set("company.name", e.target.value)}
              placeholder="Your Fencing Company, LLC"
              className="col-span-2"
            />
            <Input
              label="Street Address"
              value={settings.company.address}
              onChange={e => set("company.address", e.target.value)}
              placeholder="123 Main Street"
              className="col-span-2"
            />
            <Input
              label="City"
              value={settings.company.city}
              onChange={e => set("company.city", e.target.value)}
              placeholder="Dallas"
            />
            <Input
              label="State"
              value={settings.company.state}
              onChange={e => set("company.state", e.target.value)}
              placeholder="TX"
              maxLength={2}
            />
            <Input
              label="Zip"
              value={settings.company.zip}
              onChange={e => set("company.zip", e.target.value)}
              placeholder="75001"
            />
            <Input
              label="Phone"
              value={settings.company.phone}
              onChange={e => set("company.phone", e.target.value)}
              placeholder="(555) 555-5555"
            />
            <Input
              label="Email"
              type="email"
              value={settings.company.email}
              onChange={e => set("company.email", e.target.value)}
              placeholder="info@yourcompany.com"
            />
            <Input
              label="Website"
              value={settings.company.website || ""}
              onChange={e => set("company.website", e.target.value)}
              placeholder="https://yourcompany.com"
            />
            <Input
              label="License Number"
              value={settings.company.licenseNumber || ""}
              onChange={e => set("company.licenseNumber", e.target.value)}
              placeholder="TX-12345-FENCE"
            />
          </div>
        </Card>

        {/* HubSpot */}
        <Card title="HubSpot CRM Integration">
          <div className="space-y-4">
            <Alert type="info">
              To get your HubSpot API key: go to HubSpot → Settings → Integrations → Private Apps → Create a private app.
              Grant scopes: <code>crm.objects.contacts.write</code>, <code>crm.objects.deals.write</code>, <code>crm.objects.notes.write</code>, <code>crm.objects.emails.write</code>.
            </Alert>
            <Input
              label="HubSpot Private App Token"
              type="password"
              value={settings.integrations.hubspotApiKey || ""}
              onChange={e => set("integrations.hubspotApiKey", e.target.value)}
              placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              hint="Your HubSpot Private App access token"
            />
            <Input
              label="Pipeline ID (optional)"
              value={settings.integrations.hubspotPipelineId || ""}
              onChange={e => set("integrations.hubspotPipelineId", e.target.value)}
              placeholder="Leave blank for 'default' pipeline"
              hint="Get this from HubSpot CRM Settings → Deals → Pipelines"
            />
            <div className="flex gap-2 items-center">
              <Button variant="secondary" onClick={testHubSpot} loading={testing}>Test Connection</Button>
              {testResult && (
                <span className={`text-sm ${testResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{testResult}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Gmail */}
        <Card title="Gmail Integration">
          <div className="space-y-4">
            <Alert type="info">
              Use a Gmail <strong>App Password</strong> (not your regular password).
              In Google Account → Security → 2-Step Verification → App passwords.
              Generate one for "Mail" on "Windows Computer". The app password is 16 characters with no spaces.
            </Alert>
            <Input
              label="Gmail Address"
              type="email"
              value={settings.integrations.gmailUser || ""}
              onChange={e => set("integrations.gmailUser", e.target.value)}
              placeholder="yourcompany@gmail.com"
            />
            <Input
              label="Gmail App Password"
              type="password"
              value={settings.integrations.gmailAppPassword || ""}
              onChange={e => set("integrations.gmailAppPassword", e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx (16-char app password)"
              hint="This is NOT your regular Gmail password. Generate an App Password in Google Account settings."
            />
            <div className="flex gap-2 items-center">
              <Button variant="secondary" onClick={testEmail} loading={testing}>Send Test Email</Button>
              {testResult && (
                <span className={`text-sm ${testResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{testResult}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Review Links */}
        <Card title="Review Request Links">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Google Review URL"
              value={settings.integrations.googleReviewUrl || ""}
              onChange={e => set("integrations.googleReviewUrl", e.target.value)}
              placeholder="https://g.page/r/your-business/review"
              hint="Get this from your Google Business Profile"
            />
            <Input
              label="Yelp Business URL"
              value={settings.integrations.yelpUrl || ""}
              onChange={e => set("integrations.yelpUrl", e.target.value)}
              placeholder="https://www.yelp.com/biz/your-business"
            />
          </div>
        </Card>

        {/* Proposal Defaults */}
        <Card title="Proposal Defaults">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Default Tax Rate (%)"
              type="number"
              step="0.25"
              value={settings.proposal.defaultTaxRate}
              onChange={e => set("proposal.defaultTaxRate", parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Default Valid Days"
              type="number"
              value={settings.proposal.defaultValidDays}
              onChange={e => set("proposal.defaultValidDays", parseInt(e.target.value) || 30)}
            />
            <Input
              label="Default Deposit (%)"
              type="number"
              step={5}
              value={settings.proposal.defaultDepositPercent}
              onChange={e => set("proposal.defaultDepositPercent", parseInt(e.target.value) || 50)}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Default Terms & Conditions"
              value={settings.proposal.defaultTerms}
              onChange={e => set("proposal.defaultTerms", e.target.value)}
              rows={5}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Default Proposal Notes"
              value={settings.proposal.defaultNotes || ""}
              onChange={e => set("proposal.defaultNotes", e.target.value)}
              rows={3}
              placeholder="Optional notes that appear on every proposal..."
            />
          </div>
        </Card>

        {/* Pricing */}
        <Card title="Default Pricing">
          <Alert type="info" className="mb-4">
            These are your default rates. You can override them on individual proposals.
          </Alert>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="Labor Rate (per linear foot)"
              type="number"
              step="0.5"
              value={settings.pricing.laborRatePerFoot}
              onChange={e => set("pricing.laborRatePerFoot", parseFloat(e.target.value) || 0)}
              hint="Installation labor per lf of fence"
            />
            <Input
              label="Removal Rate (per linear foot)"
              type="number"
              step="0.5"
              value={settings.pricing.removalRatePerFoot}
              onChange={e => set("pricing.removalRatePerFoot", parseFloat(e.target.value) || 0)}
              hint="Old fence removal & disposal per lf"
            />
            <Input
              label="Permit Flat Fee"
              type="number"
              step={25}
              value={settings.pricing.permitFlatFee}
              onChange={e => set("pricing.permitFlatFee", parseFloat(e.target.value) || 0)}
              hint="If permit is required"
            />
            <Input
              label="Fuel Surcharge ($)"
              type="number"
              step={5}
              value={settings.pricing.fuelSurcharge}
              onChange={e => set("pricing.fuelSurcharge", parseFloat(e.target.value) || 0)}
              hint="Added to every proposal if > 0"
            />
            <Input
              label="Material Markup (%)"
              type="number"
              step={1}
              value={settings.pricing.markupPercent}
              onChange={e => set("pricing.markupPercent", parseFloat(e.target.value) || 0)}
              hint="Markup % added to raw material costs"
            />
          </div>
        </Card>

        <div className="flex justify-end pb-8">
          <Button size="lg" onClick={handleSave}>
            {saved ? "✓ Saved!" : "Save All Settings"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
