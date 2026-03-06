"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type SprintInvoice = {
  id: string;
  sprint_id: string;
  label: string;
  invoice_url: string | null;
  invoice_status: string;
  invoice_pdf_url: string | null;
  amount: number | null;
  sort_order: number;
  stripe_invoice_id: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectMember = { email: string; name: string | null };

type Props = {
  invoice: SprintInvoice;
  sprintId: string;
  sprintTitle: string | null;
  clientEmail: string | null;
  adminEmail: string;
  adminRole?: string;
  projectMembers?: ProjectMember[];
  onClose: () => void;
  onUpdate: (invoice: SprintInvoice) => void;
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    client:  "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
    admin:   "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
    lead:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
    member:  "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400",
  };
  const label: Record<string, string> = {
    client: "Client",
    admin:  "Admin",
    lead:   "Lead",
    member: "Member",
  };
  const cls = styles[role] ?? styles.member;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide leading-none ${cls}`}>
      {label[role] ?? role}
    </span>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
        checked
          ? "bg-indigo-600 border-indigo-600"
          : "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </div>
  );
}

type Step = "idle" | "generated" | "sent";

function deriveStep(inv: SprintInvoice): Step {
  if (inv.invoice_status === "sent" || inv.invoice_status === "paid") return "sent";
  if (inv.stripe_invoice_id) return "generated";
  return "idle";
}

function EmailPreview({
  label,
  amount,
  sprintTitle,
  clientEmail,
}: {
  label: string;
  amount: number | null;
  sprintTitle: string | null;
  clientEmail: string | null;
}) {
  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden text-left">
      {/* Email meta bar */}
      <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-3 py-2 space-y-0.5">
        <p className="text-[11px] text-text-muted leading-tight">
          <span className="font-medium text-text-secondary">From:</span> Stripe (on behalf of Meisner Design)
        </p>
        {clientEmail && (
          <p className="text-[11px] text-text-muted leading-tight">
            <span className="font-medium text-text-secondary">To:</span> {clientEmail}
          </p>
        )}
        <p className="text-[11px] text-text-muted leading-tight">
          <span className="font-medium text-text-secondary">Subject:</span>{" "}
          {label}{sprintTitle ? ` — ${sprintTitle}` : ""}
        </p>
      </div>

      {/* Email body */}
      <div className="bg-white dark:bg-neutral-900 px-4 py-3 space-y-3">
        <p className="text-xs text-text-primary">Hi there,</p>
        <p className="text-xs text-text-secondary">
          You have a new invoice ready for payment.
        </p>

        {/* Invoice detail table */}
        <div className="rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="flex items-start justify-between bg-neutral-50 dark:bg-neutral-800 px-3 py-2 gap-2">
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Invoice</p>
              <p className="text-xs font-semibold text-text-primary">{label}</p>
              {sprintTitle && (
                <p className="text-[10px] text-text-muted mt-0.5">{sprintTitle}</p>
              )}
            </div>
            {amount != null && (
              <div className="text-right shrink-0">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Amount</p>
                <p className="text-xs font-semibold tabular-nums text-text-primary">{formatCurrency(amount)}</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA button */}
        <div>
          <span className="inline-block bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[11px] font-semibold px-4 py-1.5 rounded cursor-default">
            Pay Invoice
          </span>
        </div>

        <p className="text-[10px] text-text-muted">
          Powered by Stripe
        </p>
      </div>
    </div>
  );
}

export default function StripeInvoiceModal({
  invoice: initialInvoice,
  sprintId,
  sprintTitle,
  clientEmail,
  adminEmail,
  adminRole = "admin",
  projectMembers,
  onClose,
  onUpdate,
}: Props) {
  const [invoice, setInvoice] = useState<SprintInvoice>(initialInvoice);
  const [step, setStep] = useState<Step>(deriveStep(initialInvoice));
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingDraft, setSendingDraft] = useState(false);
  const [draftSentTo, setDraftSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ccAdmin, setCcAdmin] = useState(true);
  const [showEmailPreview, setShowEmailPreview] = useState(true);

  // Determine which people to show as studio-branded email checkboxes.
  // If project members exist, use those (pre-checked). Otherwise fall back to the
  // single clientEmail as a legacy opt-in row (unchecked by default).
  const hasProjectMembers = (projectMembers?.length ?? 0) > 0;
  const studioEmailMembers: ProjectMember[] = hasProjectMembers
    ? projectMembers!
    : clientEmail
      ? [{ email: clientEmail, name: null }]
      : [];

  // The email that will receive the Stripe invoice directly. Defaults to
  // clientEmail (the sprint's primary contact), but can be overridden via
  // dropdown when multiple project members are available.
  const stripeEmailOptions: ProjectMember[] = hasProjectMembers
    ? projectMembers!
    : clientEmail
      ? [{ email: clientEmail, name: null }]
      : [];
  const defaultStripeEmail = clientEmail ?? stripeEmailOptions[0]?.email ?? null;
  const [selectedStripeEmail, setSelectedStripeEmail] = useState<string | null>(defaultStripeEmail);

  const [checkedMembers, setCheckedMembers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const m of studioEmailMembers) {
      // Pre-check project members; keep legacy single-email row unchecked (matching old default)
      init[m.email] = hasProjectMembers;
    }
    return init;
  });

  const toggleMember = (email: string, checked: boolean) =>
    setCheckedMembers((prev) => ({ ...prev, [email]: checked }));

  const ccClientEmails = studioEmailMembers
    .filter((m) => checkedMembers[m.email])
    .map((m) => m.email);

  const updateInvoice = (updated: SprintInvoice) => {
    setInvoice(updated);
    onUpdate(updated);
  };

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/sprint-drafts/${sprintId}/invoices/${invoice.id}/stripe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate", recipientEmail: selectedStripeEmail }),
        }
      );
      const data = await res.json() as { invoice?: SprintInvoice; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to generate Stripe link");
      updateInvoice(data.invoice!);
      setStep("generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate Stripe link");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    setError(null);
    setSending(true);
    try {
      const res = await fetch(
        `/api/sprint-drafts/${sprintId}/invoices/${invoice.id}/stripe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send", ccAdmin, ccClientEmails }),
        }
      );
      const data = await res.json() as { invoice?: SprintInvoice; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to send invoice");
      updateInvoice(data.invoice!);
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  const handleSendDraft = async () => {
    setError(null);
    setSendingDraft(true);
    try {
      const res = await fetch(
        `/api/sprint-drafts/${sprintId}/invoices/${invoice.id}/stripe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send_draft" }),
        }
      );
      const data = await res.json() as { success?: boolean; sentTo?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to send draft");
      setDraftSentTo(data.sentTo ?? adminEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send draft");
    } finally {
      setSendingDraft(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </span>
            <h2 className={getTypographyClassName("h3")}>Send via Stripe</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* Invoice summary */}
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`${getTypographyClassName("body-sm")} font-semibold`}>{invoice.label}</p>
                {sprintTitle && (
                  <p className={`${getTypographyClassName("body-sm")} text-text-muted mt-0.5`}>{sprintTitle}</p>
                )}
              </div>
              {invoice.amount != null && (
                <span className={`${getTypographyClassName("body-sm")} font-semibold tabular-nums shrink-0`}>
                  {formatCurrency(invoice.amount)}
                </span>
              )}
            </div>
          </div>

          {/* Recipients */}
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50">
              <p className={`${getTypographyClassName("body-sm")} font-medium text-text-secondary`}>Recipients</p>
            </div>

            {/* Row: Stripe → client (always sent by Stripe directly) */}
            <div className="px-3 py-2.5 flex items-start gap-3">
              <div className="pt-0.5 shrink-0">
                <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                {stripeEmailOptions.length > 1 && step === "idle" ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedStripeEmail ?? ""}
                      onChange={(e) => setSelectedStripeEmail(e.target.value || null)}
                      className={`${getTypographyClassName("body-sm")} font-medium text-text-primary bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-0.5 pr-6 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 truncate max-w-full`}
                    >
                      {stripeEmailOptions.map((m) => (
                        <option key={m.email} value={m.email}>
                          {m.name ? `${m.name} (${m.email})` : m.email}
                        </option>
                      ))}
                    </select>
                    <RoleBadge role="client" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedStripeEmail ? (
                      <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>{selectedStripeEmail}</span>
                    ) : (
                      <span className={`${getTypographyClassName("body-sm")} text-text-muted italic`}>No client email on file</span>
                    )}
                    <RoleBadge role="client" />
                  </div>
                )}
                <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>Stripe invoice email — always sent</p>
              </div>
            </div>

            {/* Row: Admin CC checkbox */}
            <label className="px-3 py-2.5 flex items-start gap-3 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
              <div className="pt-0.5 shrink-0">
                <Checkbox checked={ccAdmin} onChange={setCcAdmin} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>{adminEmail || "you"}</span>
                  <RoleBadge role={adminRole} />
                </div>
                <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>Studio notification — send me a copy</p>
              </div>
            </label>

            {/* Rows: Studio-branded email checkboxes — one per project member (or single legacy row) */}
            {studioEmailMembers.length > 0 ? (
              studioEmailMembers.map((member) => (
                <label
                  key={member.email}
                  className="px-3 py-2.5 flex items-start gap-3 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                >
                  <div className="pt-0.5 shrink-0">
                    <Checkbox
                      checked={checkedMembers[member.email] ?? false}
                      onChange={(v) => toggleMember(member.email, v)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>
                        {member.name ?? member.email}
                      </span>
                      {member.name && (
                        <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>{member.email}</span>
                      )}
                      <RoleBadge role="client" />
                    </div>
                    <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>
                      Studio-branded email with sprint context — in addition to Stripe&apos;s
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <div className="px-3 py-2.5 flex items-start gap-3">
                <div className="pt-0.5 shrink-0 w-4" />
                <div className="flex-1 min-w-0">
                  <span className={`${getTypographyClassName("body-sm")} text-text-muted italic`}>No client email on file</span>
                  <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>
                    Studio-branded email with sprint context — in addition to Stripe&apos;s
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Email preview toggle */}
          <div>
            <button
              onClick={() => setShowEmailPreview((v) => !v)}
              className={`${getTypographyClassName("body-sm")} flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors w-full text-left`}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showEmailPreview ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              {showEmailPreview ? "Hide" : "Preview"} email
            </button>

            {showEmailPreview && (
              <div className="mt-2">
                <EmailPreview
                  label={invoice.label}
                  amount={invoice.amount}
                  sprintTitle={sprintTitle}
                  clientEmail={selectedStripeEmail}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
              <p className={`${getTypographyClassName("body-sm")} text-red-700 dark:text-red-400`}>{error}</p>
            </div>
          )}

          {/* Step 1: Generate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 ${
                step !== "idle"
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  : "bg-neutral-200 dark:bg-neutral-700 text-text-muted"
              }`}>
                {step !== "idle" ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : "1"}
              </span>
              <p className={`${getTypographyClassName("body-sm")} font-medium`}>Generate Stripe link</p>
            </div>

            {step === "idle" ? (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className={`${getTypographyClassName("button-sm")} w-full h-9 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5`}
              >
                {generating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    Generate Stripe Link
                  </>
                )}
              </button>
            ) : (
              invoice.invoice_url && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 px-3 py-2">
                  <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <a
                    href={invoice.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${getTypographyClassName("body-sm")} text-green-700 dark:text-green-400 hover:underline truncate`}
                  >
                    {invoice.invoice_url}
                  </a>
                  <span className="opacity-40 text-xs shrink-0">↗</span>
                </div>
              )
            )}
          </div>

          {/* Step 2: Send */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 ${
                step === "sent"
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  : "bg-neutral-200 dark:bg-neutral-700 text-text-muted"
              }`}>
                {step === "sent" ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : "2"}
              </span>
              <p className={`${getTypographyClassName("body-sm")} font-medium`}>Send to client</p>
            </div>

            {step === "sent" ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 px-3 py-2">
                <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <p className={`${getTypographyClassName("body-sm")} text-green-700 dark:text-green-400`}>
                  Invoice sent to {selectedStripeEmail ?? "client"}
                </p>
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={step !== "generated" || sending}
                className={`${getTypographyClassName("button-sm")} w-full h-9 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  step === "generated"
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50"
                    : "bg-neutral-100 dark:bg-neutral-800 text-text-muted cursor-not-allowed opacity-50"
                }`}
              >
                {sending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Send Invoice to Client
                  </>
                )}
              </button>
            )}
          </div>

          {/* Send Draft divider */}
          {step !== "idle" && (
            <div className="pt-1">
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
                <span className={`${getTypographyClassName("body-sm")} text-text-muted px-2 bg-white dark:bg-gray-900`}>or</span>
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
              </div>
              <div className="mt-2 space-y-1.5">
                {draftSentTo ? (
                  <div className="flex items-center gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <p className={`${getTypographyClassName("body-sm")} text-blue-700 dark:text-blue-400`}>
                      Draft sent to {draftSentTo}
                    </p>
                    <button
                      onClick={() => setDraftSentTo(null)}
                      className="ml-auto text-blue-400 dark:text-blue-600 hover:text-blue-600 dark:hover:text-blue-400 text-xs"
                    >
                      Resend
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSendDraft}
                    disabled={sendingDraft}
                    className={`${getTypographyClassName("button-sm")} w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5`}
                  >
                    {sendingDraft ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending draft...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        Send Draft to Me
                        <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>({adminEmail})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-b-lg shrink-0">
          <button
            onClick={onClose}
            className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
          >
            {step === "sent" ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
