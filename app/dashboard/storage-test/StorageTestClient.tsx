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
};

export default function StorageTestClient() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message?: string;
    url?: string;
    error?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/admin/storage-test?action=list");
      const data = await res.json();
      
      if (data.success && data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDeleteClick = (file: FileMetadata) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/storage-test?url=${encodeURIComponent(fileToDelete.url)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        // Remove file from local state
        setFiles((prev) => prev.filter((f) => f.url !== fileToDelete.url));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Google Cloud Storage Test</h1>
        <p className="text-sm opacity-70">
          Verify your GCS connection and test file uploads before using the project forms.
        </p>
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
          <h2 className="text-lg font-semibold mb-4">Test File Upload</h2>
          
          <div className="space-y-4">
            <div>
              <label className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 cursor-pointer">
                {uploading ? "Uploading..." : "Choose Image to Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleTestUpload(file);
                  }}
                />
              </label>
              <p className="text-xs opacity-60 mt-2">
                Upload a test image to verify everything works. Max 10MB.
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
                        <img
                          src={uploadResult.url}
                          alt="Uploaded test"
                          className="max-w-xs rounded border border-black/10 dark:border-white/15"
                        />
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

      {/* Uploaded Files Table */}
      {status?.success && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Uploaded Files</h2>
            <button
              onClick={fetchFiles}
              disabled={loadingFiles}
              className="text-sm px-3 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              {loadingFiles ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loadingFiles && (
            <div className="text-sm opacity-70">Loading files...</div>
          )}

          {!loadingFiles && files.length === 0 && (
            <div className="text-sm opacity-70 text-center py-8">
              No files uploaded yet. Upload a test file to see it here.
            </div>
          )}

          {!loadingFiles && files.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="text-left py-3 px-2 font-semibold">Name</th>
                    <th className="text-left py-3 px-2 font-semibold">Size</th>
                    <th className="text-left py-3 px-2 font-semibold">Type</th>
                    <th className="text-left py-3 px-2 font-semibold">Created</th>
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
                        <div className="flex items-center gap-2">
                          {file.contentType.startsWith("image/") && (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-10 h-10 object-cover rounded border border-black/10 dark:border-white/15"
                            />
                          )}
                          <span className="font-mono text-xs break-all">
                            {file.name}
                          </span>
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
                        {formatDate(file.created)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 inline-block"
                          >
                            View
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
                  {fileToDelete.contentType.startsWith("image/") && (
                    <img
                      src={fileToDelete.url}
                      alt={fileToDelete.name}
                      className="w-12 h-12 object-cover rounded border border-black/10 dark:border-white/15"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileToDelete.name}</p>
                    <p className="text-xs opacity-60">{formatFileSize(fileToDelete.size)}</p>
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

