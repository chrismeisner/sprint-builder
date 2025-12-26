"use client";

import type { ChangeEvent } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type SampleTextEditorModalProps = {
  isOpen: boolean;
  label: string;
  helperText?: string;
  textareaLabel?: string;
  placeholder?: string;
  draft: string;
  error?: string | null;
  submitLabel?: string;
  resetLabel?: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  onReset?: () => void;
};

export default function SampleTextEditorModal({
  isOpen,
  label,
  helperText,
  draft,
  error,
  textareaLabel = "Sample text",
  placeholder = "Type a sample phrase…",
  submitLabel = "Update",
  resetLabel = "Reset",
  onChange,
  onCancel,
  onSubmit,
  onReset,
}: SampleTextEditorModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-lg border border-black/10 bg-white p-6 shadow-2xl dark:border-white/20 dark:bg-neutral-900"
      >
        <div className="space-y-1">
          <p className={getTypographyClassName("body-sm")}>Edit sample text</p>
          <p className={getTypographyClassName("h3")}>{label}</p>
          {helperText && <p className={getTypographyClassName("body-sm")}>{helperText}</p>}
        </div>
        <form className="mt-4 space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className={getTypographyClassName("body-sm")} htmlFor="sample-editor-textarea">
            {textareaLabel}
          </label>
          <textarea
            id="sample-editor-textarea"
            value={draft}
            onChange={handleChange}
            rows={4}
            placeholder={placeholder}
            className="w-full rounded-md border border-black/15 bg-white p-3 text-sm text-black shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:border-white/25 dark:bg-black/40 dark:text-white dark:focus-visible:ring-white/60"
          />
          {error && <p className={`${getTypographyClassName("body-sm")} text-red-600 dark:text-red-400`}>{error}</p>}
          <div className="flex flex-wrap justify-between gap-3">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className={`rounded-md border border-black/15 px-3 py-2 transition hover:text-black dark:border-white/25 dark:text-white/70 dark:hover:text-white ${getTypographyClassName("button-sm")}`}
              >
                {resetLabel}
              </button>
            ) : (
              <span />
            )}
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={`rounded-md border border-black/15 px-3 py-2 transition hover:text-black dark:border-white/25 dark:text-white/70 dark:hover:text-white ${getTypographyClassName("button-sm")}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className={`rounded-md border border-black bg-black px-4 py-2 text-white transition hover:opacity-90 dark:border-white dark:bg-white dark:text-black ${getTypographyClassName("button-sm")}`}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


