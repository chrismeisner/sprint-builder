"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import WidthRuler from "@/components/WidthRuler";

type SamplePreviewClientProps = {
  text: string;
  fontClass: string;
  fontSize: string;
  lineHeight: number;
  letterSpacing: number;
  label: string;
};

export default function SamplePreviewClient({ text, fontClass, fontSize, lineHeight, letterSpacing, label }: SamplePreviewClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widthInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [isEditingWidth, setIsEditingWidth] = useState(false);
  const [widthDraft, setWidthDraft] = useState("");
  const [widthError, setWidthError] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState(text);
  const [isEditingText, setIsEditingText] = useState(false);
  const [textDraft, setTextDraft] = useState(text);
  const [textError, setTextError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const measureWidth = useCallback(() => {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    setContainerWidth(Math.round(width));
  }, []);

  useEffect(() => {
    measureWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measureWidth);
      const target = containerRef.current;
      if (target) {
        observer.observe(target);
      }
      return () => {
        if (target) {
          observer.unobserve(target);
        }
        observer.disconnect();
      };
    }

    window.addEventListener("resize", measureWidth);
    return () => window.removeEventListener("resize", measureWidth);
  }, [measureWidth]);

  useEffect(() => {
    measureWidth();
  }, [customWidth, measureWidth]);

  useEffect(() => {
    if (!isEditingWidth) return;
    if (!widthInputRef.current) return;
    widthInputRef.current.focus();
    widthInputRef.current.select();
  }, [isEditingWidth]);

  useEffect(() => {
    if (!isEditingText) return;
    if (!textInputRef.current) return;
    textInputRef.current.focus();
    textInputRef.current.select();
  }, [isEditingText]);

  useEffect(() => {
    setDisplayText(text);
    setTextDraft(text);
  }, [text]);

  useEffect(() => {
    if (copyState !== "copied") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const beginWidthEdit = () => {
    const startingWidth = customWidth ?? containerWidth ?? "";
    setWidthDraft(startingWidth ? String(startingWidth) : "");
    setWidthError(null);
    setIsEditingWidth(true);
  };

  const handleWidthDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWidthDraft(event.target.value);
    if (widthError) {
      setWidthError(null);
    }
  };

  const handleWidthSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number.parseFloat(widthDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setWidthError("Enter a value greater than 0.");
      return;
    }
    const nextWidth = Math.round(parsed);
    setCustomWidth(nextWidth);
    setIsEditingWidth(false);
    setWidthError(null);
  };

  const handleWidthCancel = () => {
    setIsEditingWidth(false);
    setWidthError(null);
  };

  const handleWidthReset = () => {
    setCustomWidth(null);
    setIsEditingWidth(false);
    setWidthDraft("");
    setWidthError(null);
  };

  const openTextModal = () => {
    setTextDraft(displayText);
    setTextError(null);
    setIsEditingText(true);
  };

  const handleTextDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setTextDraft(event.target.value);
    if (textError) {
      setTextError(null);
    }
  };

  const handleTextSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (textDraft.trim().length === 0) {
      setTextError("Enter at least one character.");
      return;
    }
    setDisplayText(textDraft);
    setIsEditingText(false);
    setTextError(null);
  };

  const handleTextCancel = () => {
    setIsEditingText(false);
    setTextError(null);
  };

  const handleCopyStyles = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyState("error");
      return;
    }

    const styleLines = [
      `Font: ${label}`,
      `Classes: ${fontClass || "n/a"}`,
      `font-size: ${fontSize};`,
      `line-height: ${lineHeight};`,
      `letter-spacing: ${letterSpacing}em;`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(styleLines);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const widthLabel = containerWidth !== null ? `${containerWidth}px` : "Measuring…";
  const hasCustomWidth = customWidth !== null;
  const containerStyle = hasCustomWidth ? { width: `${customWidth}px`, maxWidth: `${customWidth}px` } : undefined;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-12 overflow-hidden">
      <div className="w-full max-w-5xl pb-6">
        <WidthRuler targetRef={containerRef} label="Container width" className="text-black/60 dark:text-white/60" />
      </div>
      <div
        ref={containerRef}
        className={`w-full flex flex-col min-h-[60vh] ${hasCustomWidth ? "" : "max-w-5xl"} mx-auto`}
        style={containerStyle}
      >
        <div className="text-xs uppercase tracking-[0.2em] flex flex-wrap items-center gap-3 text-brand-muted">
          <span className="inline-flex items-center rounded-full border border-stroke-muted bg-surface-subtle px-3 py-1 text-[11px] font-semibold tracking-normal text-foreground">
            {widthLabel}
          </span>
          {!isEditingWidth && (
            <button
              type="button"
              onClick={beginWidthEdit}
              className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-muted transition hover:text-foreground"
            >
              Edit
            </button>
          )}
          {hasCustomWidth && !isEditingWidth && (
            <button
              type="button"
              onClick={handleWidthReset}
              className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-muted transition hover:text-foreground"
            >
              Reset
            </button>
          )}
          {isEditingWidth && (
            <form className="flex flex-wrap items-center gap-2 tracking-normal text-foreground" onSubmit={handleWidthSubmit}>
              <label htmlFor="sample-width" className="sr-only">
                Sample width in pixels
              </label>
              <input
                ref={widthInputRef}
                id="sample-width"
                type="number"
                min={1}
                step={1}
                value={widthDraft}
                onChange={handleWidthDraftChange}
                className="h-8 w-24 rounded border border-stroke-muted bg-surface-card px-2 text-[13px] font-semibold text-foreground focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              />
              <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">px</span>
              <button
                type="submit"
                className="rounded border border-stroke-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleWidthCancel}
                className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-muted transition hover:text-foreground"
              >
                Cancel
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={openTextModal}
            className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-muted transition hover:text-foreground"
          >
            Edit text
          </button>
        </div>
        {widthError && <p className="mt-2 text-[11px] font-medium text-semantic-danger">{widthError}</p>}

        <div className="flex-1 flex items-center py-6 overflow-hidden">
          <p
            className={`${fontClass} text-foreground`}
            style={{
              fontSize,
              lineHeight,
              letterSpacing: `${letterSpacing}em`,
            }}
          >
            {displayText}
          </p>
        </div>

        <div className="border border-stroke-muted rounded-lg px-5 py-4 mt-6 text-xs text-foreground space-y-2 bg-surface-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-semibold uppercase tracking-wide text-[10px] text-brand-muted">Sample details</div>
            <div className="flex items-center gap-3">
              {copyState === "copied" && <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-semantic-success">Copied</span>}
              {copyState === "error" && <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-semantic-danger">Copy failed</span>}
              <button
                type="button"
                onClick={handleCopyStyles}
                className="rounded border border-stroke-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Copy styles
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-brand-muted">
            <span>
              <span className="font-semibold">Font:</span> {label}
            </span>
            <span>
              <span className="font-semibold">Class:</span> {fontClass || "n/a"}
            </span>
            <span>
              <span className="font-semibold">Size:</span> {fontSize}
            </span>
            <span>
              <span className="font-semibold">Line:</span> {lineHeight.toFixed(2)}
            </span>
            <span>
              <span className="font-semibold">Spacing:</span> {letterSpacing.toFixed(3)}em
            </span>
            <span>
              <span className="font-semibold">Width:</span> {widthLabel}
            </span>
          </div>
        </div>
      </div>
      {isEditingText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/70" onClick={handleTextCancel} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-lg bg-background p-6 shadow-2xl border border-stroke-muted">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted">Edit sample text</h2>
            <form className="mt-4 space-y-4" onSubmit={handleTextSubmit}>
              <label htmlFor="sample-text" className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
                Paragraph content
              </label>
              <textarea
                ref={textInputRef}
                id="sample-text"
                value={textDraft}
                onChange={handleTextDraftChange}
                className="h-40 w-full rounded border border-stroke-muted bg-surface-card p-3 text-sm text-foreground focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              />
              {textError && <p className="text-sm font-medium text-semantic-danger">{textError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleTextCancel}
                  className="rounded border border-stroke-muted px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground transition hover:border-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded border border-foreground bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-transparent hover:text-foreground"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

