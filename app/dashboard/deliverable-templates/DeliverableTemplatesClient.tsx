"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { getDeliverableComponent } from "@/app/components/deliverable-types";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  points: number | null;
  scope: string | null;
  format: string | null;
  slug: string | null;
  active: boolean;
  templateData: Record<string, unknown> | null;
  presentationContent: string | null;
  exampleImages: string[] | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  deliverables: Deliverable[];
  categories: string[];
};

export default function DeliverableTemplatesClient({ deliverables: initialDeliverables, categories }: Props) {
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTemplateData, setEditingTemplateData] = useState<Record<string, Record<string, unknown> | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const t = {
    pageTitle: getTypographyClassName("h2"),
    sectionTitle: getTypographyClassName("h3"),
    cardTitle: getTypographyClassName("h4"),
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    mono: `${getTypographyClassName("mono-sm")} text-text-muted`,
    button: getTypographyClassName("button-sm"),
  };

  const filteredDeliverables = selectedCategory
    ? deliverables.filter((d) => (d.category || "Uncategorized") === selectedCategory)
    : deliverables;

  const handleTemplateDataChange = useCallback((deliverableId: string, newData: Record<string, unknown>) => {
    setEditingTemplateData((prev) => ({
      ...prev,
      [deliverableId]: newData,
    }));
    setSaveSuccess(null);
    setSaveError(null);
  }, []);

  const handleSaveTemplate = async (deliverable: Deliverable) => {
    setSavingId(deliverable.id);
    setSaveError(null);
    setSaveSuccess(null);

    const templateData = editingTemplateData[deliverable.id] ?? deliverable.templateData;

    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}/template-data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateData }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save template");
      }

      // Update local state
      setDeliverables((prev) =>
        prev.map((d) =>
          d.id === deliverable.id ? { ...d, templateData, updatedAt: new Date().toISOString() } : d
        )
      );

      // Clear editing state for this deliverable
      setEditingTemplateData((prev) => {
        const next = { ...prev };
        delete next[deliverable.id];
        return next;
      });

      setSaveSuccess(deliverable.id);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  const hasChanges = (deliverable: Deliverable) => {
    const editedData = editingTemplateData[deliverable.id];
    if (editedData === undefined) return false;
    return JSON.stringify(editedData) !== JSON.stringify(deliverable.templateData);
  };

  const getComplexityLabel = (points: number | null) => {
    if (!points || points <= 3) return { label: "Light", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" };
    if (points <= 8) return { label: "Core", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" };
    return { label: "Intensive", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200" };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={t.pageTitle}>Deliverable Templates</h1>
          <p className={t.body}>
            Define master templates for each deliverable type. Changes here update the defaults for all new sprint instances.
          </p>
        </div>
        <Link
          href="/dashboard/deliverables"
          className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 ${t.button}`}
        >
          Manage Deliverables
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            selectedCategory === null
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
          }`}
        >
          All ({deliverables.length})
        </button>
        {categories.map((category) => {
          const count = deliverables.filter((d) => (d.category || "Uncategorized") === category).length;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedCategory === category
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>

      {/* Deliverables Grid */}
      <div className="space-y-4">
        {filteredDeliverables.map((deliverable) => {
          const isExpanded = expandedId === deliverable.id;
          const complexity = getComplexityLabel(deliverable.points);
          const TypeComponent = getDeliverableComponent(deliverable.slug || deliverable.name.toLowerCase().replace(/\s+/g, "-"));
          const currentTemplateData = editingTemplateData[deliverable.id] ?? deliverable.templateData;

          return (
            <div
              key={deliverable.id}
              className={`rounded-xl border transition ${
                isExpanded
                  ? "border-black/20 dark:border-white/20 bg-white dark:bg-black"
                  : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
              }`}
            >
              {/* Card Header - Always Visible */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between gap-4"
                onClick={() => setExpandedId(isExpanded ? null : deliverable.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`rounded-full px-3 py-1 text-xs font-medium ${complexity.color}`}>
                    {deliverable.points ?? "—"} pts
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={t.cardTitle}>{deliverable.name}</h3>
                      {!deliverable.active && (
                        <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">
                          Inactive
                        </span>
                      )}
                      {hasChanges(deliverable) && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className={`${t.bodySm} truncate`}>{deliverable.description || "No description"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={t.mono}>{deliverable.category || "Uncategorized"}</span>
                  <svg
                    className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-black/10 dark:border-white/10 p-6 space-y-6">
                  {/* Template Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className={t.mono}>Slug</p>
                      <p className={t.bodySm}>{deliverable.slug || "Not set"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className={t.mono}>Last Updated</p>
                      <p className={t.bodySm}>
                        {new Date(deliverable.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Type-Specific Template Editor */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className={t.sectionTitle}>Template Configuration</h4>
                      <p className={t.mono}>Changes propagate to new sprint instances</p>
                    </div>

                    <div className="rounded-lg border border-dashed border-black/20 dark:border-white/20 p-4 bg-black/[0.02] dark:bg-white/[0.02]">
                      <TypeComponent
                        data={currentTemplateData}
                        isEditable={true}
                        onChange={(newData) => handleTemplateDataChange(deliverable.id, newData)}
                        mode="template"
                        deliverableName={deliverable.name}
                      />
                    </div>
                  </div>

                  {/* Save Controls */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSaveTemplate(deliverable)}
                        disabled={savingId === deliverable.id || !hasChanges(deliverable)}
                        className={`inline-flex items-center gap-2 rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50 transition ${t.button}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        {savingId === deliverable.id ? "Saving..." : "Save Template"}
                      </button>

                      {hasChanges(deliverable) && (
                        <button
                          onClick={() => {
                            setEditingTemplateData((prev) => {
                              const next = { ...prev };
                              delete next[deliverable.id];
                              return next;
                            });
                          }}
                          className={`rounded-md border border-black/10 dark:border-white/15 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 ${t.button}`}
                        >
                          Discard Changes
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {saveSuccess === deliverable.id && (
                        <span className={`${t.mono} text-green-600 dark:text-green-400 flex items-center gap-1`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Template saved
                        </span>
                      )}

                      {saveError && savingId === null && (
                        <span className={`${t.mono} text-red-600 dark:text-red-400`}>
                          {saveError}
                        </span>
                      )}

                      <Link
                        href={`/deliverables/${deliverable.slug || deliverable.id}`}
                        className={`${t.mono} hover:text-text-primary transition`}
                      >
                        View public page →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDeliverables.length === 0 && (
        <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-12 text-center">
          <p className={t.body}>No deliverables found.</p>
          <Link
            href="/dashboard/deliverables"
            className={`inline-flex items-center gap-2 mt-4 rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 ${t.button}`}
          >
            Create Deliverables
          </Link>
        </div>
      )}
    </div>
  );
}

