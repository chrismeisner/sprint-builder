"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { priceFromPoints, pricingFormulaText } from "@/lib/pricing";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  scope: string | null;
  points: number | null;
};

type SelectedDeliverable = {
  deliverableId: string;
  quantity: number;
  sortOrder: number;
};

type Package = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  emoji: string | null;
  active: boolean;
  sort_order: number;
  deliverables: Array<{
    deliverableId: string;
    quantity: number;
    sortOrder: number;
  }>;
};

type Props = {
  deliverables: Deliverable[];
  existingPackage?: Package;
};

export default function SprintPackageFormClient({ deliverables, existingPackage }: Props) {
  const router = useRouter();
  const isEdit = !!existingPackage;

  // Form fields
  const [name, setName] = useState(existingPackage?.name || "");
  const [slug, setSlug] = useState(existingPackage?.slug || "");
  const [tagline, setTagline] = useState(existingPackage?.tagline || "");
  const [description, setDescription] = useState(existingPackage?.description || "");
  const [emoji, setEmoji] = useState(existingPackage?.emoji || "");
  const [active, setActive] = useState(existingPackage?.active ?? true);
  const [sortOrder, setSortOrder] = useState(existingPackage?.sort_order?.toString() || "0");
  const [availableSearch, setAvailableSearch] = useState("");

  // Selected deliverables
  const [selectedDeliverables, setSelectedDeliverables] = useState<SelectedDeliverable[]>(
    existingPackage?.deliverables || []
  );

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && name && !slug) {
      const autoSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(autoSlug);
    }
  }, [name, slug, isEdit]);

  function addDeliverable(deliverableId: string) {
    if (selectedDeliverables.some((d) => d.deliverableId === deliverableId)) {
      return; // Already added
    }
    setSelectedDeliverables([
      ...selectedDeliverables,
      {
        deliverableId,
        quantity: 1,
        sortOrder: selectedDeliverables.length,
      },
    ]);
  }

  function removeDeliverable(deliverableId: string) {
    setSelectedDeliverables(
      selectedDeliverables.filter((d) => d.deliverableId !== deliverableId)
    );
  }

  function updateQuantity(deliverableId: string, quantity: number) {
    setSelectedDeliverables(
      selectedDeliverables.map((d) =>
        d.deliverableId === deliverableId ? { ...d, quantity } : d
      )
    );
  }

  function moveDeliverable(deliverableId: string, direction: "up" | "down") {
    const index = selectedDeliverables.findIndex((d) => d.deliverableId === deliverableId);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedDeliverables.length) return;

    const newList = [...selectedDeliverables];
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    
    // Update sort orders
    newList.forEach((d, i) => {
      d.sortOrder = i;
    });
    
    setSelectedDeliverables(newList);
  }

  function calculateTotals() {
    let totalComplexity = 0;
    selectedDeliverables.forEach((sd) => {
      const d = deliverables.find((del) => del.id === sd.deliverableId);
      if (d) {
        totalComplexity += (d.points ?? 0) * sd.quantity;
      }
    });
    const totalPrice = priceFromPoints(totalComplexity);
    return { totalComplexity, totalPrice };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body = {
        name,
        slug,
        tagline: tagline || null,
        description: description || null,
        emoji: emoji || null,
        active,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        deliverables: selectedDeliverables,
      };

      const url = isEdit
        ? `/api/sprint-packages/${existingPackage.id}`
        : "/api/sprint-packages";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to ${isEdit ? "update" : "create"} package`);
      }

      router.push("/dashboard/sprint-packages");
    } catch (e) {
      setError((e as Error).message || `Failed to ${isEdit ? "update" : "create"} package`);
      setSubmitting(false);
    }
  }

  const { totalComplexity, totalPrice } = calculateTotals();
  const availableDeliverables = deliverables.filter((d) => {
    if (selectedDeliverables.some((sd) => sd.deliverableId === d.id)) return false;
    if (!availableSearch.trim()) return true;
    const term = availableSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(term) ||
      (d.description?.toLowerCase().includes(term) ?? false)
    );
  });

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isEdit ? "Edit Sprint Package" : "Create Sprint Package"}
        </h1>
        <Link
          href="/dashboard/sprint-packages"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="name">
                Name *
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
                placeholder="e.g. MVP Launch Package"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="slug">
                Slug *
              </label>
              <input
                id="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black font-mono"
                placeholder="e.g. mvp-launch-package"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="tagline">
              Tagline
            </label>
            <input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              placeholder="e.g. Launch your MVP in 2 weeks"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm min-h-[80px] bg-white text-black"
              placeholder="Describe what's included in this package..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="emoji">
              Emoji
            </label>
            <input
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              placeholder="e.g. 🚀"
            />
            <p className="text-[11px] opacity-60 mt-1">Optional. Shown alongside the package name.</p>
          </div>
        </section>

        {/* Deliverables Selection */}
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Deliverables</h2>
            <div className="text-xs opacity-70">Drag order with arrows; edit qty on right</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Available */}
            <div className="rounded-md border border-black/10 dark:border-white/15 p-3 space-y-2 bg-white/60 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Available</h3>
                <span className="text-[11px] opacity-60 whitespace-nowrap">
                  {availableDeliverables.length} items
                </span>
              </div>

              <input
                type="text"
                value={availableSearch}
                onChange={(e) => setAvailableSearch(e.target.value)}
                placeholder="Search deliverables..."
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              />

              {availableDeliverables.length === 0 ? (
                <p className="text-xs opacity-60">All deliverables have been added.</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {availableDeliverables.map((d) => (
                    <div
                      key={d.id}
                      className="rounded border border-black/10 dark:border-white/10 p-2 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{d.name}</div>
                        <div className="text-[11px] opacity-70">
                          Complexity: {d.points ?? "—"} pts
                        </div>
                        {d.description && (
                          <p className="text-[11px] opacity-70 line-clamp-2 mt-1">{d.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addDeliverable(d.id)}
                        className="text-xs rounded-md border border-black/10 dark:border-white/20 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected */}
            <div className="rounded-md border border-black/10 dark:border-white/15 p-3 space-y-2 bg-white/80 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Selected</h3>
                <span className="text-[11px] opacity-60">{selectedDeliverables.length} items</span>
              </div>

              {selectedDeliverables.length === 0 ? (
                <p className="text-sm opacity-70">No deliverables selected yet. Add from the left.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDeliverables.map((sd, index) => {
                    const d = deliverables.find((del) => del.id === sd.deliverableId);
                    if (!d) return null;

                    return (
                      <div
                        key={sd.deliverableId}
                        className="rounded border border-black/10 dark:border-white/15 p-3 flex flex-col gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => moveDeliverable(sd.deliverableId, "up")}
                              disabled={index === 0}
                              className="text-xs px-1 py-0.5 border rounded disabled:opacity-30"
                              aria-label="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDeliverable(sd.deliverableId, "down")}
                              disabled={index === selectedDeliverables.length - 1}
                              className="text-xs px-1 py-0.5 border rounded disabled:opacity-30"
                              aria-label="Move down"
                            >
                              ↓
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{d.name}</div>
                            <div className="text-xs opacity-70">
                              Complexity: {d.points ?? "—"} pts · Points set on deliverable
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeDeliverable(sd.deliverableId)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="text-xs">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={sd.quantity}
                            onChange={(e) =>
                              updateQuantity(sd.deliverableId, parseInt(e.target.value) || 1)
                            }
                            className="w-20 rounded border border-black/15 px-2 py-1 text-sm bg-white text-black"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Calculated totals */}
          {selectedDeliverables.length > 0 && (
            <div className="rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
              <div className="text-xs font-medium mb-2 opacity-70">
                Calculated from deliverables:
              </div>
              <div className="flex gap-4 text-sm flex-wrap">
                <div>
                  <span className="opacity-70">Total Complexity:</span>{" "}
                  <span className="font-semibold">{totalComplexity.toFixed(1)}</span>
                </div>
                <div>
                  <span className="opacity-70">Total Price:</span>{" "}
                  <span className="font-semibold">${totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-[11px] opacity-70 mt-2">
                {pricingFormulaText()}
              </div>
            </div>
          )}
        </section>

        {/* Settings */}
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
          <h2 className="text-lg font-semibold">Settings</h2>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Active (visible to clients)</span>
            </label>
          </div>

          <div className="w-32">
            <label className="block text-xs font-medium mb-1" htmlFor="sortOrder">
              Sort Order
            </label>
            <input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
            />
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {submitting
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
              ? "Update Package"
              : "Create Package"}
          </button>
          <Link
            href="/dashboard/sprint-packages"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}

