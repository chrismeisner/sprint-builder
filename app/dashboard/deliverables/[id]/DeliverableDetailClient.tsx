"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Typography from "@/components/ui/Typography";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Row = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  points: number | null;
  format: string | null;
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
  const [format, setFormat] = useState(row.format ?? "");
  const [points, setPoints] = useState(row.points != null ? String(row.points) : "");
  const [active, setActive] = useState(row.active);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const labelClass = `${getTypographyClassName("body-sm")} font-semibold text-text-secondary`;
  const bodySm = getTypographyClassName("body-sm");
  const buttonTextClass = bodySm;

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
        format,
        active,
        points: points || null,
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
    <main className="min-h-screen container py-8 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <Typography as="h1" scale="h2">
          Deliverable detail
        </Typography>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deliverables"
            className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition`}
          >
            Back to deliverables
          </Link>
          <Link
            href="/dashboard"
            className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition`}
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className={`${bodySm} rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-1`}>
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
        <Typography as="h2" scale="h3">
          Edit deliverable
        </Typography>
        {error && (
          <div className={`${bodySm} rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`${bodySm} rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-700`}>
            {success}
          </div>
        )}
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSave}>
          <div className="sm:col-span-1">
            <label className={`${labelClass} mb-1 block`} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${bodySm} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
            />
          </div>
          <div className="sm:col-span-1">
            <label className={`${labelClass} mb-1 block`} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${bodySm} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
            >
              <option value="">Select category</option>
              <option value="Branding">Branding</option>
              <option value="Product">Product</option>
              <option value="Workshop">Workshop</option>
              <option value="Strategy">Strategy</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={`${labelClass} mb-1 block`} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${bodySm} w-full rounded-md border border-black/15 px-2 py-1.5 min-h-[80px] bg-white text-black`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={`${labelClass} mb-1 block`} htmlFor="format">
              Format (what we deliver)
            </label>
            <input
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={`${bodySm} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
              placeholder="e.g. Flow diagram (Figma) + annotations"
            />
          </div>
          <div className="sm:col-span-1">
            <label className={`${labelClass} mb-1 block`} htmlFor="points">
              Complexity (points)
            </label>
            <input
              id="points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={`${bodySm} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
            />
          </div>
          <div className="sm:col-span-1 flex items-center gap-2">
            <label className={labelClass} htmlFor="active">
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
              className={`${buttonTextClass} inline-flex items-center rounded-md bg-black text-white px-4 py-2 disabled:opacity-60`}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`${buttonTextClass} inline-flex items-center rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-60`}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}


