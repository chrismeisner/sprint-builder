"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import type { TypographyToken } from "@/lib/design-system/tokens";
import useSampleTextEditor from "@/hooks/useSampleTextEditor";
import Select from "@/components/ui/Select";
import WidthRuler from "@/components/WidthRuler";

type TypographyViewport = "desktop" | "mobile";

type TypographySampleClientProps = {
  tokens: TypographyToken[];
  sampleText: string;
  viewport: TypographyViewport;
};

const DEFAULT_SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";

export default function TypographySampleClient({ tokens, sampleText, viewport }: TypographySampleClientProps) {
  const previewText = sampleText.trim() || DEFAULT_SAMPLE_TEXT;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewViewport, setPreviewViewport] = useState<TypographyViewport>(viewport);
  const viewportLabel = previewViewport === "mobile" ? "Mobile" : "Desktop";
  const [showNames, setShowNames] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [tokenSamples, setTokenSamples] = useState<Record<string, string>>({});
  const sampleEditor = useSampleTextEditor();

  const updateViewportParam = (nextViewport: TypographyViewport) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewport", nextViewport);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleViewportChange = (nextViewport: TypographyViewport) => {
    if (nextViewport === previewViewport) {
      return;
    }
    setPreviewViewport(nextViewport);
    updateViewportParam(nextViewport);
  };

  const getTokenPreviewText = (tokenId: string) => {
    const customValue = tokenSamples[tokenId];
    if (typeof customValue === "string" && customValue.trim().length > 0) {
      return customValue;
    }
    return previewText;
  };

  const openEditor = (tokenId: string) => {
    const token = tokens.find((item) => item.id === tokenId);
    if (!token) {
      return;
    }
    sampleEditor.openEditor({
      label: `${token.label} (${token.id})`,
      helperText: "Overrides only this preview instance.",
      textareaLabel: "Sample text",
      resetLabel: "Use shared sample",
      initialValue: getTokenPreviewText(tokenId),
      onSubmit: (value) =>
        setTokenSamples((prev) => ({
          ...prev,
          [tokenId]: value,
        })),
      onReset: () =>
        setTokenSamples((prev) => {
          const next = { ...prev };
          delete next[tokenId];
          return next;
        }),
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <WidthRuler targetRef={previewContainerRef} label="Container width" className="text-brand-muted" />
        <div ref={previewContainerRef} className="flex flex-col gap-8">
          <header className="border-b border-stroke-muted pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-muted">Typography Sample Preview</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
                  <span>{viewportLabel} scale</span>
                  <span>
                    {tokens.length} style{tokens.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-brand-muted sm:flex-row sm:items-center sm:gap-4">
                <div className="sm:min-w-[10rem]">
                  <Select
                    label="Viewport"
                    value={previewViewport}
                    onChange={(event) => handleViewportChange(event.target.value === "mobile" ? "mobile" : "desktop")}
                    className="w-full"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                  </Select>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
                  <input
                    type="checkbox"
                    checked={showNames}
                    onChange={(event) => setShowNames(event.target.checked)}
                    className="h-4 w-4 rounded border border-black/20 accent-black dark:border-white/30 dark:accent-white"
                  />
                  <span className="normal-case tracking-normal text-foreground">Show names</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
                  <input
                    type="checkbox"
                    checked={showDetails}
                    onChange={(event) => setShowDetails(event.target.checked)}
                    className="h-4 w-4 rounded border border-black/20 accent-black dark:border-white/30 dark:accent-white"
                  />
                  <span className="normal-case tracking-normal text-foreground">Show details</span>
                </label>
              </div>
            </div>
          </header>
          {tokens.length === 0 ? (
            <div className="rounded-lg border border-stroke-muted bg-surface-card px-5 py-4 text-sm text-brand-muted">
              No typography styles selected.
            </div>
          ) : (
            tokens.map((token) => {
              const viewportConfig = token[previewViewport];
              const lineHeightClass = viewportConfig.lineHeight ? `leading-[${viewportConfig.lineHeight}]` : "";
              const textStyle: CSSProperties | undefined = viewportConfig.lineHeight
                ? {
                    lineHeight: viewportConfig.lineHeight,
                  }
                : undefined;
              const sectionClassName = showNames || showDetails
                ? "space-y-2 border-b border-stroke-muted pb-6 last:border-b-0 last:pb-0"
                : "py-2";
              const tokenPreviewText = getTokenPreviewText(token.id);
              const detailRows = [
                { label: "Font", value: token.baseClass },
                { label: "Size class", value: viewportConfig.sizeClass },
                { label: "Line height", value: viewportConfig.lineHeight ?? "auto" },
              ];
              return (
                <section key={token.id} className={sectionClassName}>
                  {(showNames || showDetails) && (
                    <div className="flex flex-col gap-1 text-sm text-brand-muted">
                      {showNames && <p>{token.label}</p>}
                      {showDetails && (
                        <div className="text-xs text-brand-muted/80">
                          {detailRows.map((row) => (
                            <div key={`${token.id}-${row.label}`} className="flex gap-2">
                              <span className="font-semibold">{row.label}:</span> <span>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditor(token.id)}
                    className="w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60"
                    title="Click to edit sample text"
                  >
                    <span className={`${token.baseClass} ${viewportConfig.sizeClass} ${lineHeightClass} block`} style={textStyle}>
                      {tokenPreviewText}
                    </span>
                  </button>
                </section>
              );
            })
          )}
        </div>
      </div>
      {sampleEditor.editorModal}
    </main>
  );
}


