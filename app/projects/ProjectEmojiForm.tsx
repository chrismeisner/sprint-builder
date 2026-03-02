"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

const PRESET_EMOJIS = [
  "🚀", "💡", "🎯", "🔥", "⚡", "🌟", "💎", "🏆",
  "🛠️", "📦", "🎨", "📊", "🌿", "🧪", "🔮", "🤝",
  "🏗️", "🎬", "📱", "🌐", "🔐", "📝", "🎵", "🦋",
];

type Props = {
  projectId: string;
  initialEmoji: string | null;
};

export default function ProjectEmojiForm({ projectId, initialEmoji }: Props) {
  const [emoji, setEmoji] = useState(initialEmoji ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodySm = getTypographyClassName("body-sm");

  const handleSave = async (value: string) => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, emoji: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update emoji");
      setEmoji(value);
      setMessage("Saved");
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update emoji");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (val: string) => {
    // Only keep the first grapheme cluster (single emoji)
    const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new (Intl as unknown as { Segmenter: new (locale: string, opts: object) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter("en", { granularity: "grapheme" })
      : null;
    if (segmenter) {
      const segments = Array.from(segmenter.segment(val));
      setEmoji(segments[0]?.segment ?? "");
    } else {
      setEmoji(val.slice(0, 2));
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className={`${bodySm} font-medium`}>Project emoji</label>
        <p className={`${bodySm} opacity-60`}>Shown as a cover image on project cards.</p>
      </div>

      {/* Preview + input */}
      <div className="flex items-center gap-3">
        <div className="size-16 rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 flex items-center justify-center text-4xl select-none flex-shrink-0">
          {emoji || <span className="text-xl opacity-20">?</span>}
        </div>
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            value={emoji}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Paste an emoji…"
            className="w-24 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-center text-xl"
            disabled={saving}
          />
          <button
            onClick={() => handleSave(emoji)}
            disabled={saving}
            className={`${getTypographyClassName("button-sm")} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {emoji && (
            <button
              onClick={() => handleSave("")}
              disabled={saving}
              className={`${bodySm} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/20 disabled:opacity-50 transition`}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Preset grid */}
      <div>
        <p className={`${bodySm} opacity-50 mb-2`}>Or pick one:</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => handleSave(e)}
              disabled={saving}
              className={`size-9 rounded-md border text-xl flex items-center justify-center transition hover:scale-110 ${
                emoji === e
                  ? "border-black dark:border-white bg-black/10 dark:bg-white/10"
                  : "border-black/10 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {message && <p className={`${bodySm} text-green-700 dark:text-green-300`}>{message}</p>}
      {error && <p className={`${bodySm} text-red-700 dark:text-red-300`}>{error}</p>}
    </div>
  );
}
