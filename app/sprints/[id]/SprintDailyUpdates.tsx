"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import { ATTITUDE_THEMES } from "@/lib/sprintProcess";

type UpdateLink = { url: string; label: string };
type UpdateAttachment = { url: string; fileName: string; mimetype: string; fileSizeBytes: number };

export type DailyUpdate = {
  id: string;
  sprintDay: number;
  totalDays: number;
  frame: string | null;
  body: string;
  links: UpdateLink[];
  attachments: UpdateAttachment[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
};

type Props = {
  sprintId: string;
  isAdmin: boolean;
  startDate: string | null;
  weeks: number;
  initialUpdates: DailyUpdate[];
};

// Detect known services from a URL and return an appropriate icon.
function getUrlIcon(url: string): React.ReactElement {
  const defaultIcon = (
    <svg
      className="size-4 text-blue-600 dark:text-blue-400"
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
  try {
    const { hostname } = new URL(url);
    const h = hostname.toLowerCase();

    if (h.includes("figma.com")) {
      return (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/960px-Figma-logo.svg.png"
          alt="Figma"
          className="size-4 object-contain"
        />
      );
    }
    if (h.includes("docs.google.com") || h.includes("drive.google.com")) {
      return (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
          alt="Google Docs"
          className="size-4 object-contain"
        />
      );
    }
    if (h.includes("github.com")) {
      return (
        <svg className="size-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      );
    }
    if (h.includes("notion.so") || h.includes("notion.site")) {
      return (
        <svg className="size-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
        </svg>
      );
    }
    if (h.includes("miro.com")) {
      return (
        <svg className="size-4 text-yellow-500" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.392 0H13.9L17 10.444 10.444 0H6.949l3.102 10.444L3.494 0H0l5.05 17.639L8.8 24l4.432-14.738L17.665 24l2.334-6.361L24 0z" />
        </svg>
      );
    }
    if (h.includes("linear.app")) {
      return (
        <svg className="size-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3.00488 7.43957C3.00488 6.6304 3.24386 5.83735 3.69329 5.15459C4.14273 4.47183 4.78457 3.92841 5.54242 3.58805C6.30026 3.24769 7.14185 3.12358 7.95677 3.23045C8.77169 3.33732 9.53673 3.67076 10.1553 4.18833L21.8682 15.9012C22.3858 16.5198 22.7192 17.2848 22.8261 18.0997C22.933 18.9147 22.8089 19.7562 22.4685 20.5141C22.1281 21.2719 21.5847 21.9138 20.9019 22.3632C20.2192 22.8126 19.4261 23.0516 18.6169 23.0516C17.8078 23.0516 17.0147 22.8126 16.3319 22.3632C15.6492 21.9138 15.1058 21.2719 14.7654 20.5141C14.425 19.7562 14.3009 18.9147 14.4078 18.0997C14.5146 17.2848 14.8481 16.5198 15.3657 15.9012L3.65279 4.18833C3.40388 3.93941 3.14051 3.71012 2.86523 3.50195L3.00488 7.43957Z" />
        </svg>
      );
    }
    return defaultIcon;
  } catch {
    return defaultIcon;
  }
}

export default function SprintDailyUpdates({
  sprintId,
  isAdmin,
  startDate,
  weeks,
  initialUpdates,
}: Props) {
  const [updates, setUpdates] = useState<DailyUpdate[]>(
    [...initialUpdates].sort(
      (a, b) => b.sprintDay - a.sprintDay || b.createdAt.localeCompare(a.createdAt)
    )
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Attachment state
  const [formAttachments, setFormAttachments] = useState<UpdateAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const totalDays = weeks * 5;

  const guessCurrentDay = useCallback((): number => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const now = new Date();
    let businessDays = 0;
    const current = new Date(start);
    while (current <= now) {
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) businessDays++;
      current.setDate(current.getDate() + 1);
    }
    return Math.max(1, Math.min(businessDays, totalDays));
  }, [startDate, totalDays]);

  const [formDay, setFormDay] = useState<number>(guessCurrentDay);
  const [formFrame, setFormFrame] = useState<string>("");
  const [formBody, setFormBody] = useState("");
  const [formLinks, setFormLinks] = useState<UpdateLink[]>([]);

  const resetForm = () => {
    setFormDay(guessCurrentDay());
    setFormFrame("");
    setFormBody("");
    setFormLinks([]);
    setFormAttachments([]);
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (update: DailyUpdate) => {
    setFormDay(update.sprintDay);
    setFormFrame(update.frame || "");
    setFormBody(update.body);
    setFormLinks(update.links.length > 0 ? [...update.links] : []);
    setFormAttachments(update.attachments ? [...update.attachments] : []);
    setEditingId(update.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formBody.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/sprint-drafts/${sprintId}/daily-updates`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updateId: editingId,
            sprintDay: formDay,
            frame: formFrame || null,
            body: formBody,
            links: formLinks.filter((l) => l.url.trim()),
            attachments: formAttachments,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === editingId
              ? {
                  ...u,
                  sprintDay: formDay,
                  totalDays,
                  frame: formFrame || null,
                  body: formBody.trim(),
                  links: formLinks.filter((l) => l.url.trim()),
                  attachments: formAttachments,
                  updatedAt: new Date().toISOString(),
                }
              : u
          )
        );
      } else {
        const res = await fetch(`/api/sprint-drafts/${sprintId}/daily-updates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprintDay: formDay,
            frame: formFrame || null,
            body: formBody,
            links: formLinks.filter((l) => l.url.trim()),
            attachments: formAttachments,
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
        const data = await res.json();
        setUpdates((prev) =>
          [...prev, data.update].sort(
            (a, b) => b.sprintDay - a.sprintDay || b.createdAt.localeCompare(a.createdAt)
          )
        );
      }
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!window.confirm("Delete this daily update? This cannot be undone.")) return;
    setDeletingId(updateId);
    try {
      const res = await fetch(
        `/api/sprint-drafts/${sprintId}/daily-updates?updateId=${updateId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const addLinkRow = () => setFormLinks((prev) => [...prev, { url: "", label: "" }]);
  const removeLinkRow = (idx: number) =>
    setFormLinks((prev) => prev.filter((_, i) => i !== idx));
  const updateLinkRow = (idx: number, field: "url" | "label", value: string) =>
    setFormLinks((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );

  const uploadAttachmentFile = useCallback(async (file: File) => {
    try {
      setUploadingAttachment(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/sprint-drafts/${sprintId}/daily-updates/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json() as UpdateAttachment;
      setFormAttachments((prev) => [...prev, data]);
    } catch (err) {
      console.error("Attachment upload error:", err);
      alert(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  }, [sprintId]);

  // Clipboard paste → upload screenshot (only when form is open)
  useEffect(() => {
    if (!isAdmin || !showForm) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const named = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
            uploadAttachmentFile(named);
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isAdmin, showForm, uploadAttachmentFile]);

  const t = {
    cardHeading: typography.headingCard,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
    monoLabel: `${getTypographyClassName("mono-sm")} text-text-muted`,
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const todayReadout = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={t.cardHeading}>Daily Updates</h2>
        {isAdmin && !showForm && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormDay(guessCurrentDay());
              setFormFrame("");
              setFormBody("");
              setFormLinks([]);
              setShowForm(true);
            }}
            className="h-8 px-3 text-sm rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 ease-out"
          >
            + Add Update
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isAdmin && (
        <div className="rounded-md border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800 space-y-4">
          {/* Form header: title + today's date */}
          <div className="flex items-center justify-between gap-4">
            <span className={`${getTypographyClassName("subtitle-sm")} text-text-primary`}>
              {editingId ? "Edit Update" : "New Daily Update"}
            </span>
            <span className={`${t.monoLabel} tabular-nums`}>
              {todayReadout}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sprint Day */}
            <div className="space-y-1">
              <label className={t.label} htmlFor="sprint-day">
                Sprint Day
              </label>
              <select
                id="sprint-day"
                value={formDay}
                onChange={(e) => setFormDay(Number(e.target.value))}
                className="h-10 w-full px-3 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d} of {totalDays}
                  </option>
                ))}
              </select>
            </div>

            {/* Frame — numbered to match /sprints */}
            <div className="space-y-1">
              <label className={t.label} htmlFor="sprint-frame">
                Frame
              </label>
              <select
                id="sprint-frame"
                value={formFrame}
                onChange={(e) => setFormFrame(e.target.value)}
                className="h-10 w-full px-3 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="">Select frame...</option>
                {ATTITUDE_THEMES.map((theme, i) => (
                  <option key={theme} value={theme}>
                    {i + 1} · {theme}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className={t.label} htmlFor="update-body">
              Update
            </label>
            <textarea
              id="update-body"
              rows={4}
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              placeholder="What happened today? Progress, blockers, decisions..."
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y"
            />
          </div>

          {/* Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={t.label}>Links</span>
              <button
                type="button"
                onClick={addLinkRow}
                className="h-8 px-3 text-sm rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 ease-out"
              >
                + Add Link
              </button>
            </div>
            {formLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {/* Live icon preview */}
                <span className="size-5 flex items-center justify-center shrink-0 text-neutral-400 dark:text-neutral-500">
                  {link.url.trim() ? getUrlIcon(link.url) : (
                    <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                </span>
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLinkRow(idx, "label", e.target.value)}
                  placeholder="Label"
                  className="h-10 flex-1 px-3 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLinkRow(idx, "url", e.target.value)}
                  placeholder="https://..."
                  className="h-10 flex-[2] px-3 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => removeLinkRow(idx)}
                  className="size-10 flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors duration-150 ease-out"
                  aria-label="Remove link"
                >
                  <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={t.label}>Attachments</span>
              <label
                className={`h-8 px-3 text-sm rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 ease-out cursor-pointer inline-flex items-center gap-1.5 ${uploadingAttachment ? "opacity-50 pointer-events-none" : ""}`}
              >
                {uploadingAttachment ? (
                  <>
                    <svg className="animate-spin size-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Add Screenshot
                  </>
                )}
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAttachmentFile(file);
                  }}
                />
              </label>
            </div>
            {formAttachments.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {formAttachments.map((att, idx) => (
                  <div key={idx} className="group relative aspect-video rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={att.url} alt={att.fileName} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 size-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition"
                      aria-label="Remove attachment"
                    >
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formAttachments.length === 0 && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Upload screenshots or paste from clipboard (⌘V / Ctrl+V).
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !formBody.trim()}
              className="h-10 px-4 text-sm rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-opacity duration-150 ease-out"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Post Update"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="h-10 px-4 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 ease-out"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {updates.length === 0 && !showForm && (
        <p className={`${t.bodySm} py-4 text-center`}>
          No daily updates yet.
          {isAdmin && " Click \"+ Add Update\" to log the first one."}
        </p>
      )}

      {/* Updates feed */}
      <div className="space-y-3">
        {updates.map((update) => (
          <article
            key={update.id}
            className="rounded-md border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Day badge */}
                <span className="inline-flex items-center rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-2.5 py-0.5 text-xs font-medium tabular-nums">
                  Day {update.sprintDay} of {update.totalDays}
                </span>
                {/* Frame badge */}
                {update.frame && (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-700 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {(() => {
                      const idx = ATTITUDE_THEMES.indexOf(update.frame as typeof ATTITUDE_THEMES[number]);
                      return idx >= 0 ? `${idx + 1} · ${update.frame}` : update.frame;
                    })()}
                  </span>
                )}
                {/* Timestamp */}
                <span className={`${getTypographyClassName("body-sm")} text-text-muted tabular-nums`}>
                  {formatDate(update.createdAt)} · {formatTime(update.createdAt)}
                </span>
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(update)}
                    className="h-8 px-2 text-xs rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 ease-out"
                    aria-label="Edit update"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(update.id)}
                    disabled={deletingId === update.id}
                    className="h-8 px-2 text-xs rounded border border-neutral-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 disabled:opacity-50 transition-colors duration-150 ease-out"
                    aria-label="Delete update"
                  >
                    {deletingId === update.id ? "..." : "Delete"}
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <p className={`${getTypographyClassName("body-sm")} text-text-primary whitespace-pre-line`}>
              {update.body}
            </p>

            {/* Author */}
            <p className={`${getTypographyClassName("body-sm")} text-text-muted`}>
              — {update.authorName}
            </p>

            {/* Links */}
            {update.links.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {update.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-700 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-150 ease-out"
                  >
                    {getUrlIcon(link.url)}
                    {link.label || link.url}
                  </a>
                ))}
              </div>
            )}

            {/* Attachments */}
            {update.attachments && update.attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                {update.attachments.map((att, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxUrl(att.url)}
                    className="relative aspect-video rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:opacity-90 transition-opacity"
                    title={att.fileName}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={att.url} alt={att.fileName} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Attachment"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
