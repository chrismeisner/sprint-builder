"use client";

import { useEffect, useRef, useState } from "react";
import {
  iosTypographyScale,
  type IosTypographyToken,
} from "@/lib/design-system/ios-typography";

// ─── Typography matching ────────────────────────────────────────────────────

// Classes that identify the font SIZE (not color, weight, or spacing)
const SIZE_CLASS_RE = /^(text-xs|text-sm|text-base|text-lg|text-xl|text-2xl|text-3xl|text-4xl|text-\[\d+px\])$/;

const SCALE_ENTRIES = iosTypographyScale.map((token) => {
  const classes = token.className.split(" ").filter(Boolean);
  const sizeClass = classes.find((c) => SIZE_CLASS_RE.test(c)) ?? null;
  return { token, classes, count: classes.length, sizeClass };
});

export type MatchType = "exact" | "closest";

interface TypographyMatch {
  token: IosTypographyToken;
  matchType: MatchType;
}

function findTypographyMatch(el: Element): TypographyMatch | null {
  // Pass 1 — exact: all scale classes must be present on the element
  let best: IosTypographyToken | null = null;
  let bestCount = 0;
  for (const entry of SCALE_ENTRIES) {
    if (entry.count <= bestCount) continue;
    if (entry.classes.every((cls) => el.classList.contains(cls))) {
      best = entry.token;
      bestCount = entry.count;
    }
  }
  if (best) return { token: best, matchType: "exact" };

  // Pass 2 — nearest: find the element's size class, then among entries sharing
  // that size class pick the one with the most overlapping non-size classes.
  const elSizeClass = Array.from(el.classList).find((c) => SIZE_CLASS_RE.test(c)) ?? null;
  if (!elSizeClass) return null;

  let nearestToken: IosTypographyToken | null = null;
  let nearestScore = -1;

  for (const entry of SCALE_ENTRIES) {
    if (entry.sizeClass !== elSizeClass) continue;
    // Score = number of entry's non-size classes also present on the element
    const nonSizeClasses = entry.classes.filter((c) => c !== entry.sizeClass);
    const score = nonSizeClasses.filter((c) => el.classList.contains(c)).length;
    // Prefer more overlap; on a tie prefer the entry with more total classes (more specific)
    if (score > nearestScore || (score === nearestScore && entry.count > (nearestToken ? SCALE_ENTRIES.find(e => e.token === nearestToken)!.count : 0))) {
      nearestToken = entry.token;
      nearestScore = score;
    }
  }

  if (nearestToken) return { token: nearestToken, matchType: "closest" };
  return null;
}

// ─── Color token detection ──────────────────────────────────────────────────

const COLOR_TOKEN_RE =
  /^text-(text-|semantic-|background$|foreground$)/;

function findColorToken(el: Element): string | null {
  for (const cls of Array.from(el.classList)) {
    if (COLOR_TOKEN_RE.test(cls)) return cls;
  }
  return null;
}

// ─── Computed text fallback (for inline-styled elements like map markers) ───

/** Convert rgb/rgba CSS string to #rrggbb hex. Returns null for transparent. */
function rgbaToHex(rgba: string): string | null {
  const m = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(rgba);
  if (!m) return null;
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  if (a === 0) return null;
  const r = parseInt(m[1]).toString(16).padStart(2, "0");
  const g = parseInt(m[2]).toString(16).padStart(2, "0");
  const b = parseInt(m[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/** Whether el has at least one direct (non-whitespace) text node child. */
function hasDirectText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && (node.textContent?.trim() ?? "")) return true;
  }
  return false;
}

interface ComputedText {
  fontSizePx: number;
  fontWeight: string;
  lineHeightPx: string;
  colorHex: string | null;
  nearestToken: IosTypographyToken | null;
}

function readComputedText(el: Element): ComputedText | null {
  if (!hasDirectText(el)) return null;
  const cs = window.getComputedStyle(el);
  const fontSizePx = parseFloat(cs.fontSize);
  if (!fontSizePx) return null;

  const fontWeight = cs.fontWeight;
  const lineHeightPx = cs.lineHeight;
  const colorHex = rgbaToHex(cs.color);

  // Find the nearest iosTypographyScale entry by pixel size (within ±5px)
  let nearestToken: IosTypographyToken | null = null;
  let minDiff = Infinity;
  for (const { token } of SCALE_ENTRIES) {
    const diff = Math.abs(token.sizePx - fontSizePx);
    if (diff < minDiff) { minDiff = diff; nearestToken = token; }
  }
  if (minDiff > 5) nearestToken = null;

  return { fontSizePx, fontWeight, lineHeightPx, colorHex, nearestToken };
}

