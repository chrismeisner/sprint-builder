"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Deliverable = {
  id: string;
  name: string;
  category: string | null;
  deliverableType?: string | null;
  fixedHours: number | null;
  fixedPrice: number | null;
  points: number | null;
};

type SprintDeliverable = {
  deliverableId: string;
  name: string;
  category: string | null;
  deliverableType: string | null;
  complexityScore: number;
  customHours: number | null;
  customPrice: number | null;
  customPoints: number | null;
  customScope: string | null;
  baseHours: number | null;
  basePrice: number | null;
  basePoints: number | null;
};

type Props = {
  sprintId: string;
  currentDeliverables: SprintDeliverable[];
  totalHours: number;
  totalPrice: number;
  totalPoints: number;
};

function getComplexityLabel(score: number): string {
  if (score <= 0.75) return "Simple";
  if (score <= 1) return "Normal";
  if (score <= 1.5) return "Complex";
  return "Very Complex";
}

export default function DeliverablesEditor({
  sprintId,
  currentDeliverables,
}: Props) {
  const router = useRouter();
  const [availableDeliverables, setAvailableDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const [complexityScore, setComplexityScore] = useState(1.0);
  const [editingComplexity, setEditingComplexity] = useState<string | null>(null);
  const [editingScope, setEditingScope] = useState<string | null>(null);
  const [scopeText, setScopeText] = useState<string>("");

  useEffect(() => {
    fetchAvailableDeliverables();
  }, []);

  const fetchAvailableDeliverables = async () => {
    try {
      const response = await fetch("/api/deliverables");
      const data = await response.json();
      if (data.deliverables) {
        setAvailableDeliverables(data.deliverables);
      }
    } catch (err) {
      console.error("Failed to fetch deliverables:", err);
    }
  };

  const handleAddDeliverable = async () => {
    if (!selectedDeliverableId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sprint-drafts/${sprintId}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deliverableId: selectedDeliverableId,
          complexityScore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add deliverable");
      }

      // Update global totals with absolute values from server
      interface WindowWithTotals extends Window {
        __updateSprintTotals?: (totals: { hours: number; price: number; points: number }) => void;
      }
      if ((window as WindowWithTotals).__updateSprintTotals && data.updatedTotals) {
        (window as WindowWithTotals).__updateSprintTotals({
          hours: data.updatedTotals.totalHours,
          price: data.updatedTotals.totalPrice,
          points: data.updatedTotals.totalPoints,
        });
      }

      setShowAddModal(false);
      setSelectedDeliverableId(null);
      setComplexityScore(1.0);
      router.refresh(); // Refresh server component
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add deliverable");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDeliverable = async (deliverableId: string) => {
    if (!confirm("Are you sure you want to remove this deliverable?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sprint-drafts/${sprintId}/deliverables?deliverableId=${deliverableId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove deliverable");
      }

      // Update global totals with absolute values from server
      interface WindowWithTotals extends Window {
        __updateSprintTotals?: (totals: { hours: number; price: number; points: number }) => void;
      }
      if ((window as WindowWithTotals).__updateSprintTotals && data.updatedTotals) {
        (window as WindowWithTotals).__updateSprintTotals({
          hours: data.updatedTotals.totalHours,
          price: data.updatedTotals.totalPrice,
          points: data.updatedTotals.totalPoints,
        });
      }

      router.refresh(); // Refresh server component
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove deliverable");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplexity = async (deliverableId: string, newComplexity: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sprint-drafts/${sprintId}/deliverables/complexity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deliverableId,
          complexityScore: newComplexity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update complexity");
      }

      // Update global totals
      interface WindowWithTotals extends Window {
        __updateSprintTotals?: (totals: { hours: number; price: number; points: number }) => void;
      }
      if ((window as WindowWithTotals).__updateSprintTotals && data.updatedTotals) {
        (window as WindowWithTotals).__updateSprintTotals({
          hours: data.updatedTotals.totalHours,
          price: data.updatedTotals.totalPrice,
          points: data.updatedTotals.totalPoints,
        });
      }

      setEditingComplexity(null);
      router.refresh(); // Refresh server component
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update complexity");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScope = async (deliverableId: string, newScope: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sprint-drafts/${sprintId}/deliverables/scope`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deliverableId,
          customScope: newScope,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update scope");
      }

      setEditingScope(null);
      setScopeText("");
      router.refresh(); // Refresh server component
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update scope");
    } finally {
      setLoading(false);
    }
  };

  const currentDeliverableIds = new Set(currentDeliverables.map((d) => d.deliverableId));
  const availableToAdd = availableDeliverables.filter((d) => !currentDeliverableIds.has(d.id));

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Deliverables List */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Deliverables</h2>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Deliverable
          </button>
        </div>

        <ul className="space-y-3 text-sm">
          {currentDeliverables.map((d, i) => {
            const isWorkshop = d.deliverableType === "workshop";
            const isEditingThis = editingComplexity === d.deliverableId;
            const complexity = typeof d.complexityScore === 'number' ? d.complexityScore : 1.0;

            return (
              <li
                key={d.deliverableId || i}
                className={`border rounded-md p-3 ${
                  isWorkshop
                    ? "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30"
                    : "border-black/10 dark:border-white/15"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isWorkshop && (
                        <span className="inline-flex items-center rounded-full bg-purple-600 text-white px-2 py-0.5 text-[10px] font-semibold">
                          📋 WORKSHOP
                        </span>
                      )}
                      <div className="font-medium">{d.name}</div>
                    </div>

                    {/* Complexity Score Display/Edit */}
                    <div className="mt-3 space-y-2">
                      {isEditingThis ? (
                        <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 p-3">
                          <label className="block text-xs font-medium mb-2">
                            Complexity Score
                          </label>
                          <select
                            value={complexity}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value);
                              handleUpdateComplexity(d.deliverableId, newValue);
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="0.75">0.75x - Simple</option>
                            <option value="1">1x - Normal</option>
                            <option value="1.5">1.5x - Complex</option>
                            <option value="2">2x - Very Complex</option>
                          </select>
                          <button
                            onClick={() => setEditingComplexity(null)}
                            disabled={loading}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-2 rounded-md bg-black/5 dark:bg-white/5 px-2 py-1">
                            <span className="text-[10px] uppercase opacity-60">Complexity:</span>
                            <span className="font-semibold">{complexity.toFixed(2)}x - {getComplexityLabel(complexity)}</span>
                          </div>
                          <button
                            onClick={() => setEditingComplexity(d.deliverableId)}
                            disabled={loading}
                            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
                            title="Edit complexity"
                          >
                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Display adjusted values */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="opacity-60">Base</span>
                          <div className="flex gap-2 font-mono">
                            {d.baseHours && <span>{d.baseHours}h</span>}
                            {d.basePrice && <span>${d.basePrice.toLocaleString()}</span>}
                            {d.basePoints && <span>{d.basePoints} pts</span>}
                          </div>
                        </div>
                        <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="opacity-60">Adjusted ({complexity.toFixed(2)}x - {getComplexityLabel(complexity)})</span>
                          <div className="flex gap-2 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {d.customHours != null && <span>{d.customHours.toFixed(1)}h</span>}
                            {d.customPrice != null && <span>${d.customPrice.toLocaleString()}</span>}
                            {d.customPoints != null && <span>{d.customPoints} pts</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deliverable Output/Scope */}
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold uppercase opacity-70">What You&apos;ll Get</h4>
                        {editingScope !== d.deliverableId && (
                          <button
                            onClick={() => {
                              setEditingScope(d.deliverableId);
                              setScopeText(d.customScope || "");
                            }}
                            disabled={loading}
                            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
                            title="Edit scope"
                          >
                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {editingScope === d.deliverableId ? (
                        <div className="space-y-2">
                          <textarea
                            value={scopeText}
                            onChange={(e) => setScopeText(e.target.value)}
                            disabled={loading}
                            rows={6}
                            placeholder="Describe what will be delivered for this sprint..."
                            className="w-full px-3 py-2 text-sm rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateScope(d.deliverableId, scopeText)}
                              disabled={loading}
                              className="px-3 py-1.5 text-xs rounded-md bg-black text-white dark:bg-white dark:text-black font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              {loading ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingScope(null);
                                setScopeText("");
                              }}
                              disabled={loading}
                              className="px-3 py-1.5 text-xs rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed">
                          {d.customScope || (
                            <span className="opacity-50 italic">No scope defined yet. Click edit to add details about what will be delivered.</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveDeliverable(d.deliverableId)}
                    disabled={loading}
                    className="flex-shrink-0 p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition"
                    title="Remove deliverable"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}

          {currentDeliverables.length === 0 && (
            <li className="text-center py-8 opacity-50 text-sm">
              No deliverables yet. Click &quot;Add Deliverable&quot; to get started.
            </li>
          )}
        </ul>
      </div>

      {/* Add Deliverable Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-black/10 dark:border-white/15 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedDeliverableId ? "Set Complexity" : "Add Deliverable"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedDeliverableId(null);
                  setComplexityScore(1.0);
                }}
                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {!selectedDeliverableId ? (
                /* Step 1: Select Deliverable */
                <div className="space-y-2">
                  {availableToAdd.length === 0 ? (
                    <p className="text-center py-8 opacity-50 text-sm">
                      All available deliverables have been added.
                    </p>
                  ) : (
                    availableToAdd.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDeliverableId(d.id)}
                        disabled={loading}
                        className="w-full text-left rounded-lg border border-black/10 dark:border-white/15 p-4 hover:border-black/20 dark:hover:border-white/25 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium mb-1">{d.name}</div>
                            {d.category && (
                              <div className="text-xs opacity-60 mb-2">{d.category}</div>
                            )}
                            <div className="flex items-center gap-3 text-xs opacity-70">
                              <span className="text-[10px] uppercase tracking-wide opacity-50">Base:</span>
                              {d.fixedHours && <span>{d.fixedHours}h</span>}
                              {d.fixedPrice && <span>${d.fixedPrice.toLocaleString()}</span>}
                              {d.points && <span>{d.points} pts</span>}
                            </div>
                          </div>
                          <svg className="w-5 h-5 flex-shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Step 2: Set Complexity */
                (() => {
                  const selected = availableToAdd.find((d) => d.id === selectedDeliverableId);
                  if (!selected) return null;

                  const adjustedHours = selected.fixedHours ? selected.fixedHours * complexityScore : 0;
                  const adjustedPrice = selected.fixedPrice ? selected.fixedPrice * complexityScore : 0;
                  const adjustedPoints = selected.points ? Math.round(selected.points * complexityScore) : 0;

                  return (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-black/5 dark:bg-white/5">
                        <div className="font-medium mb-1">{selected.name}</div>
                        {selected.category && (
                          <div className="text-xs opacity-60">{selected.category}</div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Complexity Score
                          </label>
                          <select
                            value={complexityScore}
                            onChange={(e) => setComplexityScore(parseFloat(e.target.value))}
                            className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="0.75">0.75x - Simple</option>
                            <option value="1">1x - Normal</option>
                            <option value="1.5">1.5x - Complex</option>
                            <option value="2">2x - Very Complex</option>
                          </select>
                        </div>

                        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="opacity-70">Base Hours:</span>
                            <span className="font-medium">{selected.fixedHours || 0}h</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="opacity-70">Base Price:</span>
                            <span className="font-medium">${(selected.fixedPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="opacity-70">Base Points:</span>
                            <span className="font-medium">{selected.points || 0}</span>
                          </div>

                          <div className="border-t border-blue-300 dark:border-blue-700 pt-3 space-y-2">
                            <div className="flex items-center justify-between font-semibold">
                              <span>Adjusted Hours:</span>
                              <span className="text-lg text-blue-600 dark:text-blue-400">{adjustedHours.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                              <span>Adjusted Price:</span>
                              <span className="text-lg text-blue-600 dark:text-blue-400">${adjustedPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                              <span>Adjusted Points:</span>
                              <span className="text-lg text-blue-600 dark:text-blue-400">{adjustedPoints}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedDeliverableId(null);
                            setComplexityScore(1.0);
                          }}
                          disabled={loading}
                          className="flex-1 px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition disabled:opacity-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleAddDeliverable}
                          disabled={loading}
                          className="flex-1 px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          {loading ? "Adding..." : "Add to Sprint"}
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
