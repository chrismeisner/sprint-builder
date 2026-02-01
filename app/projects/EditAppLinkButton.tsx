"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface AppLink {
  id: string;
  name: string;
  folder_name: string | null;
  url: string | null;
  link_type: "folder" | "url";
  description: string | null;
  is_public?: boolean;
}

interface EditAppLinkButtonProps {
  appLink: AppLink;
}

export default function EditAppLinkButton({ appLink }: EditAppLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(appLink.name);
  const [url, setUrl] = useState(appLink.url || "");
  const [description, setDescription] = useState(appLink.description || "");
  const [isPublic, setIsPublic] = useState(appLink.is_public || false);
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState("");
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: appLink.id,
          name: name.trim() || appLink.name,
          url: appLink.link_type === "url" ? url.trim() : undefined,
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update app link");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update app link");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appLink.id, projectId: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink app link");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink app link");
    } finally {
      setUnlinking(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setName(appLink.name);
    setUrl(appLink.url || "");
    setDescription(appLink.description || "");
    setIsPublic(appLink.is_public || false);
    setError("");
  };

  return (
    <>
      <ConfirmModal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={handleUnlink}
        title="Unlink app link?"
        message={`Are you sure you want to unlink "${appLink.name}" from this project? ${
          appLink.link_type === "folder" 
            ? "The sandbox files will remain, but it won't be associated with this project anymore."
            : "The URL will remain saved but won't be associated with this project anymore."
        }`}
        confirmText="Unlink"
        cancelText="Cancel"
        variant="danger"
      />

      <button
        onClick={() => setIsOpen(true)}
        className="font-medium hover:underline text-sm"
      >
        Edit
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleClose}
        >
          <div
            className="bg-white dark:bg-black border border-black/10 dark:border-white/15 rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-black/10 dark:border-white/15">
              <h2 className="text-lg font-semibold">
                Edit App Link
              </h2>
              <p className="text-xs font-mono opacity-50 mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                  appLink.link_type === "url"
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400"
                    : "bg-black/10 dark:bg-white/10"
                }`}>
                  {appLink.link_type === "url" ? "URL" : "Folder"}
                </span>
                {appLink.link_type === "folder" ? appLink.folder_name : ""}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="applink-name" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  id="applink-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:focus-visible:ring-white/60"
                  placeholder="App link name"
                />
              </div>

              {appLink.link_type === "url" && (
                <div className="space-y-1.5">
                  <label htmlFor="applink-url" className="block text-sm font-medium">
                    URL
                  </label>
                  <input
                    id="applink-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:focus-visible:ring-white/60"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="applink-description" className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="applink-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:focus-visible:ring-white/60"
                  placeholder="Optional description"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-sm font-medium">
                  Visibility
                </span>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className="w-full flex items-center gap-3 p-3 rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <span
                    role="switch"
                    aria-checked={isPublic}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                      isPublic ? "bg-green-500" : "bg-black/20 dark:bg-white/20"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 mt-0.5 ${
                        isPublic ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium block">
                      {isPublic ? "Public" : "Private"}
                    </span>
                    <span className="text-sm opacity-60 block">
                      {isPublic
                        ? "Anyone with the link can view"
                        : "Only admins and project members"}
                    </span>
                  </div>
                </button>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-black/10 dark:border-white/15">
                <span className="block text-sm font-medium text-red-600 dark:text-red-400">
                  Danger Zone
                </span>
                <button
                  type="button"
                  onClick={() => setShowUnlinkModal(true)}
                  disabled={unlinking}
                  className="w-full flex items-center gap-3 p-3 rounded-md border border-red-500/30 hover:bg-red-500/5 transition disabled:opacity-50"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium block">
                      Unlink from project
                    </span>
                    <span className="text-sm opacity-60 block">
                      Remove this app link from the project
                    </span>
                  </div>
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                    {unlinking ? "Unlinking..." : "Unlink"}
                  </span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-black/10 dark:border-white/15 flex justify-end gap-3">
              <Button
                onClick={handleClose}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                size="sm"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
