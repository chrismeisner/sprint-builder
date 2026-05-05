"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { InlineEditField } from "@/app/sandboxes/miles-proto-4/_components/inline-edit-field";
import { PrototypeNote } from "@/app/sandboxes/miles-proto-4/_components/prototype-note";
import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";
import { getVehicleData } from "@/app/sandboxes/miles-proto-4/_lib/vehicle-data";

function VehicleDetailsContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const [nickname, setNickname] = useLocalStorageState(
    `miles-proto-4-vehicle-nickname-${vehicle.id}`,
    vehicle.nickname
  );
  const [plate, setPlate] = useLocalStorageState(
    `miles-proto-4-vehicle-plate-${vehicle.id}`,
    vehicle.registration.plate
  );
  const [plateState] = useLocalStorageState(
    `miles-proto-4-vehicle-plate-state-${vehicle.id}`,
    vehicle.registration.state
  );
  const [stateNoteOpen, setStateNoteOpen] = useState(false);

  return (
    <VehicleDetailShell eyebrow={inferredName} title="Details">
      {/* Photo block — display only for now. Theme #6 covers the upload
          mechanism and the empty/placeholder treatment. */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="relative">
          <div className="aspect-[4/3] w-72 overflow-hidden rounded-2xl bg-neutral-100">
            {vehicle.imageSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={vehicle.imageSrc} alt={nickname} className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 text-neutral-500">
                <svg
                  className="size-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path d="M3 7h3l2-3h8l2 3h3v13H3V7Z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                <span className="text-xs font-medium text-neutral-700">Upload or Generate an Image</span>
              </div>
            )}
          </div>
          {vehicle.imageSrc && (
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 inline-flex size-7 items-center justify-center rounded-full border-[3px] border-white bg-green-500 text-white shadow-sm"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
        <button
          type="button"
          className="text-sm font-medium text-semantic-info active:opacity-60"
        >
          {vehicle.imageSrc ? "Change photo" : "Add photo"}
        </button>
      </div>

      {/* Editable section — iOS Settings grouped list. Each row is always
          editable; tapping focuses the input directly. Read-only rows
          render their value in muted gray with no input. */}
      <GroupedList caption="Identification">
        <Row label="Nickname">
          <InlineEditField
            value={nickname}
            onChange={setNickname}
            placeholder="Nickname"
            ariaLabel="Vehicle nickname"
            className="text-right text-base text-neutral-900 placeholder:text-neutral-400"
            maxLength={30}
          />
        </Row>
        <Row label="Plate">
          <InlineEditField
            value={plate}
            onChange={setPlate}
            placeholder="Add"
            ariaLabel="License plate"
            className="text-right text-base text-neutral-900 placeholder:text-semantic-info"
            maxLength={10}
            autoCapitalize="characters"
          />
        </Row>
        <NavRow
          label="State"
          value={plateState}
          placeholder="Select"
          onTap={() => setStateNoteOpen(true)}
        />
      </GroupedList>

      <GroupedList
        caption="Inferred from VIN"
        captionClassName="mt-6"
      >
        <Row label="Year, Make, Model" readonly>
          <span className="truncate text-base text-neutral-500">{inferredName}</span>
        </Row>
        <Row label="VIN" readonly>
          <span className="truncate text-base tracking-wide text-neutral-500">{vehicle.vin}</span>
        </Row>
      </GroupedList>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <button
          type="button"
          className="flex min-h-[48px] w-full items-center justify-center px-4 py-2.5 text-base font-medium text-red-600 transition-colors active:bg-neutral-100"
        >
          Transfer this vehicle
        </button>
      </div>

      <PrototypeNote
        open={stateNoteOpen}
        onClose={() => setStateNoteOpen(false)}
        title="Native picker"
        body="On iOS, this opens a searchable state list. Skipped in the web prototype."
      />
    </VehicleDetailShell>
  );
}

export default function VehicleDetailsPage() {
  return (
    <Suspense>
      <VehicleDetailsContent />
    </Suspense>
  );
}

/* ─── iOS grouped-list primitives ─────────────────────────────────── */

function GroupedList({
  caption,
  captionClassName,
  children,
}: {
  caption?: string;
  captionClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {caption && (
        <span
          className={`px-4 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500 ${captionClassName ?? ""}`}
        >
          {caption}
        </span>
      )}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="divide-y divide-neutral-200">{children}</div>
      </div>
    </div>
  );
}

function Row({
  label,
  readonly,
  children,
}: {
  label: string;
  readonly?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 px-4 py-2.5">
      <span className="shrink-0 text-base text-neutral-900">{label}</span>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
      {readonly && (
        <svg
          className="size-3.5 shrink-0 text-neutral-300"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="Read-only"
        >
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.001 4.75a1.25 1.25 0 1 1-.001 2.5 1.25 1.25 0 0 1 .001-2.5ZM13 17h-2v-6h2v6Z" />
        </svg>
      )}
    </div>
  );
}

/** iOS-style "detail-disclosure" row — tap pushes / opens something. */
function NavRow({
  label,
  value,
  placeholder,
  onTap,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-neutral-100"
    >
      <span className="shrink-0 text-base text-neutral-900">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <span
          className={`truncate text-base ${value ? "text-neutral-500" : "text-semantic-info"}`}
        >
          {value || placeholder || "Select"}
        </span>
        <svg
          className="size-3.5 shrink-0 text-neutral-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          aria-hidden
        >
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}
