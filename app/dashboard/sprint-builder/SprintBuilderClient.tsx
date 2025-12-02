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

type Package = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  flat_fee: number | null;
  flat_hours: number | null;
  deliverables: Array<{
    deliverableId: string;
    quantity: number;
  }>;
};

type SelectedDeliverable = {
  deliverableId: string;
  quantity: number;
};

type Props = {
  deliverables: Deliverable[];
  packages: Package[];
};

export default function SprintBuilderClient({ deliverables, packages }: Props) {
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedDeliverables, setSelectedDeliverables] = useState<SelectedDeliverable[]>([]);
  const [approach, setApproach] = useState("");
  const [week1Overview, setWeek1Overview] = useState("");
  const [week2Overview, setWeek2Overview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load package deliverables when package selected
  useEffect(() => {
    if (selectedPackageId) {
      const pkg = packages.find((p) => p.id === selectedPackageId);
      if (pkg) {
        setSelectedDeliverables(pkg.deliverables);
        if (!title) {
          setTitle(pkg.name);
        }
      }
    }
  }, [selectedPackageId, packages, title]);

  function addDeliverable(deliverableId: string) {
    if (selectedDeliverables.some((d) => d.deliverableId === deliverableId)) {
      return; // Already added
    }
    setSelectedDeliverables([
      ...selectedDeliverables,
      { deliverableId, quantity: 1 },
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

  function calculateTotals() {
    let totalPoints = 0;
    let totalHours = 0;
    let totalPrice = 0;

    selectedDeliverables.forEach((sd) => {
      const d = deliverables.find((del) => del.id === sd.deliverableId);
      if (d) {
        totalPoints += (d.default_estimate_points ?? 0) * sd.quantity;
        totalHours += (d.fixed_hours ?? 0) * sd.quantity;
        totalPrice += (d.fixed_price ?? 0) * sd.quantity;
      }
    });

    return { totalPoints, totalHours, totalPrice };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (selectedDeliverables.length === 0) {
      setError("Please select at least one deliverable");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build custom content for draft
      const customContent: Record<string, unknown> = {
        source: "manual",
        sprintTitle: title,
      };
      
      if (approach.trim()) {
        customContent.approach = approach.trim();
      }
      
      if (week1Overview.trim()) {
        customContent.week1 = { overview: week1Overview.trim() };
      }
      
      if (week2Overview.trim()) {
        customContent.week2 = { overview: week2Overview.trim() };
      }
      
      const body = {
        title,
        sprintPackageId: selectedPackageId || null,
        deliverables: selectedDeliverables,
        customContent,
        status: "draft",
      };

      const res = await fetch("/api/sprint-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create sprint");
      }

      // Redirect to sprint detail page
      router.push(`/sprints/${data.sprintDraftId}`);
    } catch (e) {
      setError((e as Error).message || "Failed to create sprint");
      setSubmitting(false);
    }
  }

  const { totalPoints, totalHours, totalPrice } = calculateTotals();

  // Group deliverables by category
  const deliverablesByCategory = deliverables.reduce((acc, d) => {
    const cat = d.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {} as Record<string, Deliverable[]>);

  return (
    <main className="container min-h-screen max-w-6xl space-y-6 py-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sprint Builder</h1>
          <p className="text-sm opacity-70 mt-1">Manually create a sprint with selected deliverables</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
            <h2 className="text-lg font-semibold">Sprint Details</h2>
            
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="title">
                Sprint Title *
              </label>
              <input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
                placeholder="e.g. Q1 2024 MVP Development"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="package">
                Start from Package (optional)
              </label>
              <select
                id="package"
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm bg-white text-black"
              >
                <option value="">Custom sprint (select deliverables below)</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.tagline ? `- ${p.tagline}` : ""}
                  </option>
                ))}
              </select>
              {selectedPackageId && (
                <p className="text-xs opacity-70 mt-1">
                  Package deliverables loaded. You can add/remove below.
                </p>
              )}
            </div>
          </section>

          {/* Custom Content */}
          <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
            <h2 className="text-lg font-semibold">Sprint Details (Optional)</h2>
            <p className="text-xs opacity-70">
              Add custom context and planning notes for this sprint
            </p>
            
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="approach">
                Sprint Approach
              </label>
              <textarea
                id="approach"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm min-h-[80px] bg-white text-black"
                placeholder="Explain the overall approach and methodology for this sprint..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="week1">
                Week 1 Overview
              </label>
              <textarea
                id="week1"
                value={week1Overview}
                onChange={(e) => setWeek1Overview(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm min-h-[80px] bg-white text-black"
                placeholder="Describe Week 1's focus, activities, and expected outcomes..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="week2">
                Week 2 Overview
              </label>
              <textarea
                id="week2"
                value={week2Overview}
                onChange={(e) => setWeek2Overview(e.target.value)}
                className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm min-h-[80px] bg-white text-black"
                placeholder="Describe Week 2's focus, completion activities, and final deliverables..."
              />
            </div>
          </section>

          {/* Selected Deliverables */}
          <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
            <h2 className="text-lg font-semibold">Selected Deliverables</h2>
            
            {selectedDeliverables.length === 0 ? (
              <p className="text-sm opacity-70">No deliverables selected yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedDeliverables.map((sd) => {
                  const d = deliverables.find((del) => del.id === sd.deliverableId);
                  if (!d) return null;
                  
                  return (
                    <div
                      key={sd.deliverableId}
                      className="rounded border border-black/10 dark:border-white/15 p-3 flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{d.name}</div>
                        <div className="text-xs opacity-70">
                          {d.fixed_hours}h • ${d.fixed_price?.toLocaleString()}
                          {d.category && ` • ${d.category}`}
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
          </section>

          {/* Available Deliverables */}
          <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
            <h2 className="text-lg font-semibold">Add Deliverables</h2>
            
            <div className="space-y-4">
              {Object.entries(deliverablesByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold mb-2 opacity-80">{category}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((d) => {
                      const isSelected = selectedDeliverables.some(
                        (sd) => sd.deliverableId === d.id
                      );
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => addDeliverable(d.id)}
                          disabled={isSelected}
                          className={
                            isSelected
                              ? "rounded border border-green-200 bg-green-50 dark:bg-green-950 p-2 text-left text-sm opacity-60 cursor-not-allowed"
                              : "rounded border border-black/10 dark:border-white/15 p-2 text-left text-sm hover:border-black/20 dark:hover:border-white/25 hover:bg-black/5 dark:hover:bg-white/5 transition"
                          }
                        >
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs opacity-70">
                            {d.fixed_hours}h • ${d.fixed_price?.toLocaleString()}
                          </div>
                          {isSelected && (
                            <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                              ✓ Added
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Live Calculation */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Totals */}
            <section className="rounded-lg border border-black/10 dark:border-white/15 bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-gray-950 p-4 space-y-4">
              <h2 className="text-lg font-semibold">Sprint Totals</h2>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs opacity-70 mb-1">Total Price</div>
                  <div className="text-3xl font-bold">
                    ${totalPrice.toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs opacity-70 mb-1">Hours</div>
                    <div className="text-xl font-bold">{totalHours}h</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70 mb-1">Points</div>
                    <div className="text-xl font-bold">{totalPoints}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-70 mb-1">Deliverables</div>
                  <div className="text-xl font-bold">
                    {selectedDeliverables.reduce((sum, d) => sum + d.quantity, 0)}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="space-y-2">
              <button
                type="submit"
                disabled={submitting || selectedDeliverables.length === 0}
                className="w-full inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-3 text-sm font-medium disabled:opacity-60 hover:bg-black/80 transition"
              >
                {submitting ? "Creating Sprint..." : "Create Sprint"}
              </button>
              
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Cancel
              </Link>
            </section>

            {selectedDeliverables.length === 0 && (
              <p className="text-xs opacity-70 text-center">
                Select deliverables to see calculated totals
              </p>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}

