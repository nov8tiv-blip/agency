"use client";

import { useState } from "react";
import { saveQuickQuote, generateId, getSettings } from "@/lib/storage";
import { estimateQuickQuote, FENCE_TYPE_LABELS } from "@/lib/quote-estimator";
import { sendQuickQuoteEmail } from "@/lib/actions";
import type { FenceType, QuickQuote } from "@/lib/types";

const FENCE_TYPES: FenceType[] = ["wood", "vinyl", "chain_link", "iron", "aluminum", "composite"];
const HEIGHTS = [4, 5, 6, 8];

type Step = "form" | "result";

export default function QuickQuotePage() {
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [savedQuote, setSavedQuote] = useState<QuickQuote | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [fenceType, setFenceType] = useState<FenceType>("wood");
  const [linearFeet, setLinearFeet] = useState(100);
  const [fenceHeight, setFenceHeight] = useState(6);
  const [gateCount, setGateCount] = useState(1);
  const [existingRemoval, setExistingRemoval] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email required";
    if (!phone.trim()) e.phone = "Required";
    if (!city.trim()) e.city = "Required";
    if (!state.trim()) e.state = "Required";
    if (linearFeet < 10) e.linearFeet = "Minimum 10 feet";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    const est = estimateQuickQuote(fenceType, linearFeet, gateCount, existingRemoval);
    const now = new Date().toISOString();
    const quote: QuickQuote = {
      id: generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      state: state.trim(),
      fenceType,
      linearFeet,
      fenceHeight,
      gateCount,
      existingRemoval,
      removalFeet: existingRemoval ? linearFeet : undefined,
      estimateMin: est.min,
      estimateMax: est.max,
      status: "new",
      source: "web_form",
      createdAt: now,
      updatedAt: now,
    };

    saveQuickQuote(quote);

    // Try to send confirmation email if Gmail is configured
    const settings = getSettings();
    if (settings.integrations.gmailUser && settings.integrations.gmailAppPassword && email) {
      await sendQuickQuoteEmail(quote, settings);
    }

    setSavedQuote(quote);
    setStep("result");
    setSubmitting(false);
  }

  const settings = getSettings();
  const co = settings.company;

  if (step === "result" && savedQuote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Estimate is Ready!</h1>
          <p className="text-gray-500 mb-6">Thank you, {savedQuote.firstName}. Here&apos;s your free fencing estimate:</p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="text-sm text-blue-600 font-medium mb-1">{FENCE_TYPE_LABELS[savedQuote.fenceType]} · {savedQuote.linearFeet} lf · {savedQuote.fenceHeight}ft tall</div>
            <div className="text-3xl font-bold text-blue-900">
              ${savedQuote.estimateMin.toLocaleString()} – ${savedQuote.estimateMax.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 mt-1">Estimated installed cost</div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            {savedQuote.email
              ? `A copy has been sent to ${savedQuote.email}.`
              : ""}
            {" "}This is a rough estimate — final pricing requires an on-site visit.
          </p>

          <div className="space-y-3">
            {co.phone && (
              <a
                href={`tel:${co.phone}`}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Call Us: {co.phone}
              </a>
            )}
            <button
              onClick={() => { setStep("form"); setSavedQuote(null); }}
              className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Start a New Estimate
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{co.name || "Fencing"} Quick Quote</h1>
          <p className="text-gray-500 text-sm mt-1">Get an instant estimate in seconds — no commitment required</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Your Contact Info</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? "border-red-400" : "border-gray-300"}`}
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? "border-red-400" : "border-gray-300"}`}
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div className="mt-3">
              <input
                type="email"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-400" : "border-gray-300"}`}
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="mt-3">
              <input
                type="tel"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-400" : "border-gray-300"}`}
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? "border-red-400" : "border-gray-300"}`}
                  placeholder="City"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.state ? "border-red-400" : "border-gray-300"}`}
                  placeholder="State (TX)"
                  maxLength={2}
                  value={state}
                  onChange={e => setState(e.target.value.toUpperCase())}
                />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
            </div>
          </div>

          {/* Fence details */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Fence Details</h2>

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1.5">Fence Type</label>
              <div className="grid grid-cols-3 gap-2">
                {FENCE_TYPES.map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setFenceType(ft)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      fenceType === ft
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {FENCE_TYPE_LABELS[ft]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Linear Feet <span className="text-blue-600 font-semibold">{linearFeet} lf</span>
                </label>
                <input
                  type="range" min={10} max={1000} step={10}
                  value={linearFeet}
                  onChange={e => setLinearFeet(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10</span><span>1,000</span></div>
                {errors.linearFeet && <p className="text-red-500 text-xs">{errors.linearFeet}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Height</label>
                <div className="flex gap-1.5 flex-wrap">
                  {HEIGHTS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setFenceHeight(h)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        fenceHeight === h
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-200 text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      {h}ft
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Gates <span className="text-blue-600 font-semibold">{gateCount}</span>
                </label>
                <input
                  type="range" min={0} max={8} step={1}
                  value={gateCount}
                  onChange={e => setGateCount(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>0</span><span>8</span></div>
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={existingRemoval}
                    onChange={e => setExistingRemoval(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">Remove existing fence</span>
                </label>
              </div>
            </div>
          </div>

          {/* Live estimate preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            {(() => {
              const est = estimateQuickQuote(fenceType, linearFeet, gateCount, existingRemoval);
              return (
                <>
                  <div className="text-xs text-blue-600 font-medium mb-0.5">Estimated Range</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ${est.min.toLocaleString()} – ${est.max.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-500 mt-0.5">
                    {FENCE_TYPE_LABELS[fenceType]} · {linearFeet} lf · {fenceHeight}ft
                    {gateCount > 0 ? ` · ${gateCount} gate${gateCount > 1 ? "s" : ""}` : ""}
                    {existingRemoval ? " · includes removal" : ""}
                  </div>
                </>
              );
            })()}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {submitting ? "Submitting…" : "Get My Free Estimate"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            No spam. We&apos;ll only contact you about your estimate.
          </p>
        </form>
      </div>
    </div>
  );
}
