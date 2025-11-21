"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  fixed_hours: number | null;
  fixed_price: number | null;
  default_estimate_points: number | null;
};

type SelectedDeliverable = {
  deliverableId: string;
  quantity: number;
  sortOrder: number;
  complexityScore: number;
};

type Package = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tagline: string | null;
  flat_fee: number | null;       // NULL = dynamic pricing
  flat_hours: number | null;     // NULL = dynamic hours
  active: boolean;
  featured: boolean;
  sort_order: number;
  deliverables: Array<{
    deliverableId: string;
    quantity: number;
    sortOrder: number;
    complexityScore: number;
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
  const [category, setCategory] = useState(existingPackage?.category || "");
  const [flatFee, setFlatFee] = useState(existingPackage?.flat_fee?.toString() || "");
  const [flatHours, setFlatHours] = useState(existingPackage?.flat_hours?.toString() || "");
  const [active, setActive] = useState(existingPackage?.active ?? true);
  const [featured, setFeatured] = useState(existingPackage?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(existingPackage?.sort_order?.toString() || "0");

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
        complexityScore: 2.5, // Default: standard complexity
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

  function updateComplexityScore(deliverableId: string, complexityScore: number) {
    setSelectedDeliverables(
      selectedDeliverables.map((d) =>
        d.deliverableId === deliverableId ? { ...d, complexityScore } : d
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
    let totalHours = 0;
    let totalPrice = 0;

    selectedDeliverables.forEach((sd) => {
      const d = deliverables.find((del) => del.id === sd.deliverableId);
      if (d) {
        const complexityMultiplier = (sd.complexityScore ?? 2.5) / 2.5;
        totalHours += (d.fixed_hours ?? 0) * complexityMultiplier * sd.quantity;
        totalPrice += (d.fixed_price ?? 0) * complexityMultiplier * sd.quantity;
      }
    });

    return { totalHours, totalPrice };
  }

  function getFinalPrice(): number {
    // If flat_fee is set, use it as override (rare)
    // Otherwise, calculate dynamically from deliverables
    if (flatFee) {
      return Number(flatFee);
    }
    const { totalPrice } = calculateTotals();
    return totalPrice;
  }

  function getFinalHours(): number {
    if (flatHours) {
      return Number(flatHours);
    }
    const { totalHours } = calculateTotals();
    return totalHours;
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
        category: category || null,
        flatFee: flatFee ? Number(flatFee) : null,  // NULL = dynamic pricing
        flatHours: flatHours ? Number(flatHours) : null,  // NULL = dynamic hours
        active,
        featured,
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

  const { totalHours, totalPrice } = calculateTotals();
  const finalPrice = getFinalPrice();
  const finalHours = getFinalHours();

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
              <option value="Complete">Complete</option>
              <option value="Startup">Startup</option>
            </select>
          </div>
        </section>

        {/* Deliverables Selection */}
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
          <h2 className="text-lg font-semibold">Deliverables</h2>
          
          {selectedDeliverables.length === 0 ? (
            <p className="text-sm opacity-70">No deliverables selected yet.</p>
          ) : (
            <div className="space-y-2">
              {selectedDeliverables.map((sd, index) => {
                const d = deliverables.find((del) => del.id === sd.deliverableId);
                if (!d) return null;
                
                return (
                  <div
                    key={sd.deliverableId}
                    className="rounded border border-black/10 dark:border-white/15 p-3 flex items-center gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveDeliverable(sd.deliverableId, "up")}
                        disabled={index === 0}
                        className="text-xs px-1 py-0.5 border rounded disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDeliverable(sd.deliverableId, "down")}
                        disabled={index === selectedDeliverables.length - 1}
                        className="text-xs px-1 py-0.5 border rounded disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm">{d.name}</div>
                      <div className="text-xs opacity-70">
                        Base: {d.fixed_hours}h • ${d.fixed_price?.toLocaleString()}
                        {sd.complexityScore !== 2.5 && (
                          <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">
                            → Adjusted: {((d.fixed_hours ?? 0) * (sd.complexityScore / 2.5)).toFixed(1)}h • 
                            ${((d.fixed_price ?? 0) * (sd.complexityScore / 2.5)).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={sd.quantity}
                        onChange={(e) =>
                          updateQuantity(sd.deliverableId, parseInt(e.target.value) || 1)
                        }
                        className="w-16 rounded border border-black/15 px-2 py-1 text-sm bg-white text-black"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-xs whitespace-nowrap" title="1=Very Simple, 2.5=Standard, 5=Very Complex">
                        Complexity:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={sd.complexityScore}
                        onChange={(e) =>
                          updateComplexityScore(sd.deliverableId, parseFloat(e.target.value) || 2.5)
                        }
                        className="w-16 rounded border border-black/15 px-2 py-1 text-sm bg-white text-black"
                        title="1=Very Simple, 2.5=Standard, 5=Very Complex"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeDeliverable(sd.deliverableId)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1">Add Deliverable</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addDeliverable(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
            >
              <option value="">Select a deliverable to add...</option>
              {deliverables
                .filter((d) => !selectedDeliverables.some((sd) => sd.deliverableId === d.id))
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.fixed_hours}h, ${d.fixed_price?.toLocaleString()})
                  </option>
                ))}
            </select>
          </div>

          {/* Calculated totals */}
          {selectedDeliverables.length > 0 && (
            <div className="rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
              <div className="text-xs font-medium mb-2 opacity-70">
                Calculated from deliverables:
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="opacity-70">Total Hours:</span>{" "}
                  <span className="font-semibold">{totalHours}h</span>
                </div>
                <div>
                  <span className="opacity-70">Total Price:</span>{" "}
                  <span className="font-semibold">${totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Pricing */}
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <p className="text-sm opacity-70">
            Leave blank to use calculated values from deliverables. Set custom values to override.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="flatFee">
                Flat Fee ($)
              </label>
              <input
                id="flatFee"
                type="number"
                step="0.01"
                value={flatFee}
                onChange={(e) => setFlatFee(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
                placeholder={`Auto: $${totalPrice.toLocaleString()}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="flatHours">
                Flat Hours
              </label>
              <input
                id="flatHours"
                type="number"
                step="0.5"
                value={flatHours}
                onChange={(e) => setFlatHours(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
                placeholder={`Auto: ${totalHours}h`}
              />
            </div>
          </div>
          
          <div className="rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-xs">
            <strong>💡 Pricing Strategy:</strong> Leave Flat Fee & Hours <strong>empty</strong> for <strong>dynamic pricing</strong> (recommended).
            Prices will calculate automatically from deliverables at base complexity (1.0x). Only set manual values for special cases.
          </div>

          {/* Final pricing preview */}
          <div className="rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
            <div className="text-xs font-medium mb-2 opacity-70">Final package pricing:</div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="opacity-70">Price:</span>{" "}
                <span className="font-bold text-lg">${finalPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="opacity-70">Hours:</span>{" "}
                <span className="font-bold text-lg">{finalHours}h</span>
              </div>
            </div>
          </div>
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

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Featured</span>
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

