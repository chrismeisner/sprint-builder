"use client";

import { useEffect, useState } from "react";

type UserFile = {
  name: string;
  displayName: string;
  size: number;
  contentType: string;
  created?: string;
  updated?: string;
  downloadUrl: string;
};

type StatusMessage = {
  type: "success" | "error";
  text: string;
};

const MAX_FILE_SIZE_LABEL = "50MB";
const ACCEPTED_TYPES_LABEL = "Images, PDFs, ZIPs, or plain text files";

export default function UserUploadsClient() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/user/uploads");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load files");
      }
      setFiles(data.files || []);
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load files",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus({
        type: "success",
        text: `"${data.file.displayName}" uploaded successfully`,
      });
      fetchFiles();
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: UserFile) => {
    if (!window.confirm(`Delete ${file.displayName}?`)) {
      return;
    }
    setDeletingName(file.name);
    setStatus(null);
    try {
      const res = await fetch(`/api/user/uploads?name=${encodeURIComponent(file.name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Delete failed");
      }
      setStatus({ type: "success", text: `"${file.displayName}" deleted` });
      setFiles((prev) => prev.filter((f) => f.name !== file.name));
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error ? error.message : "Delete failed",
      });
    } finally {
      setDeletingName(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="mt-10 rounded-lg border border-black/10 dark:border-white/15 p-6">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">Your Uploaded Files</h2>
            <p className="text-sm opacity-70">
              Files here are private to your account and require login to access.
            </p>
          </div>
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="text-sm px-3 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        <div>
          <label className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 cursor-pointer">
            {uploading ? "Uploading..." : "Upload File"}
            <input
              type="file"
              accept="image/*,.pdf,.zip,.txt"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleUpload(file);
                  event.target.value = "";
                }
              }}
            />
          </label>
          <p className="text-xs opacity-60 mt-2">
            {ACCEPTED_TYPES_LABEL}. Maximum size {MAX_FILE_SIZE_LABEL}.
          </p>
        </div>
      </div>

      {status && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            status.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          }`}
        >
          {status.text}
        </div>
      )}

      {loading ? (
        <div className="text-sm opacity-70">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-sm opacity-70">No files uploaded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/15">
                <th className="text-left py-2 px-2 font-semibold">Name</th>
                <th className="text-left py-2 px-2 font-semibold">Size</th>
                <th className="text-left py-2 px-2 font-semibold">Type</th>
                <th className="text-left py-2 px-2 font-semibold">Created</th>
                <th className="text-left py-2 px-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr
                  key={file.name}
                  className={`border-b border-black/10 dark:border-white/15 ${
                    index % 2 === 0 ? "bg-black/5 dark:bg-white/5" : ""
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{file.displayName}</span>
                      <span className="text-xs opacity-60 break-all">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="py-3 px-2">
                    <code className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">
                      {file.contentType}
                    </code>
                  </td>
                  <td className="py-3 px-2 text-xs whitespace-nowrap opacity-70">
                    {formatDate(file.created || file.updated)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 inline-block"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingName === file.name}
                        className="text-xs px-2 py-1 rounded-md border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 inline-block"
                      >
                        {deletingName === file.name ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