// ─── DOM traversal ──────────────────────────────────────────────────────────

type InspectResult =
  | { kind: "token";    el: Element; token: IosTypographyToken; matchType: MatchType; colorToken: string | null }
  | { kind: "computed"; el: Element; computed: ComputedText };

function findInspectTarget(el: Element | null): InspectResult | null {
  // Pass A — class-based (existing 2-pass algorithm)
  let current: Element | null = el;
  let depth = 0;
  while (current && depth < 12) {
    // Hard-stop on our own UI; break (not return) on DOM root so Pass B still runs
    if (current.getAttribute("data-text-inspector") === "ui") return null;
    if (current.tagName === "BODY" || current.tagName === "HTML") break;
    const match = findTypographyMatch(current);
    if (match) {
      return { kind: "token", el: current, token: match.token, matchType: match.matchType, colorToken: findColorToken(current) };
    }
    current = current.parentElement;
    depth++;
  }

  // Pass B — computed fallback for inline-styled text (e.g. map marker labels)
  current = el;
  depth = 0;
  while (current && depth < 12) {
    if (current.getAttribute("data-text-inspector") === "ui") return null;
    if (current.tagName === "BODY" || current.tagName === "HTML") break;
    const computed = readComputedText(current);
    if (computed) return { kind: "computed", el: current, computed };
    current = current.parentElement;
    depth++;
  }
  return null;
}

// ─── Color swatch ───────────────────────────────────────────────────────────

const COLOR_TOKEN_SWATCH: Record<string, string> = {
  "text-text-primary": "#0a0a0a",
  "text-text-secondary": "#404040",
  "text-text-muted": "#737373",
  "text-text-inverse": "#fafafa",
  "text-foreground": "#0a0a0a",
  "text-background": "#fafafa",
  "text-semantic-info": "#2563eb",
  "text-semantic-success": "#16a34a",
  "text-semantic-warning": "#ca8a04",
  "text-semantic-danger": "#dc2626",
};

// ─── Tooltip ────────────────────────────────────────────────────────────────

type TooltipData =
  | { kind: "token";    x: number; y: number; token: IosTypographyToken; matchType: MatchType; colorToken: string | null }
  | { kind: "computed"; x: number; y: number; computed: ComputedText };

const WEIGHT_LABEL: Record<string, string> = {
  "100": "thin", "200": "extralight", "300": "light",
  "400": "regular", "500": "medium", "600": "semibold",
  "700": "bold", "800": "extrabold", "900": "black",
};

