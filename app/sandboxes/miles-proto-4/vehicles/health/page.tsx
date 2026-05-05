"use client";

import { Suspense, useState, type DragEvent } from "react";
import { useSearchParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { getVehicleData } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-body";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-4/_components/symbol-icon";
import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";

type HealthView = "bento" | "carousel";

interface MetricRow {
  id: string;
  label: string;
  value: string;
  visible: boolean;
}

function HealthEditor() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const eyebrow = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const [rows, setRows] = useState<MetricRow[]>(() =>
    [...vehicle.primaryMetrics, ...vehicle.extendedMetrics].map((m) => ({
      id: m.id,
      label: m.label,
      value: m.value,
      visible: true,
    }))
  );

  const [view, setView] = useLocalStorageState<HealthView>(
    `miles-proto-4-vehicle-health-view-${vehicle.id}`,
    "bento"
  );

  const toggleVisible = (id: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, visible: !r.visible } : r)));
  };

  /* HTML5 drag-and-drop reorder — works on desktop pointer. iOS native
     drag-to-reorder will be handled by SwiftUI `.onMove` in the rebuild. */
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const onDragStart = (e: DragEvent<HTMLLIElement>, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    /* Some browsers require a non-empty payload to actually start the drag. */
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const onDragOver = (e: DragEvent<HTMLLIElement>, overIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === overIdx) return;
    setRows((rs) => {
      const copy = rs.slice();
      const [removed] = copy.splice(dragIdx, 1);
      copy.splice(overIdx, 0, removed);
      return copy;
    });
    setDragIdx(overIdx);
  };

  const onDragEnd = () => setDragIdx(null);

  const visibleCount = rows.filter((r) => r.visible).length;

  return (
    <VehicleDetailShell eyebrow={eyebrow} title="Health">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-neutral-500">
          Show, hide, or reorder the metrics that appear in the Health section on this vehicle&rsquo;s
          page. {visibleCount} of {rows.length} visible.
        </p>

        <ul className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {rows.map((row, idx) => (
            <li
              key={row.id}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-3 p-3 transition-opacity ${
                dragIdx === idx ? "opacity-40" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => toggleVisible(row.id)}
                aria-label={row.visible ? `Hide ${row.label}` : `Show ${row.label}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors active:bg-neutral-100"
              >
                <SymbolIcon
                  name={row.visible ? "visibility" : "visibility_off"}
                  size="md"
                  className={row.visible ? "text-neutral-700" : "text-neutral-400"}
                />
              </button>

              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span
                  className={`truncate text-sm font-medium ${
                    row.visible ? "text-neutral-900" : "text-neutral-400 line-through"
                  }`}
                >
                  {row.label}
                </span>
                <span className="truncate text-xs text-neutral-500">{row.value}</span>
              </div>

              <span
                className="flex size-8 shrink-0 cursor-grab items-center justify-center text-neutral-400 active:cursor-grabbing"
                aria-label={`Drag to reorder ${row.label}`}
                role="button"
              >
                <SymbolIcon name="drag_indicator" size="md" className="text-neutral-400" />
              </span>
            </li>
          ))}
        </ul>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">View</h3>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="divide-y divide-neutral-100">
              <ViewOption
                label="Bento"
                description="2-column grid"
                selected={view === "bento"}
                onClick={() => setView("bento")}
              />
              <ViewOption
                label="Carousel"
                description="Horizontal swipeable row"
                selected={view === "carousel"}
                onClick={() => setView("carousel")}
              />
            </div>
          </div>
        </section>

        <p className="text-[11px] text-neutral-400">
          Prototype scaffold &mdash; show / hide / reorder are local to this session. View
          preference persists.
        </p>
      </div>
    </VehicleDetailShell>
  );
}

/**
 * iOS Settings-style single-select row. The selected option gets a
 * trailing checkmark in iOS-info blue. Maps to a SwiftUI Picker rendered
 * with `.pickerStyle(.inline)` inside a Form, or to a List of HStacks
 * each ending in `Image(systemName: "checkmark")` when selected.
 */
function ViewOption({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-neutral-100"
    >
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-base text-neutral-900">{label}</span>
        {description && (
          <span className="truncate text-xs text-neutral-500">{description}</span>
        )}
      </div>
      {selected && (
        <SymbolIcon name="check" size="md" className="text-semantic-info" />
      )}
    </button>
  );
}

export default function HealthEditPage() {
  return (
    <Suspense>
      <HealthEditor />
    </Suspense>
  );
}
