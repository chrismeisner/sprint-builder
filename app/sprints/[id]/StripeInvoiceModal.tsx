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
  stripe_recipient_email: string | null;
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
  onDeleted?: (invoiceId: string) => void;
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
  if (["sent", "paid", "processing"].includes(inv.invoice_status)) return "sent";
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
  onDeleted,
}: Props) {
  const [invoice, setInvoice] = useState<SprintInvoice>(initialInvoice);
  const [step, setStep] = useState<Step>(deriveStep(initialInvoice));
  const [generating, setGenerating] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [sending, setSending] = useState(false);
  const [achOnly, setAchOnly] = useState(true);
  const [confirmSend, setConfirmSend] = useState(false);
  const [sendingDraft, setSendingDraft] = useState(false);
  const [draftSentTo, setDraftSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [ccAdmin, setCcAdmin] = useState(true);
  const [showEmailPreview, setShowEmailPreview] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<"changed" | "current" | null>(null);

  // Determine which people to show as studio-branded email checkboxes.
  // If project members exist, use those (pre-checked). Otherwise fall back to the
  // single clientEmail as a legacy opt-in row (unchecked by default).
  const hasProjectMembers = (projectMembers?.length ?? 0) > 0;
  const studioEmailMembers: ProjectMember[] = hasProjectMembers
    ? projectMembers!
    : clientEmail
      ? [{ email: clientEmail, name: null }]
      : [];

  // Must be declared after studioEmailMembers/hasProjectMembers to avoid TDZ error
  const [cancelCheckedMembers, setCancelCheckedMembers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const m of studioEmailMembers) {
      init[m.email] = hasProjectMembers;
    }
    return init;
  });

  // The email that will receive the Stripe invoice directly. Defaults to
  // clientEmail (the sprint's primary contact), but can be overridden via
  // dropdown when multiple project members are available.
  const stripeEmailOptions: ProjectMember[] = hasProjectMembers
    ? projectMembers!
    : clientEmail
      ? [{ email: clientEmail, name: null }]
      : [];
  const defaultStripeEmail = initialInvoice.stripe_recipient_email ?? clientEmail ?? stripeEmailOptions[0]?.email ?? null;
  const [selectedStripeEmail, setSelectedStripeEmail] = useState<string | null>(defaultStripeEmail);

  // Due date — defaults to 14 days from today
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

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
          body: JSON.stringify({ action: "generate", recipientEmail: selectedStripeEmail, dueDate, achOnly }),
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

  const handleVoid = async () => {
    setError(null);
    setVoiding(true);
    try {
      const res = await fetch(
        `/api/sprint-drafts/${sprintId}/invoices/${invoice.id}/stripe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "void" }),
        }
      );
      const data = await res.json() as { invoice?: SprintInvoice; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to void Stripe invoice");
      updateInvoice(data.invoice!);
      setStep("idle");
      setConfirmSend(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to void Stripe invoice");
    } finally {
      setVoiding(false);
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
          body: JSON.stringify({ action: "send", ccAdmin, ccClientEmails, recipientEmail: selectedStripeEmail }),
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

  const handleCancel = async () => {
    setError(null);
    setCancelling(true);
    try {
      const res = await fetch(
        `/api/sprint-drafts/${sprintId}/invoices/${invoice.id}/stripe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cancel",
            cancelClientEmails: studioEmailMembers.filter((m) => cancelCheckedMembers[m.email]).map((m) => m.email),
            cancelMessage: cancelMessage.trim() || null,
          }),
        }
      );
      const data = await res.json() as { success?: boolean; deletedId?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to cancel invoice");
      onDeleted?.(invoice.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invoice");
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const handleRefresh = async () => {
    setError(null);
    setRefreshResult(null);
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/sprint-drafts/${sprintId}/invoices/${invoice.id}/stripe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "refresh" }),
        }
      );
      const data = await res.json() as { invoice?: SprintInvoice; statusChanged?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to refresh status");
      if (data.invoice) {
        setInvoice(data.invoice);
        setStep(deriveStep(data.invoice));
        onUpdate(data.invoice);
      }
      setRefreshResult(data.statusChanged ? "changed" : "current");
      // Auto-clear the result after 4 s
      setTimeout(() => setRefreshResult(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh status");
    } finally {
      setRefreshing(false);
    }
  };

  const isPaidOrRefunded = invoice.invoice_status === "paid" || invoice.invoice_status === "refunded";
  const cancelLabel = invoice.stripe_invoice_id ? "Cancel & delete invoice" : "Delete invoice";
  const cancelClientEmails = studioEmailMembers.filter((m) => cancelCheckedMembers[m.email]).map((m) => m.email);
  const anyCancelRecipientChecked = cancelClientEmails.length > 0;

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
          <div className="flex items-center gap-1">
            {/* Refresh status button — only relevant once a Stripe invoice exists */}
            {invoice.stripe_invoice_id && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh Stripe status"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition"
              >
                <svg
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {refreshing ? "Checking…" : refreshResult === "changed" ? "✓ Updated" : refreshResult === "current" ? "✓ Up to date" : "Refresh status"}
              </button>
            )}
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
                {stripeEmailOptions.length > 0 && step !== "sent" ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedStripeEmail ?? ""}
                      onChange={(e) => setSelectedStripeEmail(e.target.value || null)}
                      disabled={sending}
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
                <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>
                  Stripe invoice email — always sent
                  {step === "generated" ? " (applies on send)" : ""}
                </p>
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

          {/* Due date */}
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className={`${getTypographyClassName("body-sm")} font-medium text-text-secondary`}>Due date</p>
            </div>
            <div className="px-3 py-2.5">
              {step === "idle" ? (
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`${getTypographyClassName("body-sm")} text-text-primary bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                />
              ) : (
                <p className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>
                  {new Date(dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
              <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>
                Client will see this due date on their Stripe invoice
              </p>
            </div>
          </div>

          {/* Payment method */}
          {step === "idle" && (
            <div className="rounded-md border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
              <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                <p className={`${getTypographyClassName("body-sm")} font-medium text-text-secondary`}>Payment method</p>
              </div>
              <label className="px-3 py-2.5 flex items-start gap-3 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                <div className="pt-0.5 shrink-0">
                  <Checkbox checked={achOnly} onChange={setAchOnly} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>ACH bank transfer only</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide leading-none bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                      0.8% fee, max $5
                    </span>
                  </div>
                  <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>
                    {achOnly
                      ? "Card payments disabled — client pays via bank account only"
                      : "Card payments enabled — 2.9% + 30¢ fee applies if client chooses card"}
                  </p>
                </div>
              </label>
            </div>
          )}

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
                <div className="space-y-1.5">
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
                  <button
                    onClick={handleVoid}
                    disabled={voiding}
                    className={`${getTypographyClassName("body-sm")} flex items-center gap-1 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50`}
                  >
                    {voiding ? (
                      <>
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Voiding…
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Void &amp; regenerate
                      </>
                    )}
                  </button>
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
                  Invoice sent to {invoice.stripe_recipient_email ?? selectedStripeEmail ?? "client"}
                </p>
              </div>
            ) : confirmSend ? (
              /* Confirmation panel — shown before the irreversible sendInvoice call */
              <div className="rounded-md border border-amber-200 dark:border-amber-700 overflow-hidden">
                <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-2 border-b border-amber-200 dark:border-amber-700 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className={`${getTypographyClassName("body-sm")} font-semibold text-amber-800 dark:text-amber-300`}>
                    Confirm before sending — this can&apos;t be undone
                  </p>
                </div>

                {/* Summary rows */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                  {/* Invoice */}
                  <div className="px-3 py-2 flex items-start justify-between gap-2">
                    <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>Invoice</span>
                    <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary text-right`}>
                      {invoice.label}{invoice.amount != null ? ` — ${formatCurrency(invoice.amount)}` : ""}
                    </span>
                  </div>
                  {/* Stripe recipient */}
                  <div className="px-3 py-2 flex items-start justify-between gap-2">
                    <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>Stripe to</span>
                    <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary text-right`}>
                      {invoice.stripe_recipient_email ?? selectedStripeEmail ?? "—"}
                    </span>
                  </div>
                  {/* Due date */}
                  <div className="px-3 py-2 flex items-start justify-between gap-2">
                    <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>Due</span>
                    <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary text-right`}>
                      {new Date(dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  {/* CC admin */}
                  {ccAdmin && (
                    <div className="px-3 py-2 flex items-start justify-between gap-2">
                      <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>CC</span>
                      <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary text-right`}>{adminEmail}</span>
                    </div>
                  )}
                  {/* Studio-branded CC recipients */}
                  {ccClientEmails.length > 0 && (
                    <div className="px-3 py-2 flex items-start justify-between gap-2">
                      <span className={`${getTypographyClassName("body-sm")} text-text-muted shrink-0`}>Studio email</span>
                      <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary text-right`}>
                        {ccClientEmails.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 flex items-center gap-2">
                  <button
                    onClick={() => setConfirmSend(false)}
                    disabled={sending}
                    className={`${getTypographyClassName("button-sm")} flex-1 h-8 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors`}
                  >
                    Go back
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className={`${getTypographyClassName("button-sm")} flex-1 h-8 rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5`}
                  >
                    {sending ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : "Confirm & Send"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => step === "generated" && setConfirmSend(true)}
                disabled={step !== "generated"}
                className={`${getTypographyClassName("button-sm")} w-full h-9 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  step === "generated"
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90"
                    : "bg-neutral-100 dark:bg-neutral-800 text-text-muted cursor-not-allowed opacity-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Send Invoice to Client
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
          {/* Danger zone — cancel / delete invoice */}
          <div className="pt-2">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
              <span className={`${getTypographyClassName("body-sm")} text-text-muted px-2 bg-white dark:bg-gray-900`}>danger zone</span>
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
            </div>

            <div className="mt-2">
              {isPaidOrRefunded ? (
                <p className={`${getTypographyClassName("body-sm")} text-text-muted text-center py-1`}>
                  Cannot cancel a {invoice.invoice_status} invoice.
                </p>
              ) : showCancelConfirm ? (
                <div className="rounded-md border border-red-200 dark:border-red-800 overflow-hidden">
                  <div className="bg-red-50 dark:bg-red-950/20 px-3 py-2 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <p className={`${getTypographyClassName("body-sm")} font-semibold text-red-800 dark:text-red-300`}>
                      Confirm — this cannot be undone
                    </p>
                  </div>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                    {/* What will happen */}
                    <div className="px-3 py-2 space-y-1">
                      {invoice.stripe_invoice_id && invoice.invoice_status !== "voided" && (
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className={`${getTypographyClassName("body-sm")} text-text-secondary`}>Void Stripe invoice</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className={`${getTypographyClassName("body-sm")} text-text-secondary`}>Delete invoice record</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>Admin cancellation email sent to you</span>
                      </div>
                    </div>

                    {/* Recipients — per-member checkboxes + admin row */}
                    <div>
                      <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50">
                        <p className={`${getTypographyClassName("body-sm")} font-medium text-text-secondary`}>Recipients</p>
                      </div>

                      {/* Admin — always notified, no checkbox */}
                      <div className="px-3 py-2.5 flex items-start gap-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="pt-0.5 shrink-0 w-4 flex items-center justify-center">
                          <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>{adminEmail || "you"}</span>
                            <RoleBadge role={adminRole} />
                          </div>
                          <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>Admin cancellation notice — always sent</p>
                        </div>
                      </div>

                      {/* Per-member rows — only shown when invoice was sent */}
                      {step === "sent" && studioEmailMembers.length > 0 ? (
                        studioEmailMembers.map((member) => (
                          <label
                            key={member.email}
                            className="px-3 py-2.5 flex items-start gap-3 border-t border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                          >
                            <div className="pt-0.5 shrink-0">
                              <Checkbox
                                checked={cancelCheckedMembers[member.email] ?? false}
                                onChange={(v) => setCancelCheckedMembers((prev) => ({ ...prev, [member.email]: v }))}
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
                              <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px] mt-0.5`}>Studio cancellation email</p>
                            </div>
                          </label>
                        ))
                      ) : step === "sent" ? (
                        <div className="px-3 py-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-start gap-3">
                          <div className="pt-0.5 shrink-0 w-4" />
                          <span className={`${getTypographyClassName("body-sm")} text-text-muted italic`}>No client email on file</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Custom message — shown when at least one client is checked */}
                    {step === "sent" && anyCancelRecipientChecked && (
                      <div className="px-3 py-2.5 space-y-1.5 border-t border-neutral-100 dark:border-neutral-800">
                        <p className={`${getTypographyClassName("body-sm")} font-medium text-text-secondary`}>
                          Custom message <span className="font-normal text-text-muted">(optional)</span>
                        </p>
                        <textarea
                          value={cancelMessage}
                          onChange={(e) => setCancelMessage(e.target.value)}
                          placeholder="e.g. We've updated the scope — a revised invoice will follow shortly."
                          rows={3}
                          className={`${getTypographyClassName("body-sm")} w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2.5 py-2 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                        />
                        <p className={`${getTypographyClassName("body-sm")} text-text-muted text-[11px]`}>
                          Included in the cancellation email to the client
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 flex items-center gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={cancelling}
                      className={`${getTypographyClassName("button-sm")} flex-1 h-8 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors`}
                    >
                      Go back
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className={`${getTypographyClassName("button-sm")} flex-1 h-8 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5`}
                    >
                      {cancelling ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Cancelling...
                        </>
                      ) : "Confirm"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className={`${getTypographyClassName("button-sm")} w-full h-9 rounded-md border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-1.5`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  {cancelLabel}
                </button>
              )}
            </div>
          </div>
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
