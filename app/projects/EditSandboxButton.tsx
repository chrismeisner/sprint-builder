"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Sandbox {
  id: string;
  name: string;
  folder_name: string;
  description: string | null;
  is_public?: boolean;
}

interface EditSandboxButtonProps {
  sandbox: Sandbox;
}

export default function EditSandboxButton({ sandbox }: EditSandboxButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(sandbox.name);
  const [description, setDescription] = useState(sandbox.description || "");
  const [isPublic, setIsPublic] = useState(sandbox.is_public || false);
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
          id: sandbox.id,
          name: name.trim() || sandbox.name,
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update sandbox");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update sandbox");
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
        body: JSON.stringify({ id: sandbox.id, projectId: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink sandbox");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink sandbox");
    } finally {
      setUnlinking(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setName(sandbox.name);
    setDescription(sandbox.description || "");
    setIsPublic(sandbox.is_public || false);
    setError("");
  };

  return (
    <>
      <ConfirmModal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={handleUnlink}
        title="Unlink sandbox?"
        message={`Are you sure you want to unlink "${sandbox.name}" from this project? The sandbox files will remain, but it won't be associated with this project anymore.`}
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
                Edit Sandbox
              </h2>
              <p className="text-xs font-mono opacity-50 mt-1">
                {sandbox.folder_name}
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
                <label htmlFor="sandbox-name" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  id="sandbox-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:focus-visible:ring-white/60"
                  placeholder="Sandbox name"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sandbox-description" className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="sandbox-description"
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
                      Remove this sandbox from the project
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
