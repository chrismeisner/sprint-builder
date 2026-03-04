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

type Props = {
  invoice: SprintInvoice;
  sprintId: string;
  sprintTitle: string | null;
  clientEmail: string | null;
  adminEmail: string;
  onClose: () => void;
  onUpdate: (invoice: SprintInvoice) => void;
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Step = "idle" | "generated" | "sent";

function deriveStep(inv: SprintInvoice): Step {
  if (inv.invoice_status === "sent" || inv.invoice_status === "paid") return "sent";
  if (inv.stripe_invoice_id) return "generated";
  return "idle";
}

export default function StripeInvoiceModal({
  invoice: initialInvoice,
  sprintId,
  sprintTitle,
  clientEmail,
  adminEmail,
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
          body: JSON.stringify({ action: "generate" }),
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
          body: JSON.stringify({ action: "send" }),
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
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            {/* Stripe-ish mark */}
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

        {/* Invoice summary */}
        <div className="p-4 space-y-3">
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
            {clientEmail && (
              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>
                  Invoice will be sent to <span className="font-medium text-text-secondary">{clientEmail}</span>
                </span>
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
                  Invoice sent to {clientEmail ?? "client"}
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
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-b-lg">
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
