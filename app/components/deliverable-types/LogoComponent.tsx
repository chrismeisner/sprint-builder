"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import type { DeliverableComponentProps } from "./index";

type LogoVariation = {
  name: string;
  imageUrl?: string;
  description?: string;
  usage?: string;
};

type LogoData = {
  variations?: LogoVariation[];
  primaryLogo?: string;
  clearSpace?: string;
  minSize?: string;
  colorVersions?: string[];
  doNots?: string[];
  notes?: string;
};

/**
 * Logo Component
 * Displays logo variations, usage guidelines, and clear space rules.
 */
export default function LogoComponent({
  data,
  isEditable,
  onChange,
  mode,
}: DeliverableComponentProps) {
  const logoData = (data as LogoData) || {};
  const variations = logoData.variations || [];
  
  const [isAddingVariation, setIsAddingVariation] = useState(false);
  const [newVariation, setNewVariation] = useState<LogoVariation>({ name: "", description: "", usage: "" });

  const t = {
    heading: getTypographyClassName("h4"),
    subheading: `${getTypographyClassName("subtitle-sm")} text-text-primary`,
    body: `${getTypographyClassName("body-sm")} text-text-secondary`,
    mono: `${getTypographyClassName("mono-sm")}`,
    label: `${getTypographyClassName("mono-sm")} text-text-muted`,
  };

  const hasData = variations.length > 0 || logoData.primaryLogo || logoData.doNots;

  const handleAddVariation = () => {
    if (!newVariation.name.trim()) return;
    
    const updatedVariations = [...variations, { ...newVariation }];
    onChange?.({ ...logoData, variations: updatedVariations });
    setNewVariation({ name: "", description: "", usage: "" });
    setIsAddingVariation(false);
  };

  const handleRemoveVariation = (index: number) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    onChange?.({ ...logoData, variations: updatedVariations });
  };

  if (!hasData && !isEditable) {
    return (
      <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-8 text-center space-y-3">
        <div className="text-4xl">✨</div>
        <p className={t.body}>No logo assets defined yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Primary Logo */}
      {logoData.primaryLogo && (
        <div className="space-y-3">
          <h4 className={t.heading}>Primary Logo</h4>
          <div className="rounded-xl border border-black/10 dark:border-white/10 p-8 bg-white dark:bg-black flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoData.primaryLogo}
              alt="Primary logo"
              className="max-h-32 w-auto"
            />
          </div>
        </div>
      )}

      {/* Logo Variations */}
      {variations.length > 0 && (
        <div className="space-y-4">
          <h4 className={t.heading}>Logo Variations</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {variations.map((variation, index) => (
              <div
                key={`variation-${index}`}
                className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-black"
              >
                {variation.imageUrl ? (
                  <div className="h-40 bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={variation.imageUrl}
                      alt={variation.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-black/5 dark:bg-white/5 flex items-center justify-center">
                    <span className="text-4xl opacity-30">🖼</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h5 className={t.subheading}>{variation.name}</h5>
                    {isEditable && mode === "sprint" && (
                      <button
                        onClick={() => handleRemoveVariation(index)}
                        className="text-xs text-text-secondary hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {variation.description && (
                    <p className={t.body}>{variation.description}</p>
                  )}
                  {variation.usage && (
                    <p className={`${t.mono} text-xs`}>Use for: {variation.usage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Guidelines */}
      <div className="grid gap-4 sm:grid-cols-2">
        {logoData.clearSpace && (
          <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-2">
            <h5 className={t.subheading}>Clear Space</h5>
            <p className={t.body}>{logoData.clearSpace}</p>
          </div>
        )}
        {logoData.minSize && (
          <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-2">
            <h5 className={t.subheading}>Minimum Size</h5>
            <p className={t.body}>{logoData.minSize}</p>
          </div>
        )}
      </div>

      {/* Color Versions */}
      {logoData.colorVersions && logoData.colorVersions.length > 0 && (
        <div className="space-y-3">
          <h4 className={t.heading}>Available Color Versions</h4>
          <div className="flex flex-wrap gap-2">
            {logoData.colorVersions.map((version, index) => (
              <span
                key={index}
                className="rounded-full bg-black/5 dark:bg-white/5 px-4 py-2 text-sm font-medium"
              >
                {version}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Do Nots */}
      {logoData.doNots && logoData.doNots.length > 0 && (
        <div className="space-y-3">
          <h4 className={t.heading}>Logo Don'ts</h4>
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4">
            <ul className="space-y-2">
              {logoData.doNots.map((doNot, index) => (
                <li key={index} className={`flex items-start gap-2 ${t.body}`}>
                  <span className="text-red-600 dark:text-red-400">✕</span>
                  <span>{doNot}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Add Variation (Sprint mode) */}
      {isEditable && mode === "sprint" && (
        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          {isAddingVariation ? (
            <div className="space-y-3 p-4 rounded-lg bg-black/5 dark:bg-white/5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={t.label}>Variation Name</label>
                  <input
                    type="text"
                    value={newVariation.name}
                    onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                    placeholder="Horizontal Lockup"
                    className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className={t.label}>Usage</label>
                  <input
                    type="text"
                    value={newVariation.usage || ""}
                    onChange={(e) => setNewVariation({ ...newVariation, usage: e.target.value })}
                    placeholder="Website header, email signatures"
                    className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={t.label}>Description (optional)</label>
                <textarea
                  value={newVariation.description || ""}
                  onChange={(e) => setNewVariation({ ...newVariation, description: e.target.value })}
                  placeholder="Describe when and how to use this variation"
                  rows={2}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAddVariation}
                  className="rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90"
                >
                  Add Variation
                </button>
                <button
                  onClick={() => {
                    setIsAddingVariation(false);
                    setNewVariation({ name: "", description: "", usage: "" });
                  }}
                  className="rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingVariation(true)}
              className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span>+</span>
              <span>Add Variation</span>
            </button>
          )}
        </div>
      )}

      {/* Notes */}
      {logoData.notes && (
        <div className="rounded-lg bg-black/5 dark:bg-white/5 p-4">
          <p className={t.body}>{logoData.notes}</p>
        </div>
      )}
    </div>
  );
}

