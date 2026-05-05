"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { PrototypeNote } from "@/app/sandboxes/miles-proto-4/_components/prototype-note";
import { getVehicleData } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-body";

function InsuranceContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const ins = vehicle.insurance;

  const [stateNoteOpen, setStateNoteOpen] = useState(false);
  const [expiresNoteOpen, setExpiresNoteOpen] = useState(false);
  const [updateNoteOpen, setUpdateNoteOpen] = useState(false);
  const [docNoteOpen, setDocNoteOpen] = useState(false);

  const expiresDisplay = ins.expires.replace(/^Expires\s+/i, "");

  return (
    <VehicleDetailShell eyebrow={inferredName} title="Insurance">
      <div className="flex flex-col gap-6">
        <GroupedList caption="Provider">
          <ReadRow label="Carrier" value={ins.carrier} />
          <ReadRow label="Policy number" value={ins.policyNumber} mono />
          <ReadRow label="Company code" value={ins.companyCode} />
          <NavRow label="State" value={ins.state} onTap={() => setStateNoteOpen(true)} />
        </GroupedList>

        <GroupedList caption="Named insureds">
          {ins.namedInsureds.map((name) => (
            <div
              key={name}
              className="flex min-h-[48px] items-center px-4 py-2.5"
            >
              <span className="truncate text-base text-neutral-900">{name}</span>
            </div>
          ))}
        </GroupedList>

        <GroupedList caption="Validity">
          <ReadRow label="Status">
            <StatusPill status={ins.status} />
          </ReadRow>
          <NavRow
            label="Expires"
            value={expiresDisplay}
            onTap={() => setExpiresNoteOpen(true)}
          />
        </GroupedList>

        <GroupedList caption="Agent">
          <ReadRow label="Name" value={ins.agent.name} />
          <a
            href={`tel:${ins.agent.phone.replace(/[^\d+]/g, "")}`}
            className="flex min-h-[48px] items-center gap-3 px-4 py-2.5 transition-colors active:bg-neutral-100"
          >
            <span className="shrink-0 text-base text-neutral-900">Phone</span>
            <span className="flex min-w-0 flex-1 justify-end truncate text-base text-semantic-info">
              {ins.agent.phone}
            </span>
          </a>
        </GroupedList>

        <button
          type="button"
          onClick={() => setUpdateNoteOpen(true)}
          className="rounded-2xl bg-semantic-info py-3.5 text-base font-semibold text-white transition-opacity active:opacity-80"
        >
          Update insurance
        </button>
        <button
          type="button"
          onClick={() => setDocNoteOpen(true)}
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
        open={updateNoteOpen}
        onClose={() => setUpdateNoteOpen(false)}
        title="Update flow"
        body="On iOS, this pushes a guided form to refresh policy details or scan an updated insurance card. Skipped in the web prototype."
      />
      <PrototypeNote
        open={docNoteOpen}
        onClose={() => setDocNoteOpen(false)}
        title="Source document"
        body="On iOS, this opens the saved insurance card image / PDF in a Quick Look viewer. Skipped in the web prototype."
      />
    </VehicleDetailShell>
  );
}

export default function InsuranceDetailPage() {
  return (
    <Suspense>
      <InsuranceContent />
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

/** Read-only row with right-aligned value (or arbitrary children for chips, etc). */
function ReadRow({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 px-4 py-2.5">
      <span className="shrink-0 text-base text-neutral-900">{label}</span>
      <div className="flex min-w-0 flex-1 justify-end">
        {children ?? (
          <span
            className={`truncate text-base text-neutral-500 ${mono ? "font-mono tracking-wide" : ""}`}
          >
            {value}
          </span>
        )}
      </div>
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
