"use client";

import { useState, useEffect } from "react";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";

interface AppLink {
  id: string;
  name: string;
  folder_name: string | null;
  url: string | null;
  link_type: "folder" | "url";
  description: string | null;
  project_id: string | null;
  project_name: string | null;
}

interface UnregisteredFolder {
  folderName: string;
  displayName: string;
  hasIndex: boolean;
  fileCount: number;
}

interface AddAppLinkButtonProps {
  projectId: string;
}

type LinkMode = "url" | "folder";

export default function AddAppLinkButton({ projectId }: AddAppLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appLinks, setAppLinks] = useState<AppLink[]>([]);
  const [unregisteredFolders, setUnregisteredFolders] = useState<UnregisteredFolder[]>([]);
  const [showUnregistered, setShowUnregistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanningFolders, setScanningFolders] = useState(false);
  const [error, setError] = useState("");
  
  // New URL link form state
  const [linkMode, setLinkMode] = useState<LinkMode>("url");
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAppLinks();
    }
  }, [isOpen]);

  const fetchAppLinks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/sandboxes");
      if (!response.ok) throw new Error("Failed to fetch app links");
      const data = await response.json();
      setAppLinks(data.sandboxes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load app links");
    } finally {
      setLoading(false);
    }
  };

  const scanForUnregisteredFolders = async () => {
    setScanningFolders(true);
    setError("");
    try {
      const response = await fetch("/api/sandboxes?unregistered=true");
      if (!response.ok) throw new Error("Failed to scan folders");
      const data = await response.json();
      setUnregisteredFolders(data.unregistered || []);
      setShowUnregistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan folders");
    } finally {
      setScanningFolders(false);
    }
  };

  const handleRegisterFolder = async (folderName: string, displayName: string) => {
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          linkType: "folder",
          folderName, 
          projectId,
          name: displayName 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to register folder");
      }

      // Refresh both lists
      await fetchAppLinks();
      await scanForUnregisteredFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register folder");
    }
  };

  const handleCreateUrlLink = async () => {
    if (!newUrl.trim() || !newName.trim()) {
      setError("Name and URL are required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkType: "url",
          url: newUrl.trim(),
          name: newName.trim(),
          description: newDescription.trim() || null,
          projectId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create app link");
      }

      // Refresh and close
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create app link");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkAppLink = async (appLinkId: string) => {
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appLinkId, projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to link app link");
      }

      // Refresh the page to show the updated list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link app link");
    }
  };

  const handleUnlinkAppLink = async (appLinkId: string) => {
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appLinkId, projectId: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink app link");
      }

      // Refresh the page to show the updated list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink app link");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setLinkMode("url");
    setNewUrl("");
    setNewName("");
    setNewDescription("");
    setError("");
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="sm"
      >
        Add App Link
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
          <div
            className="bg-white dark:bg-black border border-black/10 dark:border-white/15 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-black/10 dark:border-white/15">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography as="h2" scale="h3">
                    Add App Link
                  </Typography>
                  <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
                    Add a URL or link a sandbox folder to this project
                  </Typography>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Link Type Tabs */}
              <div className="flex gap-2 border-b border-black/10 dark:border-white/15 pb-3">
                <button
                  onClick={() => setLinkMode("url")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    linkMode === "url"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  Add URL
                </button>
                <button
                  onClick={() => setLinkMode("folder")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    linkMode === "folder"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  Link Folder
                </button>
              </div>

              {/* URL Mode */}
              {linkMode === "url" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="link-name" className="block text-sm font-medium">
                      Name
                    </label>
                    <input
                      id="link-name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:focus-visible:ring-white/60"
                      placeholder="e.g., Staging, Production, v2 Beta"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="link-url" className="block text-sm font-medium">
                      URL
                    </label>
                    <input
                      id="link-url"
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:focus-visible:ring-white/60"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="link-description" className="block text-sm font-medium">
                      Description <span className="opacity-50">(optional)</span>
                    </label>
                    <textarea
                      id="link-description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-black/15 dark:border-white/25 bg-white dark:bg-black/40 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 dark:focus-visible:ring-white/60"
                      placeholder="Optional description"
                    />
                  </div>

                  <Button
                    onClick={handleCreateUrlLink}
                    variant="primary"
                    size="sm"
                    disabled={saving || !newUrl.trim() || !newName.trim()}
                    className="w-full"
                  >
                    {saving ? "Adding..." : "Add App Link"}
                  </Button>
                </div>
              )}

              {/* Folder Mode */}
              {linkMode === "folder" && (
                <div className="space-y-6">
                  {/* Scan Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={scanForUnregisteredFolders}
                      variant="secondary"
                      size="sm"
                      disabled={scanningFolders}
                    >
                      {scanningFolders ? "Scanning..." : "Scan for Folders"}
                    </Button>
                  </div>

                  {/* Unregistered Folders Section */}
                  {showUnregistered && unregisteredFolders.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Typography as="h3" scale="body-md" className="font-semibold">
                          Unregistered Folders
                        </Typography>
                        <Typography as="span" scale="body-sm" className="opacity-60">
                          {unregisteredFolders.length} found
                        </Typography>
                      </div>
                      <Typography as="p" scale="body-sm" className="opacity-70">
                        These folders exist in sandboxes-data/ but haven&apos;t been registered yet.
                      </Typography>
                      <div className="space-y-2">
                        {unregisteredFolders.map((folder) => (
                          <div
                            key={folder.folderName}
                            className="p-4 rounded-md border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Typography as="p" scale="body-md" className="font-medium">
                                    {folder.displayName}
                                  </Typography>
                                  <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-xs">
                                    New
                                  </span>
                                </div>
                                <Typography as="p" scale="mono-sm" className="opacity-50 mt-1">
                                  {folder.folderName}
                                </Typography>
                                <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
                                  {folder.fileCount} {folder.fileCount === 1 ? "file" : "files"}
                                  {folder.hasIndex ? " • Has index.html" : " • No index.html"}
                                </Typography>
                              </div>
                              <div>
                                <Button
                                  onClick={() => handleRegisterFolder(folder.folderName, folder.displayName)}
                                  variant="primary"
                                  size="sm"
                                >
                                  Register & Link
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showUnregistered && unregisteredFolders.length === 0 && (
                    <div className="p-4 rounded-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5">
                      <Typography as="p" scale="body-sm" className="opacity-70 text-center">
                        No unregistered folders found. All folders in sandboxes-data/ are already registered.
                      </Typography>
                    </div>
                  )}

                  {/* Registered App Links Section */}
                  <div className="space-y-3">
                    <Typography as="h3" scale="body-md" className="font-semibold">
                      Existing App Links
                    </Typography>
                    {loading ? (
                      <Typography as="p" scale="body-sm" className="opacity-70 text-center py-8">
                        Loading...
                      </Typography>
                    ) : appLinks.length === 0 ? (
                      <Typography as="p" scale="body-sm" className="opacity-70 text-center py-8">
                        No app links available to link
                      </Typography>
                    ) : (
                      <div className="space-y-2">
                        {appLinks.map((appLink) => {
                          const isLinkedToThisProject = appLink.project_id === projectId;
                          const isLinkedToOtherProject = !!(appLink.project_id && appLink.project_id !== projectId);

                          return (
                            <div
                              key={appLink.id}
                              className="p-4 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Typography as="p" scale="body-md" className="font-medium">
                                      {appLink.name}
                                    </Typography>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                      appLink.link_type === "url"
                                        ? "bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400"
                                        : "bg-black/10 dark:bg-white/10"
                                    }`}>
                                      {appLink.link_type === "url" ? "URL" : "Folder"}
                                    </span>
                                    {isLinkedToThisProject && (
                                      <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 text-xs">
                                        Linked
                                      </span>
                                    )}
                                    {isLinkedToOtherProject && (
                                      <span className="inline-flex items-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 text-xs">
                                        Linked to: {appLink.project_name}
                                      </span>
                                    )}
                                  </div>
                                  {appLink.description && (
                                    <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
                                      {appLink.description}
                                    </Typography>
                                  )}
                                  <Typography as="p" scale="mono-sm" className="opacity-50 mt-1">
                                    {appLink.link_type === "url" ? appLink.url : appLink.folder_name}
                                  </Typography>
                                </div>
                                <div>
                                  {isLinkedToThisProject ? (
                                    <Button
                                      onClick={() => handleUnlinkAppLink(appLink.id)}
                                      variant="secondary"
                                      size="sm"
                                    >
                                      Unlink
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => handleLinkAppLink(appLink.id)}
                                      variant="primary"
                                      size="sm"
                                      disabled={isLinkedToOtherProject}
                                    >
                                      Link
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-black/10 dark:border-white/15 flex justify-end">
              <Button
                onClick={handleClose}
                variant="secondary"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