function Tooltip({ data, pinned = false, onClose }: { data: TooltipData; pinned?: boolean; onClose?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: "fixed",
    left: data.x + 16,
    top: data.y - 8,
    pointerEvents: pinned ? "auto" : "none",
    zIndex: pinned ? 9997 : 9999,
    maxWidth: 292,
    transform: "translateZ(0)",
  };

  const PinBar = pinned ? (
    <div className="flex items-center justify-between border-b border-amber-400/20 bg-amber-500/10 px-3 py-1">
      <span className="flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">
        <span className="size-1.5 rounded-full bg-amber-400" />
        pinned
      </span>
      <button
        onClick={onClose}
        className="flex size-4 items-center justify-center rounded text-white/40 hover:text-white"
        title="Unpin"
      >
        ×
      </button>
    </div>
  ) : null;

  // ── Computed fallback tooltip ──────────────────────────────────────────────
  if (data.kind === "computed") {
    const { computed } = data;
    const wLabel = WEIGHT_LABEL[computed.fontWeight] ?? `w${computed.fontWeight}`;
    const lhNum = parseFloat(computed.lineHeightPx);
    const lhLabel = Number.isFinite(lhNum) ? `${Math.round(lhNum)}px` : computed.lineHeightPx;

    return (
      <div
        ref={ref}
        data-text-inspector="ui"
        style={style}
        className={`rounded-control shadow-xl ${pinned ? "border border-amber-400/40 bg-neutral-900" : "border border-dashed border-white/20 bg-neutral-900"}`}
      >
        {PinBar}
        <div className="border-b border-white/10 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Text · computed
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-white/60">
            {computed.fontSizePx}px · {wLabel} · {lhLabel} lh
          </p>
        </div>

        <div className="flex flex-col gap-1.5 px-3 py-2.5">
          {/* Color */}
          {computed.colorHex && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">Color</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block size-3 rounded-full border border-white/20"
                  style={{ backgroundColor: computed.colorHex }}
                />
                <code className="font-mono text-[11px] text-white/80">{computed.colorHex}</code>
              </div>
            </div>
          )}

          {/* Nearest scale entry suggestion */}
          {computed.nearestToken && (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-white/40">≈ iOS</span>
                <code className="font-mono text-[11px] text-semantic-info/70">
                  {computed.nearestToken.swiftUI}
                </code>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">≈ Figma</span>
                <code className="font-mono text-[11px] text-semantic-warning/80">
                  Miles/{computed.nearestToken.name}
                </code>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-white/10 px-3 py-1.5">
          <p className="font-mono text-[10px] text-white/25">
            {computed.nearestToken ? "nearest match · verify in Figma" : "no scale mapping found"}
          </p>
        </div>
      </div>
    );
  }

  // ── Token tooltip (existing) ───────────────────────────────────────────────
  const swatch = data.colorToken
    ? COLOR_TOKEN_SWATCH[data.colorToken] ?? null
    : null;

  const isClosest = data.matchType === "closest";

  return (
    <div
      ref={ref}
      data-text-inspector="ui"
      style={style}
      className={`rounded-control shadow-xl ${
        pinned
          ? "border border-amber-400/40 bg-foreground"
          : isClosest
            ? "border border-dashed border-white/30 bg-neutral-800"
            : "border border-stroke-muted bg-foreground"
      }`}
    >
      {PinBar}
      {/* Style name */}
      <div className="border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white/50">
            Miles/{data.token.group}
          </span>
          {isClosest && (
            <span className="rounded bg-semantic-warning/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-semantic-warning">
              ≈ closest
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold text-white">
          {isClosest ? "≈ " : ""}{data.token.name}
        </p>
        <p className="text-[10px] text-white/50">{data.token.usage}</p>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        {/* Scale class */}
        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-white/40">
            {isClosest ? "Scale class" : "Class"}
          </span>
          <code className={`text-right font-mono text-[11px] ${isClosest ? "text-white/50 line-through" : "text-white/90"}`}>
            {data.token.className}
          </code>
        </div>

        {/* Color */}
        {data.colorToken && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">Color</span>
            <div className="flex items-center gap-1.5">
              {swatch && (
                <span
                  className="inline-block size-3 rounded-full border border-white/20"
                  style={{ backgroundColor: swatch }}
                />
              )}
              <code className="font-mono text-[11px] text-white/90">{data.colorToken}</code>
            </div>
          </div>
        )}

        {/* iOS mapping */}
        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-white/40">iOS</span>
          <code className="text-right font-mono text-[11px] text-semantic-info">
            {data.token.swiftUI}
          </code>
        </div>

        {/* Figma style */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">Figma</span>
          <code className={`font-mono text-[11px] ${isClosest ? "text-semantic-warning" : "text-semantic-success"}`}>
            Miles/{data.token.name}
          </code>
        </div>
      </div>

      {/* Size hint / closest note */}
      <div className="border-t border-white/10 px-3 py-1.5">
        {isClosest ? (
          <p className="font-mono text-[10px] text-semantic-warning/60">
            no exact match · apply closest style in Figma
          </p>
        ) : (
          <p className="font-mono text-[10px] text-white/30">
            {data.token.sizePx}px · w{data.token.fontWeightNumeric} ·{" "}
            {data.token.lineHeightPx}px lh
            {data.token.mono ? " · mono" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Highlight ──────────────────────────────────────────────────────────────

// Hover uses outline; pin uses box-shadow — they coexist on the same element.

function applyHighlight(el: Element | null) {
  if (el instanceof HTMLElement) {
    el.style.outline = "2px solid #2563eb";
    el.style.outlineOffset = "2px";
    el.setAttribute("data-text-inspector-hl", "1");
  }
}

function removeHighlight(el: Element | null) {
  if (el instanceof HTMLElement && el.getAttribute("data-text-inspector-hl")) {
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.removeAttribute("data-text-inspector-hl");
  }
}

function applyPinHighlight(el: Element | null) {
  if (el instanceof HTMLElement) {
    el.style.boxShadow = "0 0 0 2px #f59e0b, 0 0 0 4px rgba(245,158,11,0.15)";
    el.setAttribute("data-text-inspector-pin", "1");
  }
}

function removePinHighlight(el: Element | null) {
  if (el instanceof HTMLElement && el.getAttribute("data-text-inspector-pin")) {
    el.style.boxShadow = "";
    el.removeAttribute("data-text-inspector-pin");
  }
}

// ─── Pinned tooltip ──────────────────────────────────────────────────────────

interface Pin {
  id: number;
  x: number;
  y: number;
  data: TooltipData;
  el: Element;
}


// ─── Main component ─────────────────────────────────────────────────────────

interface TextInspectorProps {
  /** Controlled active state — managed by InspectorController */
  active: boolean;
  onToggle: () => void;
}

export function TextInspector({ active, onToggle }: TextInspectorProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const highlightedRef = useRef<Element | null>(null);
  const tooltipDataRef = useRef<TooltipData | null>(null);

  useEffect(() => {
    setIsDesktop(window.matchMedia("(pointer: fine)").matches);
  }, []);

  // Mouse tracking
  useEffect(() => {
    if (!active) {
      setTooltip(null);
      removeHighlight(highlightedRef.current);
      highlightedRef.current = null;
      tooltipDataRef.current = null;
      return;
    }

    function onMove(e: MouseEvent) {
      const allEls = document.elementsFromPoint(e.clientX, e.clientY);
      const topEl = allEls.find(
        (el) => el.tagName !== "CANVAS" && el.tagName !== "BODY" && el.tagName !== "HTML"
      ) ?? null;
      const result = findInspectTarget(topEl);

      if (result?.el !== highlightedRef.current) {
        removeHighlight(highlightedRef.current);
        highlightedRef.current = result?.el ?? null;
        applyHighlight(highlightedRef.current);
      }

      let data: TooltipData | null = null;
      if (result) {
        data = result.kind === "token"
          ? { kind: "token", x: e.clientX, y: e.clientY, token: result.token, matchType: result.matchType, colorToken: result.colorToken }
          : { kind: "computed", x: e.clientX, y: e.clientY, computed: result.computed };
      }
      setTooltip(data);
      tooltipDataRef.current = data;
    }

    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      removeHighlight(highlightedRef.current);
      highlightedRef.current = null;
    };
  }, [active]);

  // V key — pin current tooltip
  useEffect(() => {
    if (!active) return;

    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() !== "v") return;

      const data = tooltipDataRef.current;
      const el = highlightedRef.current;
      if (!data || !el) return;

      e.preventDefault();
      const id = Date.now();
      setPins((prev) => [...prev, { id, x: data.x, y: data.y, data, el }]);
      applyPinHighlight(el);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const removePin = (id: number) => {
    setPins((prev) => {
      const pin = prev.find((p) => p.id === id);
      if (pin) removePinHighlight(pin.el);
      return prev.filter((p) => p.id !== id);
    });
  };

  // X key — clear all pins
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() !== "x") return;
      setPins((prev) => { prev.forEach((p) => removePinHighlight(p.el)); return []; });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!isDesktop) return null;

  const pinCount = pins.length;

  return (
    <>
      {/* Toggle button */}
      <button
        data-text-inspector="ui"
        onClick={onToggle}
        title={active ? "Exit text inspect (T)" : "Inspect text styles (T)"}
        className={`fixed bottom-6 right-6 z-[9000] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-lg transition-colors ${
          active
            ? "border-semantic-info/50 bg-semantic-info text-white"
            : "border-stroke-muted bg-surface-card text-text-secondary hover:bg-background hover:text-text-primary"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
          <path d="M1 2h10M1 5h7M1 8h5M1 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {active ? "Inspecting" : "Inspect text"}
        {pinCount > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-neutral-900">
            {pinCount}
          </span>
        )}
      </button>

      {/* Hover tooltip */}
      {active && tooltip && <Tooltip data={tooltip} />}

      {/* Pinned tooltips */}
      {pins.map((pin) => (
        <Tooltip key={pin.id} data={pin.data} pinned onClose={() => removePin(pin.id)} />
      ))}
    </>
  );
}
