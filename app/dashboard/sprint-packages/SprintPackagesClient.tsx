"use client";

import { useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tagline: string | null;
  flat_fee: number | null;
  flat_hours: number | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
  deliverables: Array<{
    deliverableId: string;
    name: string;
    fixedHours: number | null;
    fixedPrice: number | null;
    quantity: number;
  }>;
};

type Props = {
  rows: Row[];
};

export default function SprintPackagesClient({ rows }: Props) {
  const [items, setItems] = useState<Row[]>(rows);

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

  async function toggleFeatured(item: Row) {
    try {
      const res = await fetch(`/api/sprint-packages/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !item.featured }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update package");
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, featured: !row.featured, updated_at: new Date().toISOString() }
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

  function calculatePackageTotal(pkg: Row): { hours: number; price: number } {
    let totalHours = 0;
    let totalPrice = 0;

    pkg.deliverables.forEach((d) => {
      const hours = d.fixedHours ?? 0;
      const price = d.fixedPrice ?? 0;
      const qty = d.quantity ?? 1;
      totalHours += hours * qty;
      totalPrice += price * qty;
    });

    return { hours: totalHours, price: totalPrice };
  }

  function getFinalPrice(pkg: Row): number {
    // If flat fee is set, use that
    if (pkg.flat_fee != null) return pkg.flat_fee;
    
    // Otherwise calculate from deliverables
    const { price } = calculatePackageTotal(pkg);
    return price;
  }

  function getFinalHours(pkg: Row): number {
    // If flat hours is set, use that
    if (pkg.flat_hours != null) return pkg.flat_hours;
    
    // Otherwise calculate from deliverables
    const { hours } = calculatePackageTotal(pkg);
    return hours;
  }

  return (
    <main className="container min-h-screen max-w-6xl space-y-6 py-6 font-[family-name:var(--font-geist-sans)]">
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
          <h2 className="text-lg font-semibold">All Packages ({items.length})</h2>
        </div>
        
        {items.length === 0 ? (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-8 text-center">
            <p className="text-sm opacity-70 mb-4">No sprint packages yet.</p>
            <Link
              href="/dashboard/sprint-packages/new"
              className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm hover:bg-black/80 transition"
            >
              Create your first package
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const finalPrice = getFinalPrice(item);
              const finalHours = getFinalHours(item);
              const { price: calculatedPrice } = calculatePackageTotal(item);

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3 hover:border-black/20 dark:hover:border-white/25 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
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
                        {item.category && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm opacity-70 line-clamp-2">{item.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded bg-black/5 dark:bg-white/5 p-2">
                      <div className="text-xs opacity-70 mb-1">Price</div>
                      <div className="font-semibold text-lg">
                        ${finalPrice.toLocaleString()}
                      </div>
                      {item.flat_fee != null && calculatedPrice !== item.flat_fee && (
                        <div className="text-xs opacity-60">
                          (from ${calculatedPrice.toLocaleString()})
                        </div>
                      )}
                    </div>
                    <div className="rounded bg-black/5 dark:bg-white/5 p-2">
                      <div className="text-xs opacity-70 mb-1">Hours</div>
                      <div className="font-semibold text-lg">{finalHours}h</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs opacity-70 mb-1">
                      Deliverables ({item.deliverables.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.deliverables.length === 0 ? (
                        <span className="text-xs opacity-50">No deliverables</span>
                      ) : (
                        item.deliverables.map((d, i) => (
                          <span
                            key={`${d.deliverableId}-${i}`}
                            className="inline-flex items-center rounded bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs"
                          >
                            {d.name}
                            {d.quantity > 1 && ` (×${d.quantity})`}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

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
                      onClick={() => toggleFeatured(item)}
                      className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {item.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePackage(item)}
                      className="inline-flex items-center rounded-md border border-red-200 text-red-700 dark:border-red-800 dark:text-red-400 px-3 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="text-[10px] font-mono opacity-50">
                    slug: {item.slug}
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

