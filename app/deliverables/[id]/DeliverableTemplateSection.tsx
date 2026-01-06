"use client";

import { useState, useCallback } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { getDeliverableComponent } from "@/app/components/deliverable-types";

type Props = {
  deliverableId: string;
  deliverableName: string;
  deliverableSlug: string | null;
  initialTemplateData: Record<string, unknown> | null;
  canEdit: boolean;
};

export default function DeliverableTemplateSection({
  deliverableId,
  deliverableName,
  deliverableSlug,
  initialTemplateData,
  canEdit,
}: Props) {
  const [templateData, setTemplateData] = useState<Record<string, unknown> | null>(initialTemplateData);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const t = {
    sectionHeading: `${getTypographyClassName("h3")} text-text-primary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    monoSm: `${getTypographyClassName("mono-sm")} text-text-muted`,
  };

  // Get the appropriate component based on deliverable slug/name
  const TypeComponent = getDeliverableComponent(deliverableSlug || deliverableName?.toLowerCase().replace(/\s+/g, "-"));

  const handleChange = useCallback((newData: Record<string, unknown>) => {
    setTemplateData(newData);
    setSaveSuccess(null);
    setSaveError(null);
  }, []);

  const handleSave = async () => {
    if (!canEdit) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/template-data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateData }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      setSaveSuccess("Template saved!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Check if data has been modified
  const hasChanges = JSON.stringify(templateData) !== JSON.stringify(initialTemplateData);

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/15 p-6 space-y-4 bg-white/40 dark:bg-black/40">
      <div className="flex items-center justify-between">
        <h2 className={t.sectionHeading}>
          {deliverableName} Template
        </h2>
        <span className={t.monoSm}>
          Global defaults
        </span>
      </div>

      <p className={t.bodySm}>
        Define the default structure and sample content for this deliverable type.
        Sprint-specific instances will inherit this template as their starting point.
      </p>

      {/* The type-specific component */}
      <TypeComponent
        data={templateData}
        isEditable={canEdit}
        onChange={handleChange}
        mode="template"
        deliverableName={deliverableName}
      />

      {/* Save button (only show if admin and has changes) */}
      {canEdit && hasChanges && (
        <div className="flex items-center gap-3 pt-4 border-t border-black/10 dark:border-white/10">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition ${getTypographyClassName("button-sm")}`}
          >
            {saving ? "Saving..." : "Save Template"}
          </button>

          {saveSuccess && (
            <span className={`${t.monoSm} text-green-600 dark:text-green-400`}>
              {saveSuccess}
            </span>
          )}

          {saveError && (
            <span className={`${t.monoSm} text-red-600 dark:text-red-400`}>
              {saveError}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

