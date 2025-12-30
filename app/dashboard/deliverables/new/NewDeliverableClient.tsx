"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Typography from "@/components/ui/Typography";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { hoursFromPoints } from "@/lib/pricing";

export default function NewDeliverableClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("");
  const [format, setFormat] = useState("");
  const [points, setPoints] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const computedHours =
    Number.isFinite(Number(points)) && points !== ""
      ? hoursFromPoints(Number(points))
      : null;

  const labelClass = `${getTypographyClassName("body-sm")} font-semibold text-text-secondary`;
  const inputTextClass = getTypographyClassName("body-sm");
  const buttonTextClass = getTypographyClassName("body-sm");

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
          const merged = new Set<string>([...prev, ...data.tags.map((t: { name: string }) => t.name)]);
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
  }, []);

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
        tags,
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
      // Redirect back to the main deliverables page
      router.push("/dashboard/deliverables");
    } catch (e) {
      setError((e as Error).message || "Failed to create deliverable");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen container py-10 space-y-8 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <Typography as="h1" scale="h2">
          New Deliverable
        </Typography>
        <Link
          href="/dashboard/deliverables"
          className={`${buttonTextClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition`}
        >
          Back to deliverables
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
          <div className="sm:col-span-2">
            <label className={`${labelClass} mb-1 block`} htmlFor="tags">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 && <span className="opacity-60 text-sm">No tags yet.</span>}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-black/5 dark:bg-white/10 px-3 py-1"
                  >
                    <span className={inputTextClass}>{tag}</span>
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
                  className={`${inputTextClass} w-full sm:w-auto flex-1 rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
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
                <div className={`${inputTextClass} flex flex-wrap gap-2`}>
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
            <div className="mt-1 text-xs opacity-70">
              {computedHours != null
                ? `${computedHours.toFixed(1).replace(/\\.0$/, "")} hours`
                : "Enter a valid number to see hours"}
            </div>
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`${buttonTextClass} inline-flex items-center rounded-md bg-black text-white px-4 py-2 disabled:opacity-60`}
            >
              {submitting ? "Creating…" : "Create deliverable"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
