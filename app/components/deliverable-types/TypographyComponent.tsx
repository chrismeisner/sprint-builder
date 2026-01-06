"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import type { DeliverableComponentProps } from "./index";

type FontEntry = {
  name: string;
  family: string;
  weights?: string[];
  usage?: string;
  sample?: string;
};

type TypeScale = {
  name: string;
  size: string;
  lineHeight?: string;
  weight?: string;
  usage?: string;
};

type TypographyData = {
  fonts?: FontEntry[];
  primaryFont?: string;
  secondaryFont?: string;
  typeScale?: TypeScale[];
  notes?: string;
};

/**
 * Typography Component
 * Displays font families, type scale, and usage guidelines.
 */
export default function TypographyComponent({
  data,
  isEditable,
  onChange,
  mode,
}: DeliverableComponentProps) {
  const typographyData = (data as TypographyData) || {};
  const fonts = typographyData.fonts || [];
  const typeScale = typographyData.typeScale || [];
  
  const [isAddingFont, setIsAddingFont] = useState(false);
  const [newFont, setNewFont] = useState<FontEntry>({ name: "", family: "", weights: [], usage: "" });

  const t = {
    heading: getTypographyClassName("h4"),
    subheading: `${getTypographyClassName("subtitle-sm")} text-text-primary`,
    body: `${getTypographyClassName("body-sm")} text-text-secondary`,
    mono: `${getTypographyClassName("mono-sm")}`,
    label: `${getTypographyClassName("mono-sm")} text-text-muted`,
  };

  const sampleText = "The quick brown fox jumps over the lazy dog";
  const hasData = fonts.length > 0 || typeScale.length > 0 || typographyData.primaryFont;

  const handleAddFont = () => {
    if (!newFont.name.trim() || !newFont.family.trim()) return;
    
    const updatedFonts = [...fonts, { ...newFont }];
    onChange?.({ ...typographyData, fonts: updatedFonts });
    setNewFont({ name: "", family: "", weights: [], usage: "" });
    setIsAddingFont(false);
  };

  const handleRemoveFont = (index: number) => {
    const updatedFonts = fonts.filter((_, i) => i !== index);
    onChange?.({ ...typographyData, fonts: updatedFonts });
  };

  if (!hasData && !isEditable) {
    return (
      <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-8 text-center space-y-3">
        <div className="text-4xl">🔤</div>
        <p className={t.body}>No typography defined yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Font Families */}
      {fonts.length > 0 && (
        <div className="space-y-4">
          <h4 className={t.heading}>Font Families</h4>
          <div className="grid gap-4">
            {fonts.map((font, index) => (
              <div
                key={`font-${index}`}
                className="rounded-xl border border-black/10 dark:border-white/10 p-5 bg-white dark:bg-black space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className={t.subheading}>{font.name}</h5>
                    <p className={`${t.mono} opacity-70`}>{font.family}</p>
                  </div>
                  {isEditable && mode === "sprint" && (
                    <button
                      onClick={() => handleRemoveFont(index)}
                      className="text-sm text-text-secondary hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                {/* Font Sample */}
                <div
                  className="text-2xl py-4 border-y border-black/10 dark:border-white/10"
                  style={{ fontFamily: font.family }}
                >
                  {font.sample || sampleText}
                </div>
                
                {/* Weights */}
                {font.weights && font.weights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {font.weights.map((weight) => (
                      <span
                        key={weight}
                        className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1 text-xs font-medium"
                      >
                        {weight}
                      </span>
                    ))}
                  </div>
                )}
                
                {font.usage && (
                  <p className={t.body}>{font.usage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Scale */}
      {typeScale.length > 0 && (
        <div className="space-y-4">
          <h4 className={t.heading}>Type Scale</h4>
          <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
            <div className="divide-y divide-black/10 dark:divide-white/10">
              {typeScale.map((scale, index) => (
                <div
                  key={`scale-${index}`}
                  className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-black"
                >
                  <div className="flex-1">
                    <div
                      style={{
                        fontSize: scale.size,
                        lineHeight: scale.lineHeight || "1.2",
                        fontWeight: scale.weight || "normal",
                      }}
                    >
                      {scale.name}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className={t.mono}>{scale.size}</p>
                    {scale.usage && (
                      <p className={`${t.body} text-xs`}>{scale.usage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legacy format support */}
      {typographyData.primaryFont && !fonts.some(f => f.family === typographyData.primaryFont) && (
        <div className="space-y-3">
          <h4 className={t.heading}>Primary Font</h4>
          <div
            className="text-3xl p-4 rounded-lg bg-black/5 dark:bg-white/5"
            style={{ fontFamily: typographyData.primaryFont }}
          >
            {sampleText}
          </div>
          <p className={t.mono}>{typographyData.primaryFont}</p>
        </div>
      )}

      {/* Add Font (Sprint mode) */}
      {isEditable && mode === "sprint" && (
        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          {isAddingFont ? (
            <div className="space-y-3 p-4 rounded-lg bg-black/5 dark:bg-white/5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={t.label}>Font Name</label>
                  <input
                    type="text"
                    value={newFont.name}
                    onChange={(e) => setNewFont({ ...newFont, name: e.target.value })}
                    placeholder="Primary Heading Font"
                    className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className={t.label}>Font Family</label>
                  <input
                    type="text"
                    value={newFont.family}
                    onChange={(e) => setNewFont({ ...newFont, family: e.target.value })}
                    placeholder="Inter, system-ui, sans-serif"
                    className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={t.label}>Usage (optional)</label>
                <input
                  type="text"
                  value={newFont.usage || ""}
                  onChange={(e) => setNewFont({ ...newFont, usage: e.target.value })}
                  placeholder="Headlines, subheadings"
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAddFont}
                  className="rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90"
                >
                  Add Font
                </button>
                <button
                  onClick={() => {
                    setIsAddingFont(false);
                    setNewFont({ name: "", family: "", weights: [], usage: "" });
                  }}
                  className="rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingFont(true)}
              className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span>+</span>
              <span>Add Font</span>
            </button>
          )}
        </div>
      )}

      {/* Notes */}
      {typographyData.notes && (
        <div className="rounded-lg bg-black/5 dark:bg-white/5 p-4">
          <p className={t.body}>{typographyData.notes}</p>
        </div>
      )}
    </div>
  );
}

