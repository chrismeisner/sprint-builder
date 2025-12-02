"use client";

import { useState, useEffect } from "react";

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

export default function StorageTestClient() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message?: string;
    url?: string;
    error?: string;
    fileName?: string;
    fileSize?: number;
    contentType?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userFiles, setUserFiles] = useState<AdminStorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<AdminStorageFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
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
  };

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

  const fetchFiles = async () => {
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
  };

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

  const handleTestUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadResult({
        success: false,
        error: `File is too large. Please upload files up to ${MAX_FILE_SIZE_LABEL}.`,
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/storage-test", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadResult(data);
      
      // Refresh the file list after successful upload
      if (data.success) {
        fetchFiles();
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: `Upload failed: ${error}`,
      });
    } finally {
      setUploading(false);
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
      <span className={checked ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
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

  const uploadTypeBadgeClasses = (file: AdminStorageFile): string => {
    if (file.uploadSource === "user") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
    }
    if (file.uploadSource === "admin") {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200";
  };

  const renderUploadsTable = (
    files: AdminStorageFile[],
    { showDownloadNote = false }: { showDownloadNote?: boolean } = {}
  ) => (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/15">
              <th className="text-left py-3 px-2 font-semibold">File</th>
              <th className="text-left py-3 px-2 font-semibold">Owner</th>
              <th className="text-left py-3 px-2 font-semibold">Size</th>
              <th className="text-left py-3 px-2 font-semibold">Type</th>
              <th className="text-left py-3 px-2 font-semibold">Uploaded</th>
              <th className="text-left py-3 px-2 font-semibold">Actions</th>
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
                    {isImageContentType(file.contentType) && (
                      <img
                        src={file.signedUrl || file.url}
                        alt={file.displayName}
                        className="w-12 h-12 object-cover rounded border border-black/10 dark:border-white/15"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.displayName}</p>
                      <p className="font-mono text-[11px] opacity-60 break-all">{file.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-xs space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium break-all">{ownerLabel(file)}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${uploadTypeBadgeClasses(file)}`}
                      >
                        {file.sourceLabel}
                      </span>
                    </div>
                    {file.uploaderEmail && (file.uploaderId || file.parsedAccountId) && (
                      <p className="opacity-60 break-all">Account: {file.uploaderId || file.parsedAccountId}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 whitespace-nowrap">{formatFileSize(file.size)}</td>
                <td className="py-3 px-2">
                  <code className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">
                    {file.contentType}
                  </code>
                </td>
                <td className="py-3 px-2 text-xs whitespace-nowrap opacity-70">
                  {formatDate(file.created || file.updated)}
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={file.signedUrl || file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 inline-block"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDeleteClick(file)}
                      className="text-xs px-2 py-1 rounded-md border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 inline-block"
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
        <p className="text-xs opacity-60 mt-4">
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

  const isImageContentType = (type?: string | null) =>
    Boolean(type && type.startsWith("image/"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Upload System Admin View</h1>
        <p className="text-sm opacity-70">
          Monitor end-user uploads, audit storage usage, and run health checks on the Google Cloud
          Storage integration that powers the client dashboard.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6 bg-black/5 dark:bg-white/5">
        <h2 className="text-lg font-semibold mb-3">How the upload system works</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm opacity-80">
          <li>
            Every file a customer uploads from the logged-in dashboard is stored under{" "}
            <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{USER_UPLOAD_PREFIX}
              {"{accountId}"}
            </code>{" "}
            in GCS.
          </li>
          <li>
            Objects stay private by default; the dashboard generates short-lived signed URLs for the
            owner (and this admin view signs links on demand).
          </li>
          <li>
            This page also exposes health checks and a manual upload tool so the team can validate the
            pipeline end-to-end.
          </li>
        </ul>
      </div>

      {/* Connection Status */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Connection Status</h2>
          <button
            onClick={checkConnection}
            disabled={loading}
            className="text-sm px-3 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Refresh"}
          </button>
        </div>

        {loading && (
          <div className="text-sm opacity-70">Checking connection...</div>
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
            <div className="pt-4 border-t border-black/10 dark:border-white/15 space-y-1 text-sm">
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
              <div className="p-3 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm">
                {status.message}
              </div>
            )}

            {status.error && (
              <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm">
                <strong>Error:</strong> {status.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Test */}
      {status?.success && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <h2 className="text-lg font-semibold mb-4">Manual upload (admin)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 cursor-pointer">
                {uploading ? "Uploading..." : "Choose File to Upload"}
                <input
                  type="file"
                  accept="image/*,.pdf,.zip,.txt"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleTestUpload(file);
                  }}
                />
              </label>
              <p className="text-xs opacity-60 mt-2">
                Upload a test image, PDF, ZIP, or TXT (max {MAX_FILE_SIZE_LABEL}) to verify storage without using the client UI.
              </p>
            </div>

            {uploadResult && (
              <div
                className={`p-3 rounded-md text-sm ${
                  uploadResult.success
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                }`}
              >
                {uploadResult.success ? (
                  <div className="space-y-2">
                    <div><strong>{uploadResult.message}</strong></div>
                    {uploadResult.url && (
                      <div className="space-y-2">
                        <div className="break-all">
                          <strong>URL:</strong>{" "}
                          <a
                            href={uploadResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {uploadResult.url}
                          </a>
                        </div>
                        <div className="text-xs space-y-1 opacity-80">
                          {uploadResult.fileName && (
                            <div>
                              <strong>Name:</strong> {uploadResult.fileName}
                            </div>
                          )}
                          {uploadResult.fileSize !== undefined && (
                            <div>
                              <strong>Size:</strong> {formatFileSize(uploadResult.fileSize)}
                            </div>
                          )}
                          {uploadResult.contentType && (
                            <div>
                              <strong>Type:</strong> {uploadResult.contentType}
                            </div>
                          )}
                        </div>
                        {isImageContentType(uploadResult.contentType) && (
                          <img
                            src={uploadResult.url}
                            alt={uploadResult.fileName || "Uploaded test"}
                            className="max-w-xs rounded border border-black/10 dark:border-white/15"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <strong>Upload Failed:</strong> {uploadResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storage Insights */}
      {status?.success && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">Total files</p>
            <p className="text-2xl font-semibold mt-2">{userFiles.length.toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-1">All user and admin storage test uploads</p>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">Storage used</p>
            <p className="text-2xl font-semibold mt-2">{formatFileSize(totalStorageUsed)}</p>
            <p className="text-xs opacity-60 mt-1">Across {uniqueOwners.size.toLocaleString()} uploaders</p>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">Latest upload</p>
            <p className="text-lg font-semibold mt-2">{latestUploadLabel}</p>
            <p className="text-xs opacity-60 mt-1">Refresh to pull the newest data</p>
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      {status?.success && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent uploads</h2>
            <button
              onClick={fetchFiles}
              disabled={loadingFiles}
              className="text-sm px-3 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              {loadingFiles ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {recentUploads.length === 0 ? (
            <div className="text-sm opacity-70">No uploads yet.</div>
          ) : (
            renderUploadsTable(recentUploads)
          )}
        </div>
      )}

      {/* All User Uploads */}
      {status?.success && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">All uploads</h2>
              <p className="text-sm opacity-70">
                Includes dashboard uploads under{" "}
                <code className="bg-black/10 dark:bg-white/10 px-1 rounded">
                  {USER_UPLOAD_PREFIX}
                  {"{accountId}"}
                </code>{" "}
                and admin storage test files under{" "}
                <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{ADMIN_UPLOAD_PREFIX}</code>.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, path, email, or source"
                className="text-sm rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/30"
              />
              <button
                onClick={fetchFiles}
                disabled={loadingFiles}
                className="text-sm px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
              >
                {loadingFiles ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {loadingFiles ? (
            <div className="text-sm opacity-70 mt-4">Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-sm opacity-70 text-center py-8">
              {normalizedSearch ? "No files match your filters." : "No uploads yet."}
            </div>
          ) : (
            renderUploadsTable(filteredFiles, { showDownloadNote: true })
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-3">Need Help?</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong className="block mb-1">Missing environment variables?</strong>
            <p className="opacity-80">
              Make sure your <code className="bg-black/10 dark:bg-white/10 px-1 rounded">.env.local</code> file has:
            </p>
            <ul className="list-disc pl-5 mt-1 opacity-80 space-y-1">
              <li><code>GCS_PROJECT_ID</code></li>
              <li><code>GCS_BUCKET_NAME</code></li>
              <li><code>GCS_CREDENTIALS_JSON</code> (or <code>GOOGLE_APPLICATION_CREDENTIALS</code>)</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-1">Bucket not accessible?</strong>
            <p className="opacity-80">
              Check that your service account has the <strong>Storage Object Admin</strong> role.
            </p>
          </div>

          <div>
            <strong className="block mb-1">Need setup instructions?</strong>
            <p className="opacity-80">
              See the full guide in <code className="bg-black/10 dark:bg-white/10 px-1 rounded">README.md</code> or{" "}
              <code className="bg-black/10 dark:bg-white/10 px-1 rounded">ENV_TEMPLATE.md</code>
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Confirm Delete</h3>
            <p className="text-sm opacity-80 mb-4">
              Are you sure you want to delete this file?
            </p>
            {fileToDelete && (
              <div className="mb-6 p-3 rounded-md bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  {isImageContentType(fileToDelete.contentType) && (
                    <img
                      src={fileToDelete.signedUrl || fileToDelete.url}
                      alt={fileToDelete.displayName}
                      className="w-12 h-12 object-cover rounded border border-black/10 dark:border-white/15"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileToDelete.displayName}</p>
                    <p className="text-xs opacity-60 truncate">{ownerLabel(fileToDelete)}</p>
                    <p className="text-xs opacity-60 break-all">{fileToDelete.name}</p>
                    <p className="text-xs opacity-60 mt-1">{formatFileSize(fileToDelete.size)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
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

