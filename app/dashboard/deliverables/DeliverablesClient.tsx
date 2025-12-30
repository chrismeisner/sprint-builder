"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Typography from "@/components/ui/Typography";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { hoursFromPoints } from "@/lib/pricing";

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
  tags: string[];
};

type Props = {
  rows: Row[];
};

type SortColumn = "name" | "category" | "points" | null;
type SortDirection = "asc" | "desc" | null;
const UNCATEGORIZED_KEY = "__uncategorized__";

export default function DeliverablesClient({ rows }: Props) {
  const [items, setItems] = useState<Row[]>(rows);
  const [sortColumn, setSortColumn] = useState<SortColumn>("points");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [duplicateTarget, setDuplicateTarget] = useState<Row | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateSubmitting, setDuplicateSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [enabledCategories, setEnabledCategories] = useState<string[]>(() => {
    const unique = new Set(rows.map((row) => row.category ?? UNCATEGORIZED_KEY));
    return Array.from(unique);
  });
  const [showInactive, setShowInactive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const formatPoints = (value: number | null) =>
    value == null ? "" : Number(value).toFixed(1).replace(/\.0$/, "");
  const formatHours = (value: number | null) => {
    if (value == null) return "";
    return hoursFromPoints(value).toFixed(1).replace(/\.0$/, "");
  };


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
      // For now, silently fail. Could add toast notifications later
      console.error("Failed to toggle deliverable active status:", e);
    }
  }

  const getCategoryLabel = (value: string | null) =>
    value == null ? "Uncategorized" : value;

  const labelClass = `${getTypographyClassName("body-sm")} font-semibold text-text-secondary`;
  const tableHeadingClass = `${getTypographyClassName("body-sm")} font-semibold text-left`;
  const tableCellClass = `${getTypographyClassName("body-sm")} align-top`;
  const helperTextClass = `${getTypographyClassName("body-sm")} opacity-70`;
  const inputTextClass = getTypographyClassName("body-sm");
  const buttonTextClass = getTypographyClassName("body-sm");

  const categoryOptions = useMemo(() => {
    const unique = new Set(items.map((item) => item.category ?? UNCATEGORIZED_KEY));
    return Array.from(unique).sort((a, b) => {
      const aLabel = getCategoryLabel(a === UNCATEGORIZED_KEY ? null : a);
      const bLabel = getCategoryLabel(b === UNCATEGORIZED_KEY ? null : b);
      return aLabel.localeCompare(bLabel);
    });
  }, [items]);

  useEffect(() => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      let changed = false;
      categoryOptions.forEach((cat) => {
        if (!next.has(cat)) {
          next.add(cat);
          changed = true;
        }
      });
      return changed ? Array.from(next) : prev;
    });
  }, [categoryOptions]);

  useEffect(() => {
    // Ensure latest data after navigation back from edits
    const fetchLatest = async () => {
      try {
        setRefreshing(true);
        const res = await fetch("/api/deliverables?includeInactive=true", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data.deliverables)) {
          setItems(data.deliverables as Row[]);
        }
      } catch {
        // ignore and keep existing data
      } finally {
        setRefreshing(false);
      }
    };
    fetchLatest();
  }, []);

  const filteredItems = useMemo(() => {
    if (enabledCategories.length === 0) return [];
    const enabled = new Set(enabledCategories);
    return items.filter((item) => {
      const inCategory = enabled.has(item.category ?? UNCATEGORIZED_KEY);
      const inStatus = item.active || showInactive;
      return inCategory && inStatus;
    });
  }, [items, enabledCategories, showInactive]);

  const sortedItems = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredItems;
    const compareStrings = (a?: string | null, b?: string | null) => {
      const aVal = a?.toLowerCase() ?? "";
      const bVal = b?.toLowerCase() ?? "";
      return aVal.localeCompare(bVal, undefined, { numeric: true });
    };
    const compareNumbers = (a?: number | null, b?: number | null) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return a - b;
    };
    return [...filteredItems].sort((a, b) => {
      let result = 0;
      if (sortColumn === "name") {
        result = compareStrings(a.name, b.name);
      } else if (sortColumn === "category") {
        result = compareStrings(a.category, b.category);
        if (result === 0) {
          result = compareNumbers(a.points, b.points);
        }
      } else if (sortColumn === "points") {
        result = compareNumbers(a.points, b.points);
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredItems, sortColumn, sortDirection]);

  const toggleSort = (column: SortColumn) => {
    setSortColumn((prevCol) => {
      if (prevCol !== column) {
        setSortDirection("asc");
        return column;
      }
      // same column: cycle asc -> desc -> none
      setSortDirection((prevDir) => {
        if (prevDir === "asc") return "desc";
        if (prevDir === "desc") {
          // clear sort
          setSortColumn(null);
          return null;
        }
        return "asc";
      });
      return column;
    });
  };

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
    const headers = ["Name", "Category", "Points", "Hours", "Active", "Format", "Tags"];
    const rows = sortedItems.map((item) => [
      item.name,
      item.category ?? "",
      formatPoints(item.points),
      formatHours(item.points),
      item.active ? "Active" : "Inactive",
      item.format ?? "",
      item.tags?.join("; ") ?? "",
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
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deliverables/new"
            className={`${buttonTextClass} inline-flex items-center rounded-md bg-black text-white px-4 py-2 hover:bg-gray-800 transition`}
          >
            New Deliverable
          </Link>
          <Link
            href="/dashboard"
            className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition`}
          >
            Back to dashboard
          </Link>
        </div>
      </div>


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

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className={helperTextClass}>Filter by category:</span>
          {categoryOptions.length > 0 &&
            categoryOptions.map((category) => {
              const label = getCategoryLabel(category === UNCATEGORIZED_KEY ? null : category);
              const checked = enabledCategories.includes(category);
              return (
                <label
                  key={category}
                  className={`${getTypographyClassName(
                    "body-sm"
                  )} inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setEnabledCategories((prev) => {
                        const next = new Set(prev);
                        if (next.has(category)) {
                          next.delete(category);
                        } else {
                          next.add(category);
                        }
                        return Array.from(next);
                      })
                    }
                    className="h-4 w-4 accent-black"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          <label
            className={`${getTypographyClassName(
              "body-sm"
            )} inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5`}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={() => setShowInactive((prev) => !prev)}
              className="h-4 w-4 accent-black"
            />
            <span>Show inactive</span>
          </label>
        </div>

        {items.length === 0 ? (
          <p className={helperTextClass}>No deliverables yet.</p>
        ) : sortedItems.length === 0 ? (
          <p className={helperTextClass}>No deliverables match the selected filters.</p>
        ) : (
          <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr>
                    <th
                      className={`${tableHeadingClass} px-4 py-2`}
                      aria-sort={
                        sortColumn === "name"
                          ? sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : "none"
                          : "none"
                      }
                    >
                      <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1">
                        <span>Name</span>
                        <span className="text-xs opacity-70">
                          {sortColumn === "name" ? (sortDirection === "asc" ? "▲" : sortDirection === "desc" ? "▼" : "") : ""}
                        </span>
                      </button>
                    </th>
                    <th
                      className={`${tableHeadingClass} px-4 py-2`}
                      aria-sort={
                        sortColumn === "category"
                          ? sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : "none"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort("category")}
                        className="inline-flex items-center gap-1"
                      >
                        <span>Category</span>
                        <span className="text-xs opacity-70">
                          {sortColumn === "category"
                            ? sortDirection === "asc"
                              ? "▲"
                              : sortDirection === "desc"
                                ? "▼"
                                : ""
                            : ""}
                        </span>
                      </button>
                    </th>
                    <th
                      className={`${tableHeadingClass} px-4 py-2`}
                      aria-sort={
                        sortColumn === "points"
                          ? sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : "none"
                          : "none"
                      }
                    >
                      <button type="button" onClick={() => toggleSort("points")} className="inline-flex items-center gap-1">
                        <span>Points</span>
                        <span className="text-xs opacity-70">
                          {sortColumn === "points"
                            ? sortDirection === "asc"
                              ? "▲"
                              : sortDirection === "desc"
                                ? "▼"
                                : ""
                            : ""}
                        </span>
                      </button>
                    </th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Hours</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Active</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Format</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Tags</th>
                    <th className={`${tableHeadingClass} px-4 py-2`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t border-black/10 dark:border-white/10 ${
                        item.active ? "" : "bg-gray-50 dark:bg-white/5 text-black/60 dark:text-white/60"
                      }`}
                    >
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
                        {item.points != null ? (
                          hoursFromPoints(Number(item.points)).toFixed(1).replace(/\.0$/, "")
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
                      <td className={`${tableCellClass} px-4 py-2`}>
                        {item.tags && item.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`${getTypographyClassName(
                                  "body-xs"
                                )} inline-flex items-center rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
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


