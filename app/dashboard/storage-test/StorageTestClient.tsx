"use client";

import { useState, useEffect, useCallback } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type ConnectionStatus = {
  configPresent: boolean;
  storageInitialized: boolean;
  bucketAccessible: boolean;
  projectId: string | null;
  bucketName: string | null;
  credentialsPresent: boolean;
  error: string | null;
  success?: boolean;
  message?: string;
};

type FileMetadata = {
  name: string;
  url: string;
  size: number;
  contentType: string;
  created: string;
  updated: string;
  metadata?: Record<string, string>;
  signedUrl?: string;
};

type AdminStorageFile = FileMetadata & {
  displayName: string;
  uploaderEmail?: string;
  uploaderId?: string;
  isUserUpload: boolean;
  isAdminUpload: boolean;
  baseName: string;
  parsedAccountId?: string;
  uploadSource: "user" | "admin" | "unknown";
  sourceLabel: string;
};

const USER_UPLOAD_PREFIX = "user-uploads/";
const ADMIN_UPLOAD_PREFIX = "admin-uploads/";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "50MB";

type UploadTaskStatus = "pending" | "uploading" | "success" | "error";

type UploadTask = {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  status: UploadTaskStatus;
  message?: string;
  url?: string;
  error?: string;
};

export default function StorageTestClient() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [userFiles, setUserFiles] = useState<AdminStorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<AdminStorageFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const generateUploadId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const updateUploadTask = (id: string, patch: Partial<UploadTask>) => {
    setUploadQueue((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  };

  const uploadStatusLabel = (status: UploadTaskStatus) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "uploading":
        return "Uploading";
      case "success":
        return "Uploaded";
      case "error":
        return "Failed";
      default:
        return status;
    }
  };

  const uploadStatusClasses = (status: UploadTaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-200";
      case "uploading":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-200";
    }
  };

  const handleCopyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath((prev) => (prev === path ? null : prev)), 1500);
    } catch (error) {
      alert(`Failed to copy: ${error}`);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl((prev) => (prev === url ? null : prev)), 1500);
    } catch (error) {
      alert(`Failed to copy: ${error}`);
    }
  };

  const enhanceFileRecord = (file: FileMetadata): AdminStorageFile => {
    const metadata = file.metadata ?? {};
    const baseName = file.name.split("/").pop() || file.name;
    const displayName = metadata.originalName || baseName;
    const uploaderEmail = metadata.uploaderEmail || metadata.uploader;
    const isUserUpload = file.name.startsWith(USER_UPLOAD_PREFIX);
    const isAdminUpload =
      file.name.startsWith(ADMIN_UPLOAD_PREFIX) || metadata.uploadSource === "admin";

    let parsedAccountId: string | undefined;
    if (isUserUpload) {
      const remainder = file.name.slice(USER_UPLOAD_PREFIX.length);
      parsedAccountId = remainder.split("/")[0] || undefined;
    }

    const resolvedUploaderId = metadata.uploaderId || parsedAccountId;
    const uploadSource =
      metadata.uploadSource === "user"
        ? "user"
        : metadata.uploadSource === "admin"
          ? "admin"
          : isUserUpload
            ? "user"
            : isAdminUpload
              ? "admin"
              : "unknown";
    const sourceLabel =
      metadata.uploadSourceLabel ||
      (uploadSource === "user" ? "User upload" : uploadSource === "admin" ? "Admin upload" : "Other upload");

    return {
      ...file,
      metadata,
      displayName,
      uploaderEmail,
      uploaderId: resolvedUploaderId,
      isUserUpload,
      isAdminUpload,
      baseName,
      parsedAccountId,
      uploadSource,
      sourceLabel,
    };
  };

  const checkConnection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/storage-test");
      const data = await res.json();
      setStatus(data);
      
      // If connection is successful, also fetch the files
      if (data.success) {
        fetchFiles();
      }
    } catch (error) {
      setStatus({
        configPresent: false,
        storageInitialized: false,
        bucketAccessible: false,
        projectId: null,
        bucketName: null,
        credentialsPresent: false,
        error: `Failed to check connection: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const fetchFilesForPrefix = async (prefix?: string): Promise<AdminStorageFile[]> => {
    const params = new URLSearchParams({
      action: "list",
      includeSignedUrls: "true",
    });

    if (prefix) {
      params.set("prefix", prefix);
    }

    const res = await fetch(`/api/admin/storage-test?${params.toString()}`);
    const data = await res.json();

    if (data.success && data.files) {
      return (data.files as FileMetadata[]).map((file) => enhanceFileRecord(file));
    }

    return [];
  };

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const [userUploads, adminUploads] = await Promise.all([
        fetchFilesForPrefix(USER_UPLOAD_PREFIX),
        fetchFilesForPrefix(ADMIN_UPLOAD_PREFIX),
      ]);

      const merged = new Map<string, AdminStorageFile>();
      [...userUploads, ...adminUploads].forEach((file) => merged.set(file.name, file));
      setUserFiles(Array.from(merged.values()));
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoadingFiles(false);
    }
  }, [fetchFilesForPrefix]);

  const handleDeleteClick = (file: AdminStorageFile) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      const identifierParam = fileToDelete.name
        ? `name=${encodeURIComponent(fileToDelete.name)}`
        : `url=${encodeURIComponent(fileToDelete.url)}`;

      const res = await fetch(`/api/admin/storage-test?${identifierParam}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        // Remove file from local state
        setUserFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
        setDeleteModalOpen(false);
        setFileToDelete(null);
      } else {
        alert(`Delete failed: ${data.error}`);
      }
    } catch (error) {
      alert(`Delete failed: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setFileToDelete(null);
  };

  const uploadSingleFile = async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/storage-test", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
    return { data, ok: res.ok };
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const newTasks: UploadTask[] = files.map((file) => ({
      id: generateUploadId(),
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || "application/octet-stream",
      status: "pending",
    }));
      
    // Add new tasks to the top of the queue
    setUploadQueue((prev) => [...newTasks, ...prev]);
    setUploading(true);

    let anySuccess = false;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const task = newTasks[i];

        if (file.size > MAX_FILE_SIZE_BYTES) {
          updateUploadTask(task.id, {
            status: "error",
            error: `File is too large. Please upload files up to ${MAX_FILE_SIZE_LABEL}.`,
          });
          continue;
        }

        updateUploadTask(task.id, {
          status: "uploading",
          error: undefined,
          message: undefined,
        });

        try {
          const { data } = await uploadSingleFile(file);

          if (data?.success) {
            anySuccess = true;
            updateUploadTask(task.id, {
              status: "success",
              message: data.message || "Uploaded",
              url: data.url,
              fileSize: file.size,
              contentType: data.contentType || file.type || "application/octet-stream",
            });
          } else {
            updateUploadTask(task.id, {
              status: "error",
              error: data?.error || "Upload failed",
            });
      }
    } catch (error) {
          updateUploadTask(task.id, {
            status: "error",
        error: `Upload failed: ${error}`,
      });
        }
      }
    } finally {
      setUploading(false);
      if (anySuccess) {
        fetchFiles();
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const StatusIndicator = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${checked ? "bg-green-500" : "bg-red-500"}`} />
      <span
        className={`${getTypographyClassName("body-sm")} ${
          checked ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
        }`}
      >
        {label}
      </span>
    </div>
  );

  const ownerLabel = (file: AdminStorageFile): string => {
    if (file.uploaderEmail) return file.uploaderEmail;
    if (file.uploaderId) return file.uploaderId;
    if (file.parsedAccountId) return file.parsedAccountId;
    if (file.isAdminUpload) return file.sourceLabel;
    return "Unknown uploader";
  };

  const renderUploadsTable = (
    files: AdminStorageFile[],
    { showDownloadNote = false }: { showDownloadNote?: boolean } = {}
  ) => (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className={`w-full ${getTypographyClassName("body-sm")}`}>
          <thead>
            <tr className="border-b border-black/10 dark:border-white/15">
              <th className={`${getTypographyClassName("body-sm")} text-left py-3 px-2 font-semibold md:w-56`}>File</th>
              <th className={`${getTypographyClassName("body-sm")} text-left py-3 px-2 font-semibold`}>Owner</th>
              <th className={`${getTypographyClassName("body-sm")} text-left py-3 px-2 font-semibold`}>Size</th>
              <th className={`${getTypographyClassName("body-sm")} text-left py-3 px-2 font-semibold`}>Type</th>
              <th className={`${getTypographyClassName("body-sm")} text-left py-3 px-2 font-semibold`}>Uploaded</th>
              <th className={`${getTypographyClassName("body-sm")} text-left py-3 px-2 font-semibold`}>Actions</th>
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
                  <div className="flex items-center gap-3">
                    {isImageContentType(file.contentType, file.name) && (
                      <img
                        src={file.signedUrl || file.url}
                        alt={file.displayName}
                        className="w-12 h-12 object-cover rounded border border-black/10 dark:border-white/15"
                      />
                    )}
                    <div className="min-w-0">
                      <p className={`${getTypographyClassName("body-md")} font-medium truncate`}>{file.displayName}</p>
                      <p className={`${getTypographyClassName("mono-sm")} opacity-60 break-all`}>{file.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <p className={`${getTypographyClassName("body-sm")} font-medium break-all`}>
                    {ownerLabel(file) || file.sourceLabel || "Unknown uploader"}
                  </p>
                </td>
                <td className="py-3 px-2 whitespace-nowrap">
                  <span className={getTypographyClassName("body-sm")}>{formatFileSize(file.size)}</span>
                </td>
                <td className="py-3 px-2">
                  <code className={`${getTypographyClassName("mono-sm")} bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded`}>
                    {file.contentType}
                  </code>
                </td>
                <td className="py-3 px-2 whitespace-nowrap opacity-70">
                  <span className={getTypographyClassName("body-sm")}>{formatDate(file.created || file.updated)}</span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopyPath(file.name)}
                      className={`${getTypographyClassName("body-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 inline-block`}
                    >
                      {copiedPath === file.name ? "Copied!" : "Copy path"}
                    </button>
                    <button
                      onClick={() => handleCopyUrl(file.signedUrl || file.url)}
                      className={`${getTypographyClassName("body-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 inline-block`}
                    >
                      {copiedUrl === (file.signedUrl || file.url) ? "Copied!" : "Copy URL"}
                    </button>
                    <a
                      href={file.signedUrl || file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${getTypographyClassName("body-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 inline-block`}
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDeleteClick(file)}
                      className={`${getTypographyClassName("body-sm")} px-2 py-1 rounded-md border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 inline-block`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showDownloadNote && (
        <p className={`${getTypographyClassName("body-sm")} opacity-60 mt-4`}>
          Download links expire after ~15 minutes. Refresh the table to generate new signed URLs.
        </p>
      )}
    </>
  );

  const totalStorageUsed = userFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const uniqueOwners = new Set(
    userFiles.map(
      (file) =>
        file.uploaderEmail || file.uploaderId || file.parsedAccountId || file.sourceLabel || file.name
    )
  );
  const latestUploadTimestamp = userFiles.reduce((latest, file) => {
    const candidate = file.created || file.updated;
    if (!candidate) return latest;
    const time = new Date(candidate).getTime();
    return Number.isNaN(time) ? latest : Math.max(latest, time);
  }, 0);
  const latestUploadLabel =
    latestUploadTimestamp > 0
      ? formatDate(new Date(latestUploadTimestamp).toISOString())
      : "N/A";

  const recentUploads = [...userFiles]
    .sort((a, b) => {
      const aTime = new Date(a.created || a.updated || 0).getTime();
      const bTime = new Date(b.created || b.updated || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredFiles = userFiles.filter((file) => {
    if (!normalizedSearch) return true;
    const haystack = `${file.displayName} ${file.name} ${file.uploaderEmail ?? ""} ${
      file.uploaderId ?? ""
    } ${file.parsedAccountId ?? ""} ${file.sourceLabel ?? ""}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const isImageContentType = (type?: string | null, name?: string) => {
    if (type && type.startsWith("image/")) return true;
    if (!name) return false;
    const lower = name.toLowerCase();
    const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".bmp", ".tif", ".tiff", ".heic", ".heif"];
    return imageExts.some((ext) => lower.endsWith(ext));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className={getTypographyClassName("h2")}>Upload System Admin View</h1>
        <p className={`${getTypographyClassName("body-md")} opacity-80`}>
          Monitor end-user uploads, audit storage usage, and run health checks on the Google Cloud
          Storage integration that powers the client dashboard.
        </p>
      </div>

      {/* Upload Test */}
      {status?.success && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className={getTypographyClassName("h3")}>Admin uploads</h2>
              <p className={`${getTypographyClassName("body-md")} opacity-80`}>
                Select one or more files to upload directly to storage for troubleshooting or admin-side delivery.
              </p>
              <p className={`${getTypographyClassName("body-sm")} opacity-70`}>
                Files are stored under <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{ADMIN_UPLOAD_PREFIX}</code> with timestamped names, so you can reuse them as site content later.
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className={`inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 font-medium hover:opacity-90 cursor-pointer ${getTypographyClassName("body-sm")}`}>
            {uploading ? "Uploading..." : "Choose files to upload"}
                <input
                  type="file"
                  multiple
                  accept="image/*,.svg,.webp,.avif,.heic,.heif,.bmp,.tif,.tiff,.png,.jpg,.jpeg,.gif,.pdf,.zip,.txt"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    handleFilesSelected(e.target.files);
                    if (e.target) e.target.value = "";
                  }}
                />
              </label>
              <p className={`${getTypographyClassName("body-sm")} opacity-70`}>
                Up to {MAX_FILE_SIZE_LABEL} per file. All image types (PNG, JPG, GIF, WEBP, AVIF, HEIC/HEIF, SVG, BMP, TIFF) plus PDF, ZIP, TXT.
              </p>
            </div>

            {uploadQueue.length > 0 && (
              <div className="space-y-3">
                <p className={`${getTypographyClassName("body-sm")} uppercase tracking-wide opacity-60`}>Upload queue</p>
                <div className="space-y-3">
                  {uploadQueue.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`${getTypographyClassName("body-md")} font-semibold truncate`}>{task.fileName}</p>
                          <p className={`${getTypographyClassName("body-sm")} opacity-70`}>
                            {formatFileSize(task.fileSize)} · {task.contentType}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-semibold ${uploadStatusClasses(task.status)}`}
                        >
                          {uploadStatusLabel(task.status)}
                        </span>
                      </div>
                      {task.message && (
                        <p className={`${getTypographyClassName("body-sm")} text-green-700 dark:text-green-300`}>{task.message}</p>
                      )}
                      {task.error && (
                        <p className={`${getTypographyClassName("body-sm")} text-red-700 dark:text-red-300`}>{task.error}</p>
                      )}
                      {task.status === "success" && task.url && (
                        <div className={`flex flex-wrap items-center gap-3 ${getTypographyClassName("body-sm")}`}>
                          <a
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Open link
                          </a>
                          {isImageContentType(task.contentType, task.fileName) && (
                            <img
                              src={task.url}
                              alt={task.fileName}
                              className="w-16 h-16 object-cover rounded border border-black/10 dark:border-white/15"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storage Insights */}
      {status?.success && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <p className={`${getTypographyClassName("body-sm")} uppercase tracking-wide opacity-60`}>Total files</p>
            <p className={`${getTypographyClassName("h3")} mt-2`}>{userFiles.length.toLocaleString()}</p>
            <p className={`${getTypographyClassName("body-sm")} opacity-70 mt-1`}>All user and admin storage test uploads</p>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <p className={`${getTypographyClassName("body-sm")} uppercase tracking-wide opacity-60`}>Storage used</p>
            <p className={`${getTypographyClassName("h3")} mt-2`}>{formatFileSize(totalStorageUsed)}</p>
            <p className={`${getTypographyClassName("body-sm")} opacity-70 mt-1`}>Across {uniqueOwners.size.toLocaleString()} uploaders</p>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <p className={`${getTypographyClassName("body-sm")} uppercase tracking-wide opacity-60`}>Latest upload</p>
            <p className={`${getTypographyClassName("subtitle-md")} mt-2`}>{latestUploadLabel}</p>
            <p className={`${getTypographyClassName("body-sm")} opacity-70 mt-1`}>Refresh to pull the newest data</p>
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      {status?.success && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className={getTypographyClassName("h3")}>Recent uploads</h2>
            <button
              onClick={fetchFiles}
              disabled={loadingFiles}
              className={`${getTypographyClassName("body-sm")} px-3 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50`}
            >
              {loadingFiles ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {recentUploads.length === 0 ? (
            <div className={`${getTypographyClassName("body-sm")} opacity-70`}>No uploads yet.</div>
          ) : (
            renderUploadsTable(recentUploads)
          )}
        </div>
      )}

      {/* All User Uploads */}
      {status?.success && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className={getTypographyClassName("h3")}>All uploads</h2>
              <p className={`${getTypographyClassName("body-md")} opacity-80`}>
                Includes dashboard uploads under{" "}
                <code className="bg-black/10 dark:bg-white/10 px-1 rounded">
                  {USER_UPLOAD_PREFIX}
                  {"{accountId}"}
                </code>{" "}
                and admin uploads under{" "}
                <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{ADMIN_UPLOAD_PREFIX}</code>.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, path, email, or source"
                className={`${getTypographyClassName("body-sm")} rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/30`}
              />
              <button
                onClick={fetchFiles}
                disabled={loadingFiles}
                className={`${getTypographyClassName("body-sm")} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50`}
              >
                {loadingFiles ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {loadingFiles ? (
            <div className={`${getTypographyClassName("body-sm")} opacity-70 mt-4`}>Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className={`${getTypographyClassName("body-sm")} opacity-70 text-center py-8`}>
              {normalizedSearch ? "No files match your filters." : "No uploads yet."}
            </div>
          ) : (
            renderUploadsTable(filteredFiles, { showDownloadNote: true })
          )}
        </div>
      )}

      {/* How it works */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6 bg-black/5 dark:bg-white/5">
        <h2 className={`${getTypographyClassName("h3")} mb-3`}>How the upload system works</h2>
        <ul className={`list-disc pl-5 space-y-2 ${getTypographyClassName("body-md")} opacity-80`}>
          <li className={getTypographyClassName("body-md")}>
            Every file a customer uploads from the logged-in dashboard is stored under{" "}
            <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{USER_UPLOAD_PREFIX}
              {"{accountId}"}
            </code>{" "}
            in GCS.
          </li>
          <li className={getTypographyClassName("body-md")}>
            Objects stay private by default; the dashboard generates short-lived signed URLs for the
            owner (and this admin view signs links on demand).
          </li>
          <li className={getTypographyClassName("body-md")}>
            This page also exposes health checks and a manual upload tool so the team can validate the
            pipeline end-to-end.
          </li>
        </ul>
      </div>

      {/* Connection Status */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={getTypographyClassName("h3")}>Connection Status</h2>
          <button
            onClick={checkConnection}
            disabled={loading}
            className={`${getTypographyClassName("body-sm")} px-3 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50`}
          >
            {loading ? "Checking..." : "Refresh"}
          </button>
        </div>

        {loading && (
          <div className={`${getTypographyClassName("body-sm")} opacity-70`}>Checking connection...</div>
        )}

        {!loading && status && (
          <div className="space-y-4">
            {/* Status Indicators */}
            <div className="space-y-2">
              <StatusIndicator
                checked={status.configPresent}
                label={status.configPresent ? "Environment variables present" : "Missing environment variables"}
              />
              <StatusIndicator
                checked={status.credentialsPresent}
                label={status.credentialsPresent ? "Credentials configured" : "Missing credentials"}
              />
              <StatusIndicator
                checked={status.storageInitialized}
                label={status.storageInitialized ? "Storage client initialized" : "Storage client failed"}
              />
              <StatusIndicator
                checked={status.bucketAccessible}
                label={status.bucketAccessible ? "Bucket accessible" : "Bucket not accessible"}
              />
            </div>

            {/* Configuration Details */}
            <div className={`pt-4 border-t border-black/10 dark:border-white/15 space-y-1 ${getTypographyClassName("body-sm")}`}>
              <div>
                <span className="opacity-70">Project ID:</span>{" "}
                <code className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                  {status.projectId || "Not set"}
                </code>
              </div>
              <div>
                <span className="opacity-70">Bucket Name:</span>{" "}
                <code className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                  {status.bucketName || "Not set"}
                </code>
              </div>
            </div>

            {/* Success/Error Message */}
            {status.success && (
              <div className={`p-3 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ${getTypographyClassName("body-sm")}`}>
                {status.message}
              </div>
            )}

            {status.error && (
              <div className={`p-3 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ${getTypographyClassName("body-sm")}`}>
                <strong>Error:</strong> {status.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className={`${getTypographyClassName("h3")} mb-3`}>Confirm Delete</h3>
            <p className={`${getTypographyClassName("body-md")} opacity-80 mb-4`}>
              Are you sure you want to delete this file?
            </p>
            {fileToDelete && (
              <div className="mb-6 p-3 rounded-md bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  {isImageContentType(fileToDelete.contentType, fileToDelete.name) && (
                    <img
                      src={fileToDelete.signedUrl || fileToDelete.url}
                      alt={fileToDelete.displayName}
                      className="w-12 h-12 object-cover rounded border border-black/10 dark:border-white/15"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`${getTypographyClassName("body-md")} font-medium truncate`}>{fileToDelete.displayName}</p>
                    <p className={`${getTypographyClassName("body-sm")} opacity-60 truncate`}>{ownerLabel(fileToDelete)}</p>
                    <p className={`${getTypographyClassName("mono-sm")} opacity-60 break-all`}>{fileToDelete.name}</p>
                    <p className={`${getTypographyClassName("body-sm")} opacity-60 mt-1`}>{formatFileSize(fileToDelete.size)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className={`${getTypographyClassName("body-sm")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className={`${getTypographyClassName("body-sm")} px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50`}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

