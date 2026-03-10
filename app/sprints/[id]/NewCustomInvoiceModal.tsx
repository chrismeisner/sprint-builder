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
  sprintId: string;
  onClose: () => void;
  onCreated: (invoice: SprintInvoice) => void;
};

export default function NewCustomInvoiceModal({ sprintId, onClose, onCreated }: Props) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedLabel = label.trim();
    const parsedAmount = parseFloat(amount);
    if (!trimmedLabel) { setError("Enter a label for the invoice"); return; }
    if (!parsedAmount || parsedAmount <= 0) { setError("Enter a valid amount greater than zero"); return; }

    setError(null);
    setCreating(true);
    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/invoices/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: trimmedLabel, amount: parsedAmount }),
      });
      const data = await res.json() as { invoice?: SprintInvoice; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");
      onCreated(data.invoice!);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !creating) handleSubmit();
    if (e.key === "Escape") onClose();
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
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </span>
            <h2 className={getTypographyClassName("h3")}>New custom invoice</h2>
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

        {/* Body */}
        <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
          {/* Label */}
          <div className="space-y-1">
            <label className={`${getTypographyClassName("body-sm")} font-medium text-text-secondary block`}>
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Deposit, Final Payment, Additional Design Work"
              autoFocus
              className={`${getTypographyClassName("body-sm")} w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className={`${getTypographyClassName("body-sm")} font-medium text-text-secondary block`}>
              Amount
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${getTypographyClassName("body-sm")} text-text-muted`}>$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`${getTypographyClassName("body-sm")} w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 pl-7 pr-3 py-2 text-text-primary tabular-nums placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
              <p className={`${getTypographyClassName("body-sm")} text-red-700 dark:text-red-400`}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-b-lg">
          <button
            onClick={onClose}
            disabled={creating}
            className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating}
            className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1.5`}
          >
            {creating ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : "Create invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
