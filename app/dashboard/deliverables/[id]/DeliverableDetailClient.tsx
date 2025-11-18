"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  default_estimate_points: number | null;
  active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type Props = {
  row: Row;
};

export default function DeliverableDetailClient({ row }: Props) {
  const router = useRouter();
  const [name, setName] = useState(row.name);
  const [category, setCategory] = useState(row.category ?? "");
  const [description, setDescription] = useState(row.description ?? "");
  const [estimate, setEstimate] = useState(
    row.default_estimate_points != null ? String(row.default_estimate_points) : ""
  );
  const [active, setActive] = useState(row.active);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const body: Record<string, unknown> = {
        name,
        category,
        description,
        active,
        defaultEstimatePoints: estimate || null,
      };
      const res = await fetch(`/api/deliverables/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save deliverable");
      }
      setSuccess("Saved");
    } catch (e) {
      setError((e as Error).message || "Failed to save deliverable");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this deliverable? This cannot be undone.")) return;
    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      const res = await fetch(`/api/deliverables/${row.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete deliverable");
      }
      router.push("/dashboard/deliverables");
    } catch (e) {
      setError((e as Error).message || "Failed to delete deliverable");
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Deliverable detail</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deliverables"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Back to deliverables
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 text-sm space-y-1">
        <div>
          <span className="font-mono opacity-70">id:</span> {row.id}
        </div>
        <div>
          <span className="font-mono opacity-70">created:</span>{" "}
          {new Date(row.created_at).toLocaleString()}
        </div>
        <div>
          <span className="font-mono opacity-70">updated:</span>{" "}
          {new Date(row.updated_at).toLocaleString()}
        </div>
      </div>

      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
        <h2 className="text-lg font-semibold">Edit deliverable</h2>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {success}
          </div>
        )}
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSave}>
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
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm min-h-[80px] bg-white text-black"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium mb-1" htmlFor="estimate">
              Default estimate (points)
            </label>
            <input
              id="estimate"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
            />
          </div>
          <div className="sm:col-span-1 flex items-center gap-2">
            <label className="text-xs font-medium" htmlFor="active">
              Active
            </label>
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}


