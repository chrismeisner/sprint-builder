"use client";

import { useState, useEffect } from "react";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";

interface Sandbox {
  id: string;
  name: string;
  folder_name: string;
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

interface LinkSandboxButtonProps {
  projectId: string;
}

export default function LinkSandboxButton({ projectId }: LinkSandboxButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
  const [unregisteredFolders, setUnregisteredFolders] = useState<UnregisteredFolder[]>([]);
  const [showUnregistered, setShowUnregistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanningFolders, setScanningFolders] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSandboxes();
    }
  }, [isOpen]);

  const fetchSandboxes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/sandboxes");
      if (!response.ok) throw new Error("Failed to fetch sandboxes");
      const data = await response.json();
      setSandboxes(data.sandboxes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sandboxes");
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
      await fetchSandboxes();
      await scanForUnregisteredFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register folder");
    }
  };

  const handleLinkSandbox = async (sandboxId: string) => {
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sandboxId, projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to link sandbox");
      }

      // Refresh the page to show the updated sandbox list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link sandbox");
    }
  };

  const handleUnlinkSandbox = async (sandboxId: string) => {
    setError("");
    try {
      const response = await fetch("/api/sandboxes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sandboxId, projectId: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink sandbox");
      }

      // Refresh the page to show the updated sandbox list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink sandbox");
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="sm"
      >
        Link Sandbox
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white dark:bg-black border border-black/10 dark:border-white/15 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-black/10 dark:border-white/15">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography as="h2" scale="h3">
                    Link Sandbox to Project
                  </Typography>
                  <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
                    Select a sandbox to link to this project
                  </Typography>
                </div>
                <Button
                  onClick={scanForUnregisteredFolders}
                  variant="secondary"
                  size="sm"
                  disabled={scanningFolders}
                >
                  {scanningFolders ? "Scanning..." : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

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
                    These folders exist in sandboxes-data/ but haven&apos;t been registered yet. Click to register and link them to this project.
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

              {/* Registered Sandboxes Section */}
              <div className="space-y-3">
                <Typography as="h3" scale="body-md" className="font-semibold">
                  Registered Sandboxes
                </Typography>
                {loading ? (
                  <Typography as="p" scale="body-sm" className="opacity-70 text-center py-8">
                    Loading sandboxes...
                  </Typography>
                ) : sandboxes.length === 0 ? (
                  <Typography as="p" scale="body-sm" className="opacity-70 text-center py-8">
                    No sandboxes available to link
                  </Typography>
                ) : (
                  <div className="space-y-2">
                    {sandboxes.map((sandbox) => {
                      const isLinkedToThisProject = sandbox.project_id === projectId;
                      const isLinkedToOtherProject = sandbox.project_id && sandbox.project_id !== projectId;

                      return (
                        <div
                          key={sandbox.id}
                          className="p-4 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Typography as="p" scale="body-md" className="font-medium">
                                  {sandbox.name}
                                </Typography>
                                {isLinkedToThisProject && (
                                  <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 text-xs">
                                    Linked
                                  </span>
                                )}
                                {isLinkedToOtherProject && (
                                  <span className="inline-flex items-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 text-xs">
                                    Linked to: {sandbox.project_name}
                                  </span>
                                )}
                              </div>
                              {sandbox.description && (
                                <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
                                  {sandbox.description}
                                </Typography>
                              )}
                              <Typography as="p" scale="mono-sm" className="opacity-50 mt-1">
                                {sandbox.folder_name}
                              </Typography>
                            </div>
                            <div>
                              {isLinkedToThisProject ? (
                                <Button
                                  onClick={() => handleUnlinkSandbox(sandbox.id)}
                                  variant="secondary"
                                  size="sm"
                                >
                                  Unlink
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleLinkSandbox(sandbox.id)}
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

            {/* Footer */}
            <div className="p-6 border-t border-black/10 dark:border-white/15 flex justify-end">
              <Button
                onClick={() => setIsOpen(false)}
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
