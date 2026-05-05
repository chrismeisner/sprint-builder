"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { InlineEditField } from "@/app/sandboxes/miles-proto-4/_components/inline-edit-field";
import { PrototypeNote } from "@/app/sandboxes/miles-proto-4/_components/prototype-note";
import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";
import { getVehicleData } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-body";

function RegistrationContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  /* Same per-vehicle keys as /vehicles/details so plate edits flow
     between the two screens without conflict. */
  const [plate, setPlate] = useLocalStorageState(
    `miles-proto-4-vehicle-plate-${vehicle.id}`,
    vehicle.registration.plate
  );
  const [plateState] = useLocalStorageState(
    `miles-proto-4-vehicle-plate-state-${vehicle.id}`,
    vehicle.registration.state
  );

  const [stateNoteOpen, setStateNoteOpen] = useState(false);
  const [expiresNoteOpen, setExpiresNoteOpen] = useState(false);
  const [documentNoteOpen, setDocumentNoteOpen] = useState(false);

  const expiresDisplay = vehicle.registration.expires.replace(/^Expires\s+/i, "");

  return (
    <VehicleDetailShell eyebrow={inferredName} title="Registration">
      <div className="flex flex-col gap-6">
        <GroupedList caption="Plate">
          <Row label="Number">
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

        <GroupedList caption="Validity">
          <Row label="Status" readonly>
            <StatusPill status={vehicle.registration.status} />
          </Row>
          <NavRow
            label="Expires"
            value={expiresDisplay}
            onTap={() => setExpiresNoteOpen(true)}
          />
        </GroupedList>

        <GroupedList caption="Document">
          <NavRow
            label="Registration card"
            value=""
            placeholder="Add card"
            onTap={() => setDocumentNoteOpen(true)}
          />
        </GroupedList>

        <button
          type="button"
          className="rounded-2xl bg-semantic-info py-3.5 text-base font-semibold text-white transition-opacity active:opacity-80"
        >
          Update registration
        </button>
        <button
          type="button"
          className="-mt-2 text-center text-base font-medium text-semantic-info transition-opacity active:opacity-60"
        >
          View source document
        </button>
      </div>

      <PrototypeNote
        open={stateNoteOpen}
        onClose={() => setStateNoteOpen(false)}
        title="Native picker"
        body="On iOS, this opens a searchable state list. Skipped in the web prototype."
      />
      <PrototypeNote
        open={expiresNoteOpen}
        onClose={() => setExpiresNoteOpen(false)}
        title="Native date picker"
        body="On iOS, this opens a wheel date picker. Skipped in the web prototype."
      />
      <PrototypeNote
        open={documentNoteOpen}
        onClose={() => setDocumentNoteOpen(false)}
        title="Native photo picker"
        body="On iOS, this opens the camera or photo library to capture / attach the registration card. Skipped in the web prototype."
      />
    </VehicleDetailShell>
  );
}

export default function RegistrationDetailPage() {
  return (
    <Suspense>
      <RegistrationContent />
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

/** iOS-style detail-disclosure row — tap pushes / opens something. */
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

function StatusPill({ status }: { status: "Active" | "Expired" }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        status === "Active"
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}
