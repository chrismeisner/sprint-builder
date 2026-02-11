"use client";

import { useCallback, useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

type ProjectDemo = {
  id: string;
  title: string;
  description: string | null;
  demoType: "file" | "link";
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  mimetype: string | null;
  createdAt: string;
};

type Props = { projectId: string; projectName: string };

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateDemoFilename(projectName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  
  // Sanitize project name: remove special chars, replace spaces with hyphens
  const sanitizedName = projectName
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50); // Limit length
  
  return `${sanitizedName}-Demo-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export default function ProjectDemos({ projectId, projectName }: Props) {
  const [demos, setDemos] = useState<ProjectDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedFilename, setCopiedFilename] = useState(false);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyFilename = async () => {
    const filename = generateDemoFilename(projectName);
    try {
      await navigator.clipboard.writeText(filename);
      setCopiedFilename(true);
      setTimeout(() => setCopiedFilename(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = filename;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedFilename(true);
      setTimeout(() => setCopiedFilename(false), 2000);
    }
  };

  const fetchDemos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/demos`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load demos");
      }
      const data = (await res.json()) as { demos?: ProjectDemo[] };
      setDemos(data.demos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load demos");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDemos();
  }, [fetchDemos]);

  const refresh = useCallback(async () => {
    await fetchDemos();
    router.refresh();
  }, [fetchDemos, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadTitle.trim()) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a video file");
      return;
    }

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("title", uploadTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, ""));
    if (uploadDescription.trim()) {
      fd.append("description", uploadDescription.trim());
    }

    startTransition(async () => {
      try {
        setUploadError(null);
        const res = await fetch(`/api/projects/${projectId}/demos`, {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        // Reset form
        setUploadTitle("");
        setUploadDescription("");
        setSelectedFile(null);
        setShowUploadModal(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        await refresh();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  };

  const handleAddLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setLinkError("URL is required");
      return;
    }

    startTransition(async () => {
      try {
        setLinkError(null);
        const res = await fetch(`/api/projects/${projectId}/demos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: linkUrl.trim(),
            title: linkTitle.trim() || undefined,
            description: linkDescription.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to add link");
        }

        // Reset form
        setLinkUrl("");
        setLinkTitle("");
        setLinkDescription("");
        setShowLinkModal(false);

        await refresh();
      } catch (err) {
        setLinkError(err instanceof Error ? err.message : "Failed to add link");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this demo? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${projectId}/demos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Demos</h3>
          <p className="text-sm opacity-70">Video demos and recordings showcasing project work.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyFilename}
            className="px-3 py-2 text-sm rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition inline-flex items-center gap-1.5"
            title="Copy a timestamped filename for your demo recording"
          >
            {copiedFilename ? (
              <>
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy filename
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setLinkError(null);
              setShowLinkModal(true);
            }}
            className="px-3 py-2 text-sm rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Add link
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              setShowUploadModal(true);
            }}
            className="px-3 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 transition"
          >
            Upload video
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : loading ? (
        <div className="text-sm opacity-70">Loading demos...</div>
      ) : demos.length === 0 ? (
        <div className="text-sm opacity-70">No demos yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Title</th>
                <th className="text-left px-3 py-2 font-semibold">Type</th>
                <th className="text-left px-3 py-2 font-semibold">Details</th>
                <th className="text-left px-3 py-2 font-semibold">Created</th>
                <th className="text-left px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/15">
              {demos.map((demo) => (
                <tr key={demo.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="px-3 py-2">
                    <div>
                      <a
                        href={demo.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {demo.title}
                      </a>
                      {demo.description && (
                        <p className="text-xs opacity-60 mt-0.5 line-clamp-1">{demo.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {demo.demoType === "link" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Link
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Video
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs opacity-70">
                    {demo.demoType === "file" ? (
                      formatFileSize(demo.fileSizeBytes)
                    ) : (
                      <span className="truncate max-w-[150px] inline-block align-bottom" title={demo.videoUrl}>
                        {new URL(demo.videoUrl).hostname}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs opacity-70">
                    {new Date(demo.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={demo.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 text-xs rounded border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(demo.id)}
                        disabled={deletingId === demo.id}
                        className="px-2 py-1 text-xs rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition"
                      >
                        {deletingId === demo.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-neutral-900 shadow-xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-4 py-3">
              <h4 className="text-base font-semibold">Upload Video</h4>
              <button
                type="button"
                className="text-sm opacity-70 hover:opacity-100"
                onClick={() => setShowUploadModal(false)}
                disabled={isPending}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4 px-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Video file</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
                  onChange={handleFileSelect}
                  className="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black/5 dark:file:bg-white/10 file:cursor-pointer"
                  disabled={isPending}
                />
                <p className="text-xs opacity-60">MP4, WebM, MOV. Max 500MB</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  placeholder="Demo title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  placeholder="Brief description..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                  disabled={isPending}
                />
              </div>

              {selectedFile && (
                <div className="text-xs bg-black/5 dark:bg-white/5 rounded-md p-2">
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="opacity-60 ml-2">({formatFileSize(selectedFile.size)})</span>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadError(null);
                    setUploadTitle("");
                    setUploadDescription("");
                    setSelectedFile(null);
                  }}
                  className="px-3 py-2 text-sm rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedFile}
                  className="px-3 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isPending ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-neutral-900 shadow-xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-4 py-3">
              <h4 className="text-base font-semibold">Add Demo Link</h4>
              <button
                type="button"
                className="text-sm opacity-70 hover:opacity-100"
                onClick={() => setShowLinkModal(false)}
                disabled={isPending}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddLink} className="space-y-4 px-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">URL</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/rec/share/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={isPending}
                  required
                />
                <p className="text-xs opacity-60">Zoom, Loom, YouTube, or any video URL</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  placeholder="Demo title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  placeholder="Brief description..."
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                  disabled={isPending}
                />
              </div>

              {linkError && (
                <p className="text-xs text-red-600 dark:text-red-400">{linkError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkError(null);
                    setLinkUrl("");
                    setLinkTitle("");
                    setLinkDescription("");
                  }}
                  className="px-3 py-2 text-sm rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !linkUrl.trim()}
                  className="px-3 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isPending ? "Adding..." : "Add link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
