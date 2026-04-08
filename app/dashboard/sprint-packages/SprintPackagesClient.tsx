"use client";

import { useState } from "react";
import Link from "next/link";
import { priceFromPoints } from "@/lib/pricing";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  emoji: string | null;
  pricing_mode: "calculated" | "flat";
  package_type: string | null;
  duration_weeks: number;
  requires_package_type: string | null;
  requires_package_id: string | null;
  flat_fee: number | null;
  base_rate: number | null;
  active: boolean;
  featured?: boolean | null;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
  deliverables: Array<{
    deliverableId: string;
    name: string;
    points: number | null;
    quantity: number;
  }>;
};

type Props = {
  rows: Row[];
};

export default function SprintPackagesClient({ rows }: Props) {
  const [items, setItems] = useState<Row[]>(rows);
  const [typeFilter, setTypeFilter] = useState<"all" | "sprints" | "expansion">("all");

  async function toggleActive(item: Row) {
    try {
      const res = await fetch(`/api/sprint-packages/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update package");
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, active: !row.active, updated_at: new Date().toISOString() }
            : row
        )
      );
    } catch (e) {
      alert((e as Error).message || "Failed to update package");
    }
  }

  async function deletePackage(item: Row) {
    if (!confirm(`Delete package "${item.name}"? This cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/sprint-packages/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete package");
      }
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (e) {
      alert((e as Error).message || "Failed to delete package");
    }
  }

  function calculatePackageTotals(pkg: Row): { totalPrice: number } {
    const scopePoints = pkg.deliverables.reduce((sum, d) => {
      const qty = d.quantity ?? 1;
      return sum + (d.points ?? 0) * qty;
    }, 0);
    const totalPrice =
      pkg.pricing_mode === "flat" && pkg.flat_fee != null
        ? pkg.flat_fee
        : priceFromPoints(scopePoints, pkg.base_rate);
    return { totalPrice };
  }

  const filteredItems = items.filter((item) => {
    if (typeFilter === "all") return true;
    const isExpansion = item.package_type === "expansion_cycle";
    if (typeFilter === "expansion") return isExpansion;
    return !isExpansion;
  });

  return (
    <main className="container min-h-screen max-w-6xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Sprint Packages</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/sprint-packages/new"
            className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm hover:bg-black/80 transition"
          >
            Create Package
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {typeFilter === "all"
              ? `All Packages (${filteredItems.length})`
              : typeFilter === "sprints"
                ? `Sprint Packages (${filteredItems.length})`
                : `Expansion Cycles (${filteredItems.length})`}
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="packageTypeFilter" className="text-xs opacity-70">
              Filter
            </label>
            <select
              id="packageTypeFilter"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value === "sprints"
                    ? "sprints"
                    : e.target.value === "expansion"
                      ? "expansion"
                      : "all"
                )
              }
              className="rounded-md border border-black/15 px-2 py-1 text-sm bg-white text-black"
            >
              <option value="all">All</option>
              <option value="sprints">Sprints</option>
              <option value="expansion">Expansion cycles</option>
            </select>
          </div>
        </div>
        
        {filteredItems.length === 0 ? (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-8 text-center">
            <p className="text-sm opacity-70 mb-4">
              {typeFilter === "all"
                ? "No sprint packages yet."
                : typeFilter === "sprints"
                  ? "No sprint packages match this filter."
                  : "No expansion cycles match this filter."}
            </p>
            <Link
              href="/dashboard/sprint-packages/new"
              className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm hover:bg-black/80 transition"
            >
              Create your first package
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredItems.map((item) => {
              const { totalPrice } = calculatePackageTotals(item);

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3 hover:border-black/20 dark:hover:border-white/25 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                        {item.emoji && <span className="text-xl" aria-hidden>{item.emoji}</span>}
                        <span>{item.name}</span>
                      </h3>
                      {item.tagline && (
                        <p className="text-sm opacity-80 mb-2">{item.tagline}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={
                            item.active
                              ? "inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs"
                              : "inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs"
                          }
                        >
                          {item.active ? "Active" : "Inactive"}
                        </span>
                        {item.featured && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs">
                            ⭐ Featured
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/10 text-xs px-2 py-0.5 text-black/80 dark:text-white/80">
                          Sort: {item.sort_order}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs">
                          {item.package_type === "expansion_cycle" ? "Expansion cycle" : "Standard sprint"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/10 text-xs px-2 py-0.5 text-black/80 dark:text-white/80">
                          {item.duration_weeks} week{item.duration_weeks === 1 ? "" : "s"}
                        </span>
                        {item.requires_package_type && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs">
                            Requires: {item.requires_package_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm opacity-70 line-clamp-2">{item.description}</p>
                  )}

                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="rounded bg-black/5 dark:bg-white/5 p-2">
                      <div className="text-xs opacity-70 mb-1">Total Price</div>
                      <div className="font-semibold text-lg">
                        ${totalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {item.package_type !== "expansion_cycle" && (
                    <div>
                      <div className="text-xs opacity-70 mb-2">
                        Deliverables ({item.deliverables.length})
                      </div>
                      {item.deliverables.length === 0 ? (
                        <span className="text-xs opacity-50">No deliverables</span>
                      ) : (
                        <div className="rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden">
                          <div className="px-3 py-2 text-[11px] uppercase tracking-[0.02em] text-black/60 dark:text-white/60 bg-black/5 dark:bg-white/10">
                            <span>Deliverable</span>
                          </div>
                          <div className="divide-y divide-black/10 dark:divide-white/10 max-h-48 overflow-auto">
                            {item.deliverables.map((d, i) => {
                              return (
                                <div
                                  key={`${d.deliverableId}-${i}`}
                                  className="px-3 py-1.5 text-xs items-center"
                                >
                                  <span className="truncate" title={d.name}>
                                    {d.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                    <Link
                      href={`/dashboard/sprint-packages/${item.id}/edit`}
                      className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {item.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePackage(item)}
                      className="inline-flex items-center rounded-md border border-red-200 text-red-700 dark:border-red-800 dark:text-red-400 px-3 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

