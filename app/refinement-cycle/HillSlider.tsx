"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Typography from "@/components/ui/Typography";

// SVG geometry. Slider value 0..100 maps to x in [0, VIEW_W]; the parabola
// peaks at the center.
const VIEW_W = 800;
const VIEW_H = 320;
const BASELINE = 240;
const PEAK_Y = 40;
const PEAK_HEIGHT = BASELINE - PEAK_Y;

function valueToX(v: number): number {
  return (v / 100) * VIEW_W;
}

function valueToY(v: number): number {
  // y_svg = baseline - peakHeight × (1 - ((x - peakX) / peakX)²)
  const t = (v - 50) / 50;
  return BASELINE - PEAK_HEIGHT * (1 - t * t);
}

// Sample the parabola into an SVG path so the visible curve and the marker
// position agree to the pixel.
const HILL_PATH = (() => {
  const steps = 100;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = (i / steps) * 100;
    parts.push(
      `${i === 0 ? "M" : "L"} ${valueToX(v).toFixed(2)} ${valueToY(v).toFixed(2)}`
    );
  }
  return parts.join(" ");
})();

type Zone = {
  range: [number, number];
  label: string;
  phase: "Uphill phase" | "Lock point" | "Downhill phase";
  designNote: string;
  devNote: string;
};

const ZONES: Zone[] = [
  {
    range: [0, 12],
    label: "Blank page",
    phase: "Uphill phase",
    designNote:
      "Just an idea. No screens, no flows, no interaction model — a problem statement and maybe a whiteboard sketch. No deliverable yet.",
    devNote:
      "No code. No data model, no API, no foundational decisions yet — a green field and an unresolved feasibility question.",
  },
  {
    range: [13, 25],
    label: "Sketches forming",
    phase: "Uphill phase",
    designNote:
      "A bare-bones browser prototype starts to emerge. Core screens and primary actions are clickable in HTML — structure over style, intentionally low fidelity so it stays editable.",
    devNote:
      "Stubbed scaffold. Foundational tech choices made — auth, state, framework — and early API contracts drafted. Plumbing in place, function still loose.",
  },
  {
    range: [26, 38],
    label: "Wireframes solidifying",
    phase: "Uphill phase",
    designNote:
      "A navigable browser prototype. Screen-to-screen logic works in real HTML, key states are real, primary flows can be walked through. The feature feels like itself even unstyled.",
    devNote:
      "Working plumbing. Real data flows through stub UI, CRUD endpoints land, schemas firm up. Runs end-to-end — it just doesn't look like much.",
  },
  {
    range: [39, 49],
    label: "Approaching the peak",
    phase: "Uphill phase",
    designNote:
      "The browser prototype is logically complete. All flows mapped, edge states designed in, secondary paths walked through — unbranded but UX-whole and ready for visual treatment.",
    devNote:
      "Functionally complete. All flows wired with real data, edge cases handled in code, error paths drafted. Correct behavior under all known conditions.",
  },
  {
    range: [50, 55],
    label: "At the peak — UX locked",
    phase: "Lock point",
    designNote:
      "The browser prototype is locked. UX decisions are documented and the prototype becomes the reference — the next deliverable is a Figma file built from it, frame for frame.",
    devNote:
      "Feature-complete in code. All states implemented, all data flowing, ready to receive design tokens and final styles. Waiting to be made beautiful.",
  },
  {
    range: [56, 67],
    label: "Fresh on polish",
    phase: "Downhill phase",
    designNote:
      "A Figma file takes shape, mirroring the locked browser prototype. Type, color, hierarchy, and layout rhythm applied screen by screen. Looks like it belongs to a brand.",
    devNote:
      "Visual layer integrated. Tokens swapped in, components adopting the locked design, fidelity climbing toward production parity.",
  },
  {
    range: [68, 79],
    label: "System consistency",
    phase: "Downhill phase",
    designNote:
      "The Figma file aligns with the broader design system. Component reuse honored, spacing tokens applied, motion language consistent. Less novelty, more familiarity.",
    devNote:
      "Shares system code. Shared components adopted, one-offs replaced with tokens, motion utilities standardized. The codebase is consistent with the rest of the product.",
  },
  {
    range: [80, 89],
    label: "Edge-case sweep",
    phase: "Downhill phase",
    designNote:
      "The Figma file covers the long tail. Empty states, errors, loading, dense data — every state has a designed frame. No 'what does this look like?' gaps.",
    devNote:
      "Robust under stress. Loading skeletons in place, errors handle gracefully, telemetry wired, performance audited. Production-ready behavior.",
  },
  {
    range: [90, 100],
    label: "Ship-ready polish",
    phase: "Downhill phase",
    designNote:
      "The Figma file is screenshot-ready. Dark mode tuned, micro-interactions specced, accessibility variants captured. The detail that makes people notice.",
    devNote:
      "Passes the launch checklist. Accessibility audits pass, browsers and devices tested, performance budgets met, analytics live, feature flags configured.",
  },
];

