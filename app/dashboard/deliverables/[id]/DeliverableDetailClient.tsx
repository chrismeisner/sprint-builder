"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Typography from "@/components/ui/Typography";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { hoursFromPoints, priceFromPoints } from "@/lib/pricing";

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
  row: Row;
  availableTags: string[];
};

export default function DeliverableDetailClient({ row, availableTags: initialTags }: Props) {
  const router = useRouter();
  const [name, setName] = useState(row.name);
  const [category, setCategory] = useState(row.category ?? "");
  const [description, setDescription] = useState(row.description ?? "");
  const [scope, setScope] = useState(row.scope ?? "");
  const [format, setFormat] = useState(row.format ?? "");
  const [points, setPoints] = useState(row.points != null ? String(row.points) : "");
  const [active, setActive] = useState(row.active);
  const [tags, setTags] = useState<string[]>(row.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>(() => {
    const unique = new Set<string>([...(row.tags || []), ...initialTags]);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const computedHours = useMemo(() => {
    const val = Number(points);
    if (Number.isFinite(val)) {
      return hoursFromPoints(val);
    }
    return null;
  }, [points]);

  const computedBudget = useMemo(() => {
    const val = Number(points);
    if (Number.isFinite(val)) {
      return priceFromPoints(val);
    }
    return null;
  }, [points]);

  const labelClass = `${getTypographyClassName("body-sm")} font-semibold text-text-secondary`;
  const bodySm = getTypographyClassName("body-sm");
  const buttonTextClass = bodySm;

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setAvailableTags((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b));
    });
    setTagInput("");
  };

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value));
  };

  const toggleExistingTag = (value: string) => {
    setTags((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  };

  const filteredOptions = availableTags.filter(
    (tag) =>
      !tags.includes(tag) &&
      (tagInput.trim().length === 0 ||
        tag.toLowerCase().includes(tagInput.trim().toLowerCase()))
  );

  const refreshAvailableTags = async () => {
    try {
      setTagsLoading(true);
      const res = await fetch("/api/deliverable-tags");
      const data = await res.json();
      if (res.ok && Array.isArray(data.tags)) {
        setAvailableTags((prev) => {
          const merged = new Set<string>([...prev, ...data.tags.map((t: any) => t.name as string)]);
          return Array.from(merged).sort((a, b) => a.localeCompare(b));
        });
      }
    } catch {
      // non-blocking
    } finally {
      setTagsLoading(false);
    }
  };

  useEffect(() => {
    refreshAvailableTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        scope,
        format,
        active,
        points: points || null,
        tags,
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
      router.push("/dashboard/deliverables");
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
            <label className={`${labelClass} mb-1 block`} htmlFor="tags">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 && <span className="opacity-60">No tags yet.</span>}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-black/5 dark:bg-white/10 px-3 py-1"
                  >
                    <span className={bodySm}>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-xs opacity-70 hover:opacity-100"
                      aria-label={`Remove ${tag}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                onFocus={() => {
                  setTagDropdownOpen(true);
                  refreshAvailableTags();
                }}
                onBlur={() => {
                  // Slight delay to allow click selection
                  setTimeout(() => setTagDropdownOpen(false), 100);
                }}
                  className={`${bodySm} w-full sm:w-auto flex-1 rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
                  placeholder="Type a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10`}
                >
                  Add tag
                </button>
              </div>
            {tagDropdownOpen && (
              <div className="mt-1 max-h-48 w-full sm:w-80 overflow-auto rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-[#111] shadow">
                {tagsLoading ? (
                  <div className="px-3 py-2 text-sm opacity-70">Loading tags…</div>
                ) : filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm opacity-70">No matching tags</div>
                ) : (
                  filteredOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addTag(tag);
                      }}
                      className="block w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {tag}
                    </button>
                  ))
                )}
              </div>
            )}
              {availableTags.length > 0 && (
                <div className={`${bodySm} flex flex-wrap gap-2`}>
                  {availableTags.map((tag) => {
                    const checked = tags.includes(tag);
                    return (
                      <label
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/15 px-2 py-1"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExistingTag(tag)}
                          className="h-4 w-4"
                        />
                        <span>{tag}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        <div className="sm:col-span-2">
          <label className={`${labelClass} mb-1 block`} htmlFor="scope">
            Scope (what&apos;s included)
          </label>
          <textarea
            id="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className={`${bodySm} w-full rounded-md border border-black/15 px-2 py-1.5 min-h-[80px] bg-white text-black`}
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
            <div className="mt-1 text-xs opacity-70 space-y-0.5">
              <div>
                {computedHours != null
                  ? `${computedHours.toFixed(1).replace(/\\.0$/, "")} hours`
                  : "Enter a valid number to see hours"}
              </div>
              <div>
                {computedBudget != null
                  ? `$${computedBudget.toLocaleString()} budget`
                  : "Enter a valid number to see budget"}
              </div>
            </div>
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


