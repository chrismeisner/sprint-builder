"use client";

import { useCallback, useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

type ProjectDemo = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  mimetype: string | null;
  createdAt: string;
};

type Props = { projectId: string };

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectDemos({ projectId }: Props) {
  const [demos, setDemos] = useState<ProjectDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Auto-fill title from filename if empty
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
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
    fd.append("title", title.trim() || selectedFile.name.replace(/\.[^/.]+$/, ""));
    if (description.trim()) {
      fd.append("description", description.trim());
    }

    startTransition(async () => {
      try {
        setUploadError(null);
        setUploadProgress(0);

        const res = await fetch(`/api/projects/${projectId}/demos`, {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        // Reset form
        setTitle("");
        setDescription("");
        setSelectedFile(null);
        setShowUploadModal(false);
        setUploadProgress(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        await refresh();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
        setUploadProgress(null);
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
          <p className="text-sm opacity-70">Video demos showcasing project work.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setUploadError(null);
            setShowUploadModal(true);
          }}
          className="px-3 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 transition"
        >
          Upload demo
        </button>
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : loading ? (
        <div className="text-sm opacity-70">Loading demos...</div>
      ) : demos.length === 0 ? (
        <div className="text-sm opacity-70">No demos uploaded yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <div
              key={demo.id}
              className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]"
            >
              {/* Video player or thumbnail */}
              <div className="relative aspect-video bg-black/5 dark:bg-white/5">
                {playingId === demo.id ? (
                  <video
                    src={demo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onEnded={() => setPlayingId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlayingId(demo.id)}
                    className="w-full h-full flex items-center justify-center group"
                  >
                    {demo.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={demo.thumbnailUrl}
                        alt={demo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-black/40 dark:text-white/40">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-xs">Click to play</span>
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-black ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h4 className="font-medium text-sm truncate">{demo.title}</h4>
                {demo.description && (
                  <p className="text-xs opacity-70 line-clamp-2">{demo.description}</p>
                )}
                <div className="flex items-center justify-between text-xs opacity-60">
                  <span>{formatFileSize(demo.fileSizeBytes)}</span>
                  <span>{new Date(demo.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={demo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-xs rounded border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    Open in new tab
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-neutral-900 shadow-xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-4 py-3">
              <h4 className="text-base font-semibold">Upload Demo Video</h4>
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
              {/* File input */}
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
                <p className="text-xs opacity-60">
                  Supported formats: MP4, WebM, MOV. Max size: 500MB
                </p>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  placeholder="Demo title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={isPending}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  placeholder="Brief description of what this demo shows..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                  disabled={isPending}
                />
              </div>

              {/* Selected file info */}
              {selectedFile && (
                <div className="text-xs bg-black/5 dark:bg-white/5 rounded-md p-2">
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="opacity-60 ml-2">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              )}

              {/* Upload progress */}
              {uploadProgress !== null && (
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2">
                  <div
                    className="bg-black dark:bg-white h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
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
                    setTitle("");
                    setDescription("");
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
    </div>
  );
}