function getZone(v: number): Zone {
  for (const z of ZONES) {
    if (v >= z.range[0] && v <= z.range[1]) return z;
  }
  return ZONES[ZONES.length - 1];
}

const TICKS = [0, 25, 50, 75, 100];

type MarkerId = "a" | "b";

export default function HillSlider() {
  const [valueA, setValueA] = useState(35);
  const [valueB, setValueB] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Which marker the pointer is currently dragging (null = idle).
  const draggingRef = useRef<MarkerId | null>(null);

  // Subtle nudge on first paint to draw attention to the marker.
  const [hinted, setHinted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setHinted(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  const clientToValue = useCallback((clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }, []);

  function setMarkerValue(id: MarkerId, next: number) {
    if (id === "a") setValueA(next);
    else setValueB(next);
  }

  // Hit-test: pick the marker closest to the click. Both markers are at the
  // same y (on the curve), so distance in slider-value space is enough.
  function pickMarker(targetValue: number): MarkerId {
    if (valueB == null) return "a";
    const dA = Math.abs(targetValue - valueA);
    const dB = Math.abs(targetValue - valueB);
    return dA <= dB ? "a" : "b";
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.preventDefault();
    const next = clientToValue(e.clientX);
    const which = pickMarker(next);
    draggingRef.current = which;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers throw if capture is already held; safe to ignore.
    }
    setMarkerValue(which, next);
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const which = draggingRef.current;
    if (!which) return;
    setMarkerValue(which, clientToValue(e.clientX));
  }
  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    draggingRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function addSecondDragger() {
    // Place B distinctly from A so it's easy to grab.
    const b = valueA < 50 ? Math.min(100, valueA + 30) : Math.max(0, valueA - 30);
    setValueB(b);
  }

  function removeSecondDragger() {
    setValueB(null);
  }

  const zoneA = getZone(valueA);
  const zoneB = valueB != null ? getZone(valueB) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
      <div className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-950 p-4 sm:p-6">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className={`block w-full select-none touch-none cursor-grab active:cursor-grabbing text-neutral-900 dark:text-neutral-100 transition-opacity duration-500 ${
            hinted ? "opacity-100" : "opacity-95"
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label="Refinement Cycle hill — drag the marker(s) to explore where your feature is on the hill"
        >
          {/* baseline */}
          <line
            x1={0}
            y1={BASELINE}
            x2={VIEW_W}
            y2={BASELINE}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1}
          />

          {/* peak vertical guide */}
          <line
            x1={VIEW_W * 0.5}
            y1={BASELINE}
            x2={VIEW_W * 0.5}
            y2={PEAK_Y - 6}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeDasharray="3 4"
            strokeWidth={1}
          />

          {/* hill curve */}
          <path
            d={HILL_PATH}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.85}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ticks + numeric labels */}
          {TICKS.map((tick) => (
            <g key={tick}>
              <line
                x1={valueToX(tick)}
                y1={BASELINE}
                x2={valueToX(tick)}
                y2={BASELINE + 8}
                stroke="currentColor"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <text
                x={valueToX(tick)}
                y={BASELINE + 26}
                textAnchor="middle"
                fontSize={13}
                fill="currentColor"
                fillOpacity={0.6}
              >
                {tick}
              </text>
            </g>
          ))}

          {/* zone labels */}
          <text
            x={valueToX(20)}
            y={BASELINE + 60}
            textAnchor="middle"
            fontSize={13}
            fill="currentColor"
            fillOpacity={0.7}
          >
            Uphill — UX &amp; functionality
          </text>
          <text
            x={valueToX(50)}
            y={BASELINE + 60}
            textAnchor="middle"
            fontSize={13}
            fill="currentColor"
            fillOpacity={0.7}
          >
            UX locks
          </text>
          <text
            x={valueToX(80)}
            y={BASELINE + 60}
            textAnchor="middle"
            fontSize={13}
            fill="currentColor"
            fillOpacity={0.7}
          >
            Downhill — UI &amp; polish
          </text>

          {/* connector between markers (when two are active) */}
          {valueB != null && (
            <line
              x1={valueToX(valueA)}
              y1={valueToY(valueA)}
              x2={valueToX(valueB)}
              y2={valueToY(valueB)}
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          )}

          {/* Marker A — outlined style */}
          <Marker
            value={valueA}
            id="a"
            outlined
            showLetter={valueB != null}
            hinted={hinted}
          />

          {/* Marker B — filled style */}
          {valueB != null && (
            <Marker value={valueB} id="b" outlined={false} showLetter />
          )}
        </svg>

        {/* Native range input(s) — primary keyboard / touch handle. */}
        <div className="mt-4 space-y-2">
          <RangeRow
            id="hill-slider-a"
            letter={valueB != null ? "A" : null}
            value={valueA}
            onChange={setValueA}
            zoneSummary={`${zoneA.label}, ${zoneA.phase}`}
          />
          {valueB != null && (
            <RangeRow
              id="hill-slider-b"
              letter="B"
              value={valueB}
              onChange={(v) => setValueB(v)}
              zoneSummary={`${zoneB!.label}, ${zoneB!.phase}`}
            />
          )}
        </div>

        {/* Add / remove second dragger */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/10 dark:border-white/15 pt-3">
          <Typography scale="body-sm" className="opacity-60">
            {valueB == null
              ? "Compare two points on the hill?"
              : `From ${valueA} to ${valueB} — ${
                  Math.abs(valueB - valueA)
                } steps apart`}
          </Typography>
          {valueB == null ? (
            <button
              type="button"
              onClick={addSecondDragger}
              className="rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              + Add a dragger
            </button>
          ) : (
            <button
              type="button"
              onClick={removeSecondDragger}
              className="rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Remove dragger B
            </button>
          )}
        </div>
      </div>

      {/* Live captions — `aria-live` so screen readers announce zone changes
          as the user drags. Stacked in the side column on desktop. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="space-y-6 md:sticky md:top-6"
      >
        <CaptionBlock
          letter={valueB != null ? "A" : null}
          zone={zoneA}
          value={valueA}
        />
        {valueB != null && zoneB && (
          <CaptionBlock letter="B" zone={zoneB} value={valueB} />
        )}
      </div>
    </div>
  );
}

function Marker({
  value,
  id,
  outlined,
  showLetter,
  hinted,
}: {
  value: number;
  id: MarkerId;
  outlined: boolean;
  showLetter: boolean;
  hinted?: boolean;
}) {
  const x = valueToX(value);
  const y = valueToY(value);
  const radius = hinted ? 14 : 12;
  return (
    <g className="pointer-events-none">
      {/* drop line */}
      <line
        x1={x}
        y1={y + radius}
        x2={x}
        y2={BASELINE}
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeDasharray="2 4"
        strokeWidth={1}
      />
      {/* shadow */}
      <ellipse
        cx={x}
        cy={BASELINE + 2}
        rx={10}
        ry={3}
        fill="currentColor"
        fillOpacity={0.12}
      />
      {/* outer */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={outlined ? "white" : "currentColor"}
        stroke="currentColor"
        strokeWidth={3}
        className="transition-all duration-500"
      />
      {/* inner accent */}
      <circle
        cx={x}
        cy={y}
        r={5}
        fill={outlined ? "currentColor" : "white"}
      />
      {showLetter && (
        <text
          x={x}
          y={y - radius - 6}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="currentColor"
          fillOpacity={0.85}
        >
          {id.toUpperCase()}
        </text>
      )}
    </g>
  );
}

