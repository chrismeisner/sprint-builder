"use client";

import { useState, useEffect } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (version: string) => Promise<void>;
  currentVersion: string;
  isSaving: boolean;
};

function suggestNextVersion(current: string): string {
  // Parse the current version
  const parts = current.split(".");
  const major = parseInt(parts[0] || "0", 10);
  const minor = parseInt(parts[1] || "0", 10);
  
  // Suggest incrementing minor version
  return `${major}.${minor + 1}`;
}

export default function SaveVersionModal({
  isOpen,
  onClose,
  onSave,
  currentVersion,
  isSaving,
}: Props) {
  const [versionInput, setVersionInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const suggestedVersion = suggestNextVersion(currentVersion);

  useEffect(() => {
    if (isOpen) {
      setVersionInput(suggestedVersion);
      setError(null);
    }
  }, [isOpen, suggestedVersion]);

  const t = {
    title: getTypographyClassName("h3"),
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    mono: `${getTypographyClassName("mono-sm")} text-text-muted`,
    label: `${getTypographyClassName("mono-sm")} text-text-muted uppercase tracking-wide`,
    button: getTypographyClassName("button-sm"),
  };

  const validateVersion = (version: string): boolean => {
    // Must be in format X.Y where X and Y are numbers
    const pattern = /^\d+\.\d+$/;
    return pattern.test(version);
  };

  const handleSave = async () => {
    if (!validateVersion(versionInput)) {
      setError("Version must be in format X.Y (e.g., 1.0, 2.1)");
      return;
    }

    // Check if version is greater than current
    const [newMajor, newMinor] = versionInput.split(".").map(Number);
    const [curMajor, curMinor] = currentVersion.split(".").map(Number);
    
    if (newMajor < curMajor || (newMajor === curMajor && newMinor <= curMinor)) {
      setError(`Version must be greater than current (v${currentVersion})`);
      return;
    }

    setError(null);
    await onSave(versionInput);
  };

  const quickVersions = [
    { label: "Minor bump", version: `${parseInt(currentVersion.split(".")[0])}.${parseInt(currentVersion.split(".")[1] || "0") + 1}` },
    { label: "Major bump", version: `${parseInt(currentVersion.split(".")[0]) + 1}.0` },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-black/10 dark:border-white/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
          <h2 className={t.title}>Save Version</h2>
          <p className={t.bodySm}>
            Create a versioned snapshot of this deliverable.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Current Version */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5">
            <span className={t.mono}>Current version</span>
            <span className="font-mono font-bold">v{currentVersion}</span>
          </div>

          {/* Quick Version Options */}
          <div className="space-y-2">
            <p className={t.label}>Quick options</p>
            <div className="flex gap-2">
              {quickVersions.map((qv) => (
                <button
                  key={qv.version}
                  onClick={() => setVersionInput(qv.version)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-center transition ${
                    versionInput === qv.version
                      ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                      : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="font-mono font-bold">v{qv.version}</div>
                  <div className={`text-xs ${versionInput === qv.version ? "opacity-70" : "text-text-muted"}`}>
                    {qv.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Version Input */}
          <div className="space-y-2">
            <label className={t.label}>Custom version</label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono text-text-muted">v</span>
              <input
                type="text"
                value={versionInput}
                onChange={(e) => {
                  setVersionInput(e.target.value);
                  setError(null);
                }}
                placeholder="1.0"
                className="flex-1 rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black px-4 py-2 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
              />
            </div>
            <p className={t.bodySm}>
              Use semantic versioning: major.minor (e.g., 1.0, 1.1, 2.0)
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3 bg-black/[0.02] dark:bg-white/[0.02]">
          <button
            onClick={onClose}
            disabled={isSaving}
            className={`rounded-lg border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 ${t.button}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !versionInput}
            className={`rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 ${t.button}`}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save as v{versionInput}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

