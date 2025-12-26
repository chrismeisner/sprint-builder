"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProjectDocument =
  | {
      kind: "file";
      id: string;
      filename: string;
      createdAt: string;
      mimetype: string | null;
      size: number | null;
    }
  | {
      kind: "link";
      id: string;
      title: string;
      url: string | null;
      createdAt: string;
    };

type Props = { projectId: string };

export default function ProjectDocuments({ projectId }: Props) {
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/documents`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load documents");
      }
      const data = (await res.json()) as { documents?: ProjectDocument[] };
      setDocs(data.documents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const refresh = useCallback(async () => {
    await fetchDocs();
    router.refresh();
  }, [fetchDocs, router]);

  const mutate = useCallback(
    async (input: FormData | { url: string; title?: string }) => {
      const isFormData = input instanceof FormData;
      const init: RequestInit = isFormData
        ? { method: "POST", body: input }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          };
      const res = await fetch(`/api/projects/${projectId}/documents`, init);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }
    },
    [projectId]
  );

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setUploadError("Choose a file to upload");
      return;
    }

    const file = fileInput.files[0];
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      try {
        setUploadError(null);
        await mutate(fd);
        form.reset();
        await refresh();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  };

  const autofillTitleFromUrl = async (value: string) => {
    if (!value.trim()) return;
    setLinkError(null);
    setTitleLoading(true);
    try {
      const res = await fetch(`/api/title?url=${encodeURIComponent(value)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not fetch title");
      }
      const parsedTitle = (data.title as string | undefined)?.trim();
      if (parsedTitle) {
        setLinkTitle(parsedTitle);
      }
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Could not fetch title");
    } finally {
      setTitleLoading(false);
    }
  };

  const isValidUrl = useMemo(() => {
    try {
      // eslint-disable-next-line no-new
      new URL(linkUrl);
      return true;
    } catch {
      return false;
    }
  }, [linkUrl]);

  const handleAddLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setLinkError("URL is required");
      return;
    }
    const bodyTitle = linkTitle.trim();
    const urlVal = linkUrl.trim();

    startTransition(async () => {
      try {
        setLinkError(null);
        await mutate({ url: urlVal, title: bodyTitle || undefined });
        setLinkTitle("");
        setLinkUrl("");
        setShowLinkModal(false);
        await refresh();
      } catch (err) {
        setLinkError(err instanceof Error ? err.message : "Failed to add link");
      }
    });
  };

  const rows = useMemo(
    () =>
      docs.map((d) => {
        const isLink = d.kind === "link";
        return {
          key: d.id,
          name: isLink ? d.title : d.filename,
          href: isLink ? d.url : null,
          viewUrl: isLink ? d.url : `/api/projects/${projectId}/documents/${d.id}`,
          type: isLink ? "Link" : d.mimetype ?? "File",
          details: isLink
            ? d.url ?? "—"
            : d.size != null
              ? `${(d.size / 1024).toFixed(1)} KB`
              : "—",
          uploaded: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—",
        };
      }),
    [docs, projectId]
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents?id=${encodeURIComponent(id)}`, {
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
          <h3 className="text-lg font-semibold">Project Files</h3>
          <p className="text-sm opacity-70">Upload PDFs or other assets linked to this project.</p>
        </div>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="file"
            name="file"
            className="text-sm"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.csv"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 disabled:opacity-50 transition"
          >
            {isPending ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
      {uploadError && <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setLinkError(null);
            setShowLinkModal(true);
          }}
          className="px-3 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 transition"
        >
          Add link
        </button>
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : loading ? (
        <div className="text-sm opacity-70">Loading documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-sm opacity-70">No files uploaded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Name</th>
                <th className="text-left px-3 py-2 font-semibold">Type</th>
                <th className="text-left px-3 py-2 font-semibold">Details</th>
                <th className="text-left px-3 py-2 font-semibold">Uploaded</th>
                <th className="text-left px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/15">
              {rows.map((row) => (
                <tr key={row.key} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="px-3 py-2">
                    {row.href ? (
                      <a href={row.href} target="_blank" rel="noreferrer" className="underline hover:opacity-80">
                        {row.name}
                      </a>
                    ) : (
                      row.name
                    )}
                  </td>
                  <td className="px-3 py-2">{row.type}</td>
                  <td className="px-3 py-2">{row.details}</td>
                  <td className="px-3 py-2">{row.uploaded}</td>
                  <td className="px-3 py-2">
                    {row.viewUrl && (
                      <a
                        href={row.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition mr-2 inline-block"
                      >
                        View
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(row.key)}
                      disabled={deletingId === row.key}
                      className="px-3 py-1.5 text-xs rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {deletingId === row.key ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-neutral-900 shadow-xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-4 py-3">
              <h4 className="text-base font-semibold">Add link</h4>
              <button
                type="button"
                className="text-sm opacity-70 hover:opacity-100"
                onClick={() => setShowLinkModal(false)}
                disabled={isPending}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddLink} className="space-y-3 px-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">URL</label>
                <input
                  type="url"
                  name="link-url"
                  placeholder="https://example.com/resource"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    setLinkError(null);
                  }}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={isPending}
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => autofillTitleFromUrl(linkUrl)}
                    disabled={!isValidUrl || isPending || titleLoading}
                    className="px-3 py-2 text-sm rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition disabled:opacity-50"
                  >
                    {titleLoading ? "Fetching..." : "Get title"}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Title (optional)</label>
                <input
                  type="text"
                  name="link-title"
                  placeholder="Title (auto-filled if empty)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={isPending}
                />
              </div>
              {linkError && <p className="text-xs text-red-600 dark:text-red-400">{linkError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkError(null);
                  }}
                  className="px-3 py-2 text-sm rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isPending ? "Adding..." : "Save link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