function RangeRow({
  id,
  letter,
  value,
  onChange,
  zoneSummary,
}: {
  id: string;
  letter: "A" | "B" | null;
  value: number;
  onChange: (v: number) => void;
  zoneSummary: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className={letter ? "min-w-[1.5rem]" : "sr-only"}>
        {letter ? (
          <Typography as="span" scale="body-sm" className="font-semibold">
            {letter}
          </Typography>
        ) : (
          "Where is your feature on the hill?"
        )}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hill-range"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value} — ${zoneSummary}`}
      />
      <span
        className="tabular-nums text-sm opacity-70 min-w-[3ch] text-right"
        aria-hidden
      >
        {value}
      </span>
    </div>
  );
}

function CaptionBlock({
  letter,
  zone,
  value,
}: {
  letter: "A" | "B" | null;
  zone: Zone;
  value: number;
}) {
  return (
    <div className="space-y-3 min-h-[280px]">
      <div className="flex items-center gap-2">
        {letter && (
          <span className="inline-flex items-center justify-center rounded-full border border-current w-6 h-6">
            <Typography as="span" scale="body-sm" className="font-semibold">
              {letter}
            </Typography>
          </span>
        )}
        <Typography as="p" scale="mono-sm" className="opacity-60">
          {zone.phase} · {value}
        </Typography>
      </div>
      <Typography as="h3" scale="h3">
        {zone.label}
      </Typography>

      <div className="space-y-3 pt-1">
        <TrackNote label="Design / UI" body={zone.designNote} />
        <TrackNote label="Development" body={zone.devNote} />
      </div>
    </div>
  );
}

function TrackNote({ label, body }: { label: string; body: string }) {
  return (
    <div className="border-l-2 border-black/15 dark:border-white/20 pl-3 space-y-1">
      <Typography
        as="p"
        scale="mono-sm"
        className="opacity-70 uppercase tracking-wide"
      >
        {label}
      </Typography>
      <Typography as="p" className="opacity-80">
        {body}
      </Typography>
    </div>
  );
}
