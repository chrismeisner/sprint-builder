"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";

type Props = {
  sprintDeliverableId: string;
  sprintId: string;
  initialContent: string | null;
  initialNotes: string | null;
  canEdit: boolean;
  sprintStatus: string | null;
};

export default function SprintDeliverableContent({
  sprintDeliverableId,
  sprintId,
  initialContent,
  initialNotes,
  canEdit,
  sprintStatus,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const t = {
    sectionHeading: `${typography.headingCard}`,
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
  };

  const isComplete = sprintStatus === "complete";
  const canActuallyEdit = canEdit && !isComplete;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/deliverables/${sprintDeliverableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save content");
      }

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing && !content) {
    return (
      <section className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-6 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <h2 className={t.sectionHeading}>Sprint-Specific Content</h2>
        </div>
        <div className="text-center py-8 space-y-3">
          <p className={t.bodySm}>
            No sprint-specific content added yet.
          </p>
          {canActuallyEdit && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:opacity-90 transition ${getTypographyClassName("button-sm")}`}
            >
              Add content
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/15 p-6 space-y-4 bg-white/40 dark:bg-black/40">
      <div className="flex items-center justify-between">
        <h2 className={t.sectionHeading}>Sprint-Specific Content</h2>
        {!isEditing && canActuallyEdit && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
          >
            Edit
          </button>
        )}
        {saveSuccess && (
          <span className={`${getTypographyClassName("body-sm")} text-green-600 dark:text-green-400`}>
            ✓ Saved
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Add sprint-specific notes, deliverable details, client feedback, or any content unique to this sprint..."
            className={`w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-4 py-3 ${getTypographyClassName("body-sm")} focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y`}
          />
          
          {saveError && (
            <div className={`${getTypographyClassName("body-sm")} text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2`}>
              {saveError}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:opacity-90 disabled:opacity-50 transition ${getTypographyClassName("button-sm")}`}
            >
              {isSaving ? "Saving..." : "Save content"}
            </button>
            <button
              type="button"
              onClick={() => {
                setContent(initialContent ?? "");
                setIsEditing(false);
                setSaveError(null);
              }}
              disabled={isSaving}
              className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition ${getTypographyClassName("button-sm")}`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`whitespace-pre-wrap ${t.body}`}>
          {content}
        </div>
      )}
    </section>
  );
}

