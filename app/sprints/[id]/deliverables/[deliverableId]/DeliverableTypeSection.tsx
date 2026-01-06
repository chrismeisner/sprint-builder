"use client";

import { useState, useCallback, useEffect } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { getDeliverableComponent } from "@/app/components/deliverable-types";
import SaveVersionModal from "./SaveVersionModal";

type Version = {
  id: string;
  versionNumber: string;
  typeData: Record<string, unknown> | null;
  content: string | null;
  notes: string | null;
  savedBy: string;
  savedAt: string;
};

type Props = {
  sprintDeliverableId: string;
  sprintId: string;
  deliverableName: string;
  deliverableSlug: string | null;
  initialTypeData: Record<string, unknown> | null;
  initialVersion: string;
  canEdit: boolean;
  mode: "template" | "sprint";
};

export default function DeliverableTypeSection({
  sprintDeliverableId,
  sprintId,
  deliverableName,
  deliverableSlug,
  initialTypeData,
  initialVersion,
  canEdit,
  mode,
}: Props) {
  const [typeData, setTypeData] = useState<Record<string, unknown> | null>(initialTypeData);
  const [currentVersion, setCurrentVersion] = useState(initialVersion);
  const [saving, setSaving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const t = {
    sectionHeading: `${getTypographyClassName("h3")} text-text-primary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    monoSm: `${getTypographyClassName("mono-sm")} text-text-muted`,
    label: `${getTypographyClassName("mono-sm")} text-text-muted uppercase tracking-wide`,
  };

  // Get the appropriate component based on deliverable slug/name
  const TypeComponent = getDeliverableComponent(deliverableSlug || deliverableName?.toLowerCase().replace(/\s+/g, "-"));

  const handleChange = useCallback((newData: Record<string, unknown>) => {
    setTypeData(newData);
    setSaveSuccess(null);
    setSaveError(null);
  }, []);

  // Save changes without creating a version
  const handleSave = async () => {
    if (!canEdit) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/deliverables/${sprintDeliverableId}/type-data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeData }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      setSaveSuccess("Draft saved");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Save and create a new version with custom version number
  const handleSaveVersion = async (version: string) => {
    if (!canEdit) return;

    setSavingVersion(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // First save the current data
      const saveRes = await fetch(`/api/sprint-drafts/${sprintId}/deliverables/${sprintDeliverableId}/type-data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeData }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      // Then create a version with the custom version number
      const versionRes = await fetch(`/api/sprint-drafts/${sprintId}/deliverables/${sprintDeliverableId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      if (!versionRes.ok) {
        const errorData = await versionRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create version");
      }

      const versionData = await versionRes.json();
      setCurrentVersion(versionData.version.versionNumber);
      setSaveSuccess(`Saved as v${versionData.version.versionNumber}`);
      setShowSaveModal(false);
      
      // Refresh versions list if it's open
      if (showHistory) {
        fetchVersions();
      }
      
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save version");
    } finally {
      setSavingVersion(false);
    }
  };

  // Fetch version history
  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/deliverables/${sprintDeliverableId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Load versions when history is toggled open
  useEffect(() => {
    if (showHistory && versions.length === 0) {
      fetchVersions();
    }
  }, [showHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if data has been modified from initial
  const hasChanges = JSON.stringify(typeData) !== JSON.stringify(initialTypeData);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <>
      <section className="rounded-xl border border-black/10 dark:border-white/15 p-6 space-y-4 bg-white/40 dark:bg-black/40">
        {/* Header with version badge */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className={t.sectionHeading}>
              {deliverableName} Details
            </h2>
            {mode === "sprint" && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono ${
                currentVersion === "0.0"
                  ? "bg-black/5 dark:bg-white/5 text-text-muted"
                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              }`}>
                v{currentVersion}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode === "sprint" && currentVersion !== "0.0" && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`${t.monoSm} hover:text-text-primary transition`}
              >
                {showHistory ? "Hide history" : "View history"}
              </button>
            )}
            <span className={t.monoSm}>
              {mode === "sprint" ? "Sprint-specific" : "Template"}
            </span>
          </div>
        </div>

        {/* Version History Panel */}
        {showHistory && mode === "sprint" && (
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 space-y-3">
            <h3 className={t.label}>Version History</h3>
            
            {loadingVersions ? (
              <p className={t.bodySm}>Loading versions...</p>
            ) : versions.length === 0 ? (
              <p className={t.bodySm}>No saved versions yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`flex items-center justify-between gap-4 p-2 rounded-md ${
                      version.versionNumber === currentVersion
                        ? "bg-black/5 dark:bg-white/5"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 rounded-full bg-black/10 dark:bg-white/10 text-xs font-bold font-mono px-2">
                        v{version.versionNumber}
                      </span>
                      <div>
                        <p className={`${getTypographyClassName("body-sm")} text-text-primary`}>
                          {formatDate(version.savedAt)}
                        </p>
                        <p className={t.monoSm}>
                          {version.savedBy}
                        </p>
                      </div>
                    </div>
                    {version.versionNumber === currentVersion && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* The type-specific component */}
        <TypeComponent
          data={typeData}
          isEditable={canEdit}
          onChange={handleChange}
          mode={mode}
          deliverableName={deliverableName}
        />

        {/* Save controls */}
        {canEdit && mode === "sprint" && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              {/* Draft save */}
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving || savingVersion}
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition ${getTypographyClassName("button-sm")}`}
                >
                  {saving ? "Saving..." : "Save draft"}
                </button>
              )}
              
              {/* Save as Version - opens modal */}
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={saving || savingVersion}
                className={`inline-flex items-center gap-2 rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition ${getTypographyClassName("button-sm")}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Version
              </button>
            </div>

            {/* Feedback messages */}
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className={`${t.monoSm} text-green-600 dark:text-green-400 flex items-center gap-1`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {saveSuccess}
                </span>
              )}

              {saveError && (
                <span className={`${t.monoSm} text-red-600 dark:text-red-400`}>
                  {saveError}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Save Version Modal */}
      <SaveVersionModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveVersion}
        currentVersion={currentVersion}
        isSaving={savingVersion}
      />
    </>
  );
}
