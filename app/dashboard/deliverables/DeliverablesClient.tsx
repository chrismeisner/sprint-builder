"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Typography from "@/components/ui/Typography";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Row = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  points: number | null;
  scope: string | null;
  format: string | null;
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
  const [format, setFormat] = useState("");
  const [points, setPoints] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointSort, setPointSort] = useState<"asc" | "desc" | null>("asc");
  const [duplicateTarget, setDuplicateTarget] = useState<Row | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateSubmitting, setDuplicateSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const formatPoints = (value: number | null) =>
    value == null ? "" : Number(value).toFixed(1).replace(/\.0$/, "");

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
        format: format || null,
        points: points || null,
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
        format: format || null,
        points: points ? Number(points) : null,
        active: true,
        created_at: now,
        updated_at: now,
      };
      setItems((prev) => [newRow, ...prev]);
      setName("");
      setCategory("");
      setDescription("");
      setScope("");
      setFormat("");
      setPoints("");
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

  const labelClass = `${getTypographyClassName("body-sm")} font-semibold text-text-secondary`;
  const tableHeadingClass = `${getTypographyClassName("body-sm")} font-semibold text-left`;
  const tableCellClass = `${getTypographyClassName("body-sm")} align-top`;
  const helperTextClass = `${getTypographyClassName("body-sm")} opacity-70`;
  const inputTextClass = getTypographyClassName("body-sm");
  const buttonTextClass = getTypographyClassName("body-sm");
  const sortedItems = useMemo(() => {
    if (!pointSort) return items;
    return [...items].sort((a, b) => {
      const aPoints = a.points;
      const bPoints = b.points;
      if (aPoints == null && bPoints == null) return 0;
      if (aPoints == null) return 1;
      if (bPoints == null) return -1;
      return pointSort === "asc" ? aPoints - bPoints : bPoints - aPoints;
    });
  }, [items, pointSort]);

  const togglePointSort = () =>
    setPointSort((prev) => {
      if (prev === "asc") return "desc";
      if (prev === "desc") return null;
      return "asc";
    });

  function openDuplicate(item: Row) {
    setDuplicateTarget(item);
    setDuplicateName(`${item.name} copy`);
    setDuplicateError(null);
  }

  function closeDuplicate() {
    setDuplicateTarget(null);
    setDuplicateName("");
    setDuplicateSubmitting(false);
    setDuplicateError(null);
  }

  async function handleDuplicate(e: React.FormEvent) {
    e.preventDefault();
    if (!duplicateTarget) return;
    const nameValue = duplicateName.trim();
    if (!nameValue) {
      setDuplicateError("Name is required");
      return;
    }
    if (duplicateTarget.points == null) {
      setDuplicateError("Cannot duplicate because points are missing on the source deliverable.");
      return;
    }
    try {
      setDuplicateSubmitting(true);
      setDuplicateError(null);
      const body: Record<string, unknown> = {
        name: nameValue,
        description: duplicateTarget.description,
        category: duplicateTarget.category,
        scope: duplicateTarget.scope,
        format: duplicateTarget.format,
        points: duplicateTarget.points,
        active: duplicateTarget.active,
      };
      const res = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to duplicate deliverable");
      }
      const id = data.id as string;
      const now = new Date().toISOString();
      const newRow: Row = {
        ...duplicateTarget,
        id,
        name: nameValue,
        created_at: now,
        updated_at: now,
      };
      setItems((prev) => [newRow, ...prev]);
      closeDuplicate();
    } catch (e) {
      setDuplicateError((e as Error).message || "Failed to duplicate deliverable");
    } finally {
      setDuplicateSubmitting(false);
    }
  }

  function handleDownloadCsv() {
    const headers = ["Name", "Category", "Points", "Active", "Format", "Scope"];
    const rows = sortedItems.map((item) => [
      item.name,
      item.category ?? "",
      formatPoints(item.points),
      item.active ? "Active" : "Inactive",
      item.format ?? "",
      item.scope ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(String(cell))).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "deliverables.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen container py-10 space-y-8 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <Typography as="h1" scale="h2">
          Deliverables
        </Typography>
        <Link
          href="/dashboard"
          className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition`}
        >
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-lg border border-black/10 dark:border-white/15 p-5 space-y-4">
        <Typography as="h2" scale="h3">
          Add deliverable
        </Typography>
        {error && (
          <div className={`${getTypographyClassName("body-sm")} rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700`}>
            {error}
          </div>
        )}
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
          <div className="sm:col-span-1">
            <label className={`${labelClass} mb-1 block`} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputTextClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
              placeholder="e.g. Product spec doc"
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
              className={`${inputTextClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
            >
              <option value="">Select category</option>
              <option value="Branding">Branding</option>
              <option value="Product">Product</option>
              <option value="Strategy">Strategy</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={`${labelClass} mb-1 block`} htmlFor="description">
              Description (when to use this)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputTextClass} w-full rounded-md border border-black/15 px-2 py-1.5 min-h-[60px] bg-white text-black`}
              placeholder="When to use this deliverable..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={`${labelClass} mb-1 block`} htmlFor="scope">
              Scope (what&apos;s included)
            </label>
            <textarea
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className={`${inputTextClass} w-full rounded-md border border-black/15 px-2 py-1.5 min-h-[80px] bg-white text-black`}
              placeholder="• Item 1&#10;• Item 2&#10;• Item 3"
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
              className={`${inputTextClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
              placeholder="e.g. Flow diagram (Figma) + annotations"
            />
          </div>
          <div className="sm:col-span-1">
            <label className={`${labelClass} mb-1 block`} htmlFor="points">
              Complexity (points)
            </label>
            <input
              id="points"
              type="number"
              step="0.1"
              min="0.1"
              max="3"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={`${inputTextClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
              placeholder="e.g. 2.5"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`${buttonTextClass} inline-flex items-center rounded-md bg-black text-white px-4 py-2 disabled:opacity-60`}
            >
              {submitting ? "Saving…" : "Add deliverable"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <Typography as="h2" scale="h3">
            Existing deliverables
          </Typography>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadCsv}
              className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10`}
            >
              Download CSV
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className={helperTextClass}>No deliverables yet.</p>
        ) : (
          <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Name</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Category</th>
                    <th
                      className={`${tableHeadingClass} px-4 py-2`}
                      aria-sort={pointSort === "asc" ? "ascending" : pointSort === "desc" ? "descending" : "none"}
                    >
                      <button type="button" onClick={togglePointSort} className="inline-flex items-center gap-1">
                        <span>Points</span>
                        <span className="text-xs opacity-70">
                          {pointSort === "asc" ? "▲" : pointSort === "desc" ? "▼" : ""}
                        </span>
                      </button>
                    </th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Active</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Format</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Scope</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item.id} className="border-t border-black/10 dark:border-white/10">
                      <td className={`${tableCellClass} px-4 py-2`}>{item.name}</td>
                      <td className={`${tableCellClass} px-4 py-2`}>
                        {item.category || <span className="opacity-50">—</span>}
                      </td>
                      <td className={`${tableCellClass} px-4 py-2`}>
                        {item.points != null ? (
                          Number(item.points).toFixed(1).replace(/\.0$/, "")
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                      <td className={`${tableCellClass} px-4 py-2`}>
                        <span
                          className={
                            item.active
                              ? `${getTypographyClassName(
                                  "body-sm"
                                )} inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5`
                              : `${getTypographyClassName(
                                  "body-sm"
                                )} inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5`
                          }
                        >
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={`${tableCellClass} px-4 py-2 whitespace-pre-wrap max-w-xs`}>
                        {item.format || <span className="opacity-50">—</span>}
                      </td>
                      <td className={`${tableCellClass} px-4 py-2 whitespace-pre-wrap max-w-xs`}>
                        {item.scope || <span className="opacity-50">—</span>}
                      </td>
                      <td className={`${tableCellClass} px-4 py-2`}>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/deliverables/${item.id}`}
                            className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10`}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDuplicate(item)}
                            className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10`}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(item)}
                            className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10`}
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

      {duplicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 p-6 shadow-lg">
            <Typography as="h3" scale="h4" className="mb-4">
              Duplicate deliverable
            </Typography>
            <form className="space-y-4" onSubmit={handleDuplicate}>
              {duplicateError && (
                <div className={`${getTypographyClassName("body-sm")} rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700`}>
                  {duplicateError}
                </div>
              )}
              <div>
                <label className={`${labelClass} mb-1 block`} htmlFor="duplicate-name">
                  New name
                </label>
                <input
                  id="duplicate-name"
                  autoFocus
                  required
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  className={`${inputTextClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
                  placeholder="Enter name"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDuplicate}
                  className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10`}
                  disabled={duplicateSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={duplicateSubmitting}
                  className={`${buttonTextClass} inline-flex items-center rounded-md bg-black text-white px-4 py-2 disabled:opacity-60`}
                >
                  {duplicateSubmitting ? "Duplicating…" : "Create duplicate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


