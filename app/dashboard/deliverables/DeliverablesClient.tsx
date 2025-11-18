"use client";

import { useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  default_estimate_points: number | null;
  fixed_hours: number | null;
  fixed_price: number | null;
  scope: string | null;
  active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type Props = {
  rows: Row[];
};

export default function DeliverablesClient({ rows }: Props) {
  const [items, setItems] = useState<Row[]>(rows);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("");
  const [estimate, setEstimate] = useState("");
  const [hours, setHours] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const body: Record<string, unknown> = {
        name,
        description: description || null,
        category: category || null,
        scope: scope || null,
        defaultEstimatePoints: estimate || null,
        fixedHours: hours || null,
        fixedPrice: price || null,
      };
      const res = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create deliverable");
      }
      const id = data.id as string;
      const now = new Date().toISOString();
      const newRow: Row = {
        id,
        name,
        description: description || null,
        category: category || null,
        scope: scope || null,
        default_estimate_points: estimate ? Number(estimate) : null,
        fixed_hours: hours ? Number(hours) : null,
        fixed_price: price ? Number(price) : null,
        active: true,
        created_at: now,
        updated_at: now,
      };
      setItems((prev) => [newRow, ...prev]);
      setName("");
      setCategory("");
      setDescription("");
      setScope("");
      setEstimate("");
      setHours("");
      setPrice("");
    } catch (e) {
      setError((e as Error).message || "Failed to create deliverable");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item: Row) {
    try {
      const res = await fetch(`/api/deliverables/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update deliverable");
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, active: !row.active, updated_at: new Date().toISOString() } : row
        )
      );
    } catch (e) {
      setError((e as Error).message || "Failed to update deliverable");
    }
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Deliverables</h1>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
        <h2 className="text-lg font-semibold">Add deliverable</h2>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              placeholder="e.g. Product spec doc"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
            >
              <option value="">Select category</option>
              <option value="Branding">Branding</option>
              <option value="Product">Product</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" htmlFor="description">
              Description (when to use this)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm min-h-[60px] bg-white text-black"
              placeholder="When to use this deliverable..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" htmlFor="scope">
              Scope (what&apos;s included)
            </label>
            <textarea
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm min-h-[80px] bg-white text-black"
              placeholder="• Item 1&#10;• Item 2&#10;• Item 3"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" htmlFor="estimate">
              Default estimate (points)
            </label>
            <input
              id="estimate"
              type="number"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              placeholder="e.g. 3"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" htmlFor="hours">
              Fixed hours
            </label>
            <input
              id="hours"
              type="number"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              placeholder="e.g. 40"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" htmlFor="price">
              Fixed price ($)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              placeholder="e.g. 5000"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Add deliverable"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Existing deliverables</h2>
        {items.length === 0 ? (
          <p className="text-sm opacity-70">No deliverables yet.</p>
        ) : (
          <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/5 dark:bg-white/5 text-left">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Name</th>
                    <th className="px-4 py-2 font-semibold">Category</th>
                    <th className="px-4 py-2 font-semibold">Points</th>
                    <th className="px-4 py-2 font-semibold">Hours</th>
                    <th className="px-4 py-2 font-semibold">Price</th>
                    <th className="px-4 py-2 font-semibold">Active</th>
                    <th className="px-4 py-2 font-semibold">Scope</th>
                    <th className="px-4 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-black/10 dark:border-white/10 align-top">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">
                        {item.category || <span className="opacity-50">—</span>}
                      </td>
                      <td className="px-4 py-2">
                        {item.default_estimate_points != null ? (
                          item.default_estimate_points
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {item.fixed_hours != null ? (
                          `${item.fixed_hours}h`
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {item.fixed_price != null ? (
                          `$${item.fixed_price.toLocaleString()}`
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            item.active
                              ? "inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs"
                              : "inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs"
                          }
                        >
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-pre-wrap max-w-xs text-xs">
                        {item.scope || <span className="opacity-50">—</span>}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/deliverables/${item.id}`}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}


