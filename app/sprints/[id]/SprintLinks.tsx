"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";

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

function getUrlIcon(url: string): JSX.Element {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Figma
    if (hostname.includes("figma.com")) {
      return (
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/960px-Figma-logo.svg.png" 
          alt="Figma" 
          className="w-5 h-5 object-contain"
        />
      );
    }
    
    // GitHub
    if (hostname.includes("github.com")) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // Google Docs/Drive
    if (hostname.includes("docs.google.com") || hostname.includes("drive.google.com")) {
      return (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
          alt="Google Docs"
          className="w-5 h-5 object-contain"
        />
      );
    }
    
    // Notion
    if (hostname.includes("notion.so") || hostname.includes("notion.site")) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
        </svg>
      );
    }
    
    // Miro
    if (hostname.includes("miro.com")) {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.392 0H13.9L17 10.444 10.444 0H6.949l3.102 10.444L3.494 0H0l5.05 17.639L8.8 24l4.432-14.738L17.665 24l2.334-6.361L24 0z"/>
        </svg>
      );
    }
    
    // Slack
    if (hostname.includes("slack.com")) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
        </svg>
      );
    }
    
    // Trello
    if (hostname.includes("trello.com")) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.646-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z"/>
        </svg>
      );
    }
    
    // Linear
    if (hostname.includes("linear.app")) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M3.00488 7.43957C3.00488 6.6304 3.24386 5.83735 3.69329 5.15459C4.14273 4.47183 4.78457 3.92841 5.54242 3.58805C6.30026 3.24769 7.14185 3.12358 7.95677 3.23045C8.77169 3.33732 9.53673 3.67076 10.1553 4.18833L21.8682 15.9012C22.3858 16.5198 22.7192 17.2848 22.8261 18.0997C22.933 18.9147 22.8089 19.7562 22.4685 20.5141C22.1281 21.2719 21.5847 21.9138 20.9019 22.3632C20.2192 22.8126 19.4261 23.0516 18.6169 23.0516C17.8078 23.0516 17.0147 22.8126 16.3319 22.3632C15.6492 21.9138 15.1058 21.2719 14.7654 20.5141C14.425 19.7562 14.3009 18.9147 14.4078 18.0997C14.5146 17.2848 14.8481 16.5198 15.3657 15.9012L3.65279 4.18833C3.40388 3.93941 3.14051 3.71012 2.86523 3.50195L3.00488 7.43957Z"/>
        </svg>
      );
    }
    
    // Default URL icon
    return (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  } catch {
    // If URL parsing fails, return default icon
    return (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  }
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
  
  // Reorder state
  const [reordering, setReordering] = useState(false);

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

  const handleMove = async (linkId: string, direction: "up" | "down") => {
    const currentIndex = links.findIndex((l) => l.id === linkId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= links.length) return;
    
    // Optimistically update UI
    const newLinks = [...links];
    const [movedLink] = newLinks.splice(currentIndex, 1);
    newLinks.splice(newIndex, 0, movedLink);
    setLinks(newLinks);
    
    // Persist the new order
    try {
      setReordering(true);
      const linkIds = newLinks.map((l) => l.id);
      
      const res = await fetch(`/api/sprint-drafts/${sprintId}/links`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkIds }),
      });
      
      if (!res.ok) {
        // Revert on error
        setLinks(links);
        throw new Error("Failed to reorder links");
      }
    } catch (err) {
      console.error("Error reordering links:", err);
      alert("Failed to reorder links");
    } finally {
      setReordering(false);
    }
  };

  const t = {
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    cardHeading: typography.headingCard,
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
                {isAdmin && <th className="text-center px-2 py-2 text-text-muted w-20">Order</th>}
                <th className="text-left px-3 py-2 text-text-muted">Name</th>
                <th className="text-left px-3 py-2 text-text-muted">Type</th>
                <th className="text-left px-3 py-2 text-text-muted">Link</th>
                <th className="text-left px-3 py-2 text-text-muted">Added</th>
                {isAdmin && <th className="text-center px-3 py-2 text-text-muted w-16"></th>}
              </tr>
            </thead>
            <tbody className={getTypographyClassName("body-sm")}>
              {links.map((link, index) => (
                <tr
                  key={link.id}
                  className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-950/40 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  {isAdmin && (
                    <td className="px-2 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMove(link.id, "up")}
                          disabled={index === 0 || reordering}
                          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMove(link.id, "down")}
                          disabled={index === links.length - 1 || reordering}
                          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {link.linkType === "file" 
                        ? getFileIcon(link.mimetype)
                        : link.url 
                          ? getUrlIcon(link.url)
                          : (
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          )
                      }
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
