"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Typography from "@/components/ui/Typography";
import {
  REFINEMENT_CYCLE_STATUSES,
  statusVisuals,
  type RefinementCycleStatus,
} from "@/lib/refinementCycle";
import type { RefinementCycleQueueRow } from "./page";

type Props = {
  rows: RefinementCycleQueueRow[];
};

const TONE_CLASSES: Record<
  ReturnType<typeof statusVisuals>["tone"],
  string
> = {
  neutral: "bg-surface-subtle text-text-secondary border-stroke-muted",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  danger: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: RefinementCycleStatus }) {
  const v = statusVisuals(status);
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 ${TONE_CLASSES[v.tone]}`}
    >
      <Typography scale="body-sm" as="span">
        {v.label}
      </Typography>
    </span>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });
}

const ALL_FILTER = "all" as const;
type StatusFilter = typeof ALL_FILTER | RefinementCycleStatus;

export default function RefinementCyclesQueueClient({ rows }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_FILTER);

  const filtered = useMemo(() => {
    if (statusFilter === ALL_FILTER) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const counts = useMemo(() => {
    const counter: Record<string, number> = { [ALL_FILTER]: rows.length };
    for (const s of REFINEMENT_CYCLE_STATUSES) counter[s] = 0;
    for (const r of rows) counter[r.status] = (counter[r.status] ?? 0) + 1;
    return counter;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([ALL_FILTER, ...REFINEMENT_CYCLE_STATUSES] as StatusFilter[]).map(
          (status) => {
            const isActive = statusFilter === status;
            const label =
              status === ALL_FILTER ? "All" : statusVisuals(status).label;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-md border px-3 py-1.5 transition ${
                  isActive
                    ? "border-brand-primary bg-brand-primary text-brand-inverse"
                    : "border-stroke-muted bg-surface-subtle text-text-primary hover:bg-surface-strong"
                }`}
              >
                <Typography scale="body-sm" as="span">
                  {label} ({counts[status] ?? 0})
                </Typography>
              </button>
            );
          }
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-stroke-muted bg-surface-subtle p-8 text-center">
          <Typography className="text-text-secondary">
            No cycles match this filter.
          </Typography>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-stroke-muted">
          <table className="w-full">
            <thead className="bg-surface-subtle">
              <tr className="text-left">
                <th className="px-3 py-2">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Status
                  </Typography>
                </th>
                <th className="px-3 py-2">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Title
                  </Typography>
                </th>
                <th className="px-3 py-2">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Project
                  </Typography>
                </th>
                <th className="px-3 py-2">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Submitter
                  </Typography>
                </th>
                <th className="px-3 py-2">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Scope
                  </Typography>
                </th>
                <th className="px-3 py-2">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Submitted
                  </Typography>
                </th>
                <th className="px-3 py-2">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Delivery
                  </Typography>
                </th>
                <th className="px-3 py-2 text-right">
                  <Typography scale="body-sm" as="span" className="opacity-70">
                    Action
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-stroke-muted hover:bg-surface-subtle/50"
                >
                  <td className="px-3 py-2 align-top">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Typography>{row.title ?? "—"}</Typography>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Typography>
                      {row.projectEmoji ? `${row.projectEmoji} ` : ""}
                      {row.projectName ?? "—"}
                    </Typography>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Typography scale="body-sm">
                      {row.submitterEmail ?? "—"}
                    </Typography>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Typography scale="body-sm" className="text-text-secondary">
                      {row.screenCount} screen{row.screenCount === 1 ? "" : "s"}
                      {row.hasScreenRecording ? " · recording" : ""}
                    </Typography>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Typography scale="body-sm" className="text-text-secondary">
                      {formatTime(row.submittedAt)} ET
                    </Typography>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Typography scale="body-sm" className="text-text-secondary">
                      {row.deliveryDate ? formatDate(row.deliveryDate) : "—"}
                    </Typography>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <Link
                      href={`/dashboard/refinement-cycles/${row.id}`}
                      className="rounded-md border border-stroke-muted bg-surface-subtle px-3 py-1.5 hover:bg-surface-strong"
                    >
                      <Typography scale="body-sm" as="span">
                        Review
                      </Typography>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
