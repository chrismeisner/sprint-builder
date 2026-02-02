"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type SprintLink = {
  id: string;
  name: string;
  linkType: "url" | "file";
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimetype: string | null;
  description: string | null;
  createdAt: string;
};

type Props = {
  sprintId: string;
  isAdmin: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimetype: string | null): JSX.Element {
  if (!mimetype) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  
  if (mimetype === "application/pdf") {
    return (
      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  }
  
  if (mimetype.startsWith("image/")) {
    return (
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

export default function SprintLinks({ sprintId, isAdmin }: Props) {
  const [links, setLinks] = useState<SprintLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add URL modal state
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [urlName, setUrlName] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [urlDescription, setUrlDescription] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  
  // File upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/sprint-drafts/${sprintId}/links`);
      if (!res.ok) {
        throw new Error("Failed to fetch links");
      }
      
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err) {
      console.error("Error fetching links:", err);
      setError("Failed to load links");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleAddUrl = async () => {
    if (!urlName.trim() || !urlValue.trim()) return;
    
    try {
      setAddingUrl(true);
      
      const res = await fetch(`/api/sprint-drafts/${sprintId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: urlName.trim(),
          linkType: "url",
          url: urlValue.trim(),
          description: urlDescription.trim() || undefined,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add link");
      }
      
      const data = await res.json();
      setLinks((prev) => [data.link, ...prev]);
      
      // Reset form
      setUrlName("");
      setUrlValue("");
      setUrlDescription("");
      setShowAddUrlModal(false);
    } catch (err) {
      console.error("Error adding URL:", err);
      alert(err instanceof Error ? err.message : "Failed to add link");
    } finally {
      setAddingUrl(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`/api/sprint-drafts/${sprintId}/links/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      
      const data = await res.json();
      setLinks((prev) => [data.link, ...prev]);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm("Delete this link?")) return;
    
    try {
      setDeletingId(linkId);
      
      const res = await fetch(`/api/sprint-drafts/${sprintId}/links?linkId=${linkId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete link");
      }
      
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err) {
      console.error("Error deleting link:", err);
      alert("Failed to delete link");
    } finally {
      setDeletingId(null);
    }
  };

  const t = {
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    cardHeading: getTypographyClassName("h4"),
    buttonSm: getTypographyClassName("button-sm"),
  };

  if (loading) {
    return (
      <div className={`${t.bodySm} text-text-muted`}>Loading links...</div>
    );
  }

  if (error) {
    return (
      <div className={`${t.bodySm} text-red-600 dark:text-red-400`}>{error}</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className={t.cardHeading}>Links</h2>
          <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>
            {links.length} {links.length === 1 ? "item" : "items"}
          </span>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddUrlModal(true)}
              className={`${t.buttonSm} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Add URL
            </button>
            
            <label
              className={`${t.buttonSm} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload File
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
            </label>
          </div>
        )}
      </div>

      {/* Links table */}
      {links.length === 0 ? (
        <div className={`${t.bodySm} text-text-muted py-4`}>
          No links added yet.{isAdmin && " Add URLs or upload files to attach them to this sprint."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-black/10 dark:border-white/15 rounded-lg overflow-hidden">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr className={getTypographyClassName("body-sm")}>
                <th className="text-left px-3 py-2 text-text-muted">Name</th>
                <th className="text-left px-3 py-2 text-text-muted">Type</th>
                <th className="text-left px-3 py-2 text-text-muted">Link</th>
                <th className="text-left px-3 py-2 text-text-muted">Added</th>
                {isAdmin && <th className="text-center px-3 py-2 text-text-muted w-16"></th>}
              </tr>
            </thead>
            <tbody className={getTypographyClassName("body-sm")}>
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-950/40 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {link.linkType === "file" ? (
                        getFileIcon(link.mimetype)
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                      <div>
                        <div className="font-medium text-text-primary">{link.name}</div>
                        {link.description && (
                          <div className="text-text-muted text-xs">{link.description}</div>
                        )}
                        {link.fileSizeBytes && (
                          <div className="text-text-muted text-xs">{formatFileSize(link.fileSizeBytes)}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                      link.linkType === "url"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}>
                      {link.linkType === "url" ? "URL" : "File"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {link.linkType === "url" && link.url ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 max-w-xs truncate"
                      >
                        {new URL(link.url).hostname}
                        <span className="opacity-50">↗</span>
                      </a>
                    ) : link.fileUrl ? (
                      <a
                        href={link.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Download
                        <span className="opacity-50">↓</span>
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-text-muted">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deletingId === link.id}
                        className="p-1 text-text-muted hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition"
                        title="Delete"
                      >
                        {deletingId === link.id ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add URL Modal */}
      {showAddUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setShowAddUrlModal(false)}
          />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
              <h3 className={getTypographyClassName("h4")}>Add URL</h3>
              <button
                onClick={() => setShowAddUrlModal(false)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  placeholder="e.g., Brand Workshop Notes"
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={addingUrl}
                />
              </div>
              
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  URL *
                </label>
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={addingUrl}
                />
              </div>
              
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={urlDescription}
                  onChange={(e) => setUrlDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={addingUrl}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={() => setShowAddUrlModal(false)}
                disabled={addingUrl}
                className={`${t.buttonSm} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUrl}
                disabled={addingUrl || !urlName.trim() || !urlValue.trim()}
                className={`${t.buttonSm} px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
              >
                {addingUrl ? "Adding..." : "Add URL"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
