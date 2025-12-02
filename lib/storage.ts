import { Storage } from "@google-cloud/storage";

let storage: Storage | null = null;

export function getStorage(): Storage | null {
  // Return null if GCS is not configured (allows graceful degradation)
  const projectId = process.env.GCS_PROJECT_ID;
  const bucketName = process.env.GCS_BUCKET_NAME;
  
  if (!projectId || !bucketName) {
    console.warn("[Storage] GCS not configured. Image uploads will be disabled.");
    return null;
  }

  if (!storage) {
    // Two authentication options:
    // 1. Use GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
    // 2. Use GCS_CREDENTIALS_JSON env var with inline JSON credentials
    const credentialsJson = process.env.GCS_CREDENTIALS_JSON;
    
    if (credentialsJson) {
      try {
        const credentials = JSON.parse(credentialsJson);
        storage = new Storage({
          projectId,
          credentials,
        });
      } catch (error) {
        console.error("[Storage] Failed to parse GCS_CREDENTIALS_JSON:", error);
        return null;
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use the standard GOOGLE_APPLICATION_CREDENTIALS file path
      storage = new Storage({ projectId });
    } else {
      console.warn("[Storage] No GCS credentials found. Set GCS_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS");
      return null;
    }
  }

  return storage;
}

export function getBucketName(): string {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME environment variable is not set");
  }
  return bucketName;
}

type UploadFileOptions = {
  prefix?: string;
  makePublic?: boolean;
  metadata?: Record<string, string>;
};

type UploadResult = {
  objectPath: string;
  publicUrl: string;
};

function normalizePrefix(prefix?: string | null): string {
  if (!prefix) return "projects";
  return prefix.replace(/^\/+/, "").replace(/\/+$/, "") || "projects";
}

async function saveBufferToBucket(
  buffer: Buffer,
  filename: string,
  contentType: string,
  options?: UploadFileOptions
): Promise<UploadResult> {
  const storage = getStorage();
  if (!storage) {
    throw new Error("Google Cloud Storage is not configured");
  }

  const bucketName = getBucketName();
  const bucket = storage.bucket(bucketName);

  const prefix = normalizePrefix(options?.prefix);

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFilename = `${prefix}/${timestamp}-${sanitizedFilename}`;

  const file = bucket.file(uniqueFilename);

  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: "public, max-age=31536000",
      ...options?.metadata,
    },
  });

  // Try to make file publicly readable unless explicitly disabled
  if (options?.makePublic !== false) {
    try {
      await file.makePublic();
    } catch {
      console.warn("[Storage] Could not make file public individually (uniform bucket-level access enabled)");
    }
  }

  return {
    objectPath: uniqueFilename,
    publicUrl: `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`,
  };
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  options?: UploadFileOptions
): Promise<string> {
  const { publicUrl } = await saveBufferToBucket(buffer, filename, contentType, options);
  return publicUrl;
}

export async function uploadFileWithPath(
  buffer: Buffer,
  filename: string,
  contentType: string,
  options?: UploadFileOptions
): Promise<UploadResult> {
  return saveBufferToBucket(buffer, filename, contentType, options);
}

function extractFilenameFromIdentifier(identifier: string, bucketName: string): string {
  if (!identifier) {
    throw new Error("Missing file identifier");
  }

  if (identifier.startsWith(`https://`)) {
    const urlPattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
    const match = identifier.match(urlPattern);
    if (!match || !match[1]) {
      throw new Error("Invalid GCS URL");
    }
    return match[1];
  }

  return identifier.replace(/^\/+/, "");
}

export async function deleteFile(identifier: string): Promise<void> {
  const storage = getStorage();
  if (!storage) {
    throw new Error("Google Cloud Storage is not configured");
  }

  const bucketName = getBucketName();
  const bucket = storage.bucket(bucketName);

  const filename = extractFilenameFromIdentifier(identifier, bucketName);
  const file = bucket.file(filename);

  await file.delete();
}

export interface FileMetadata {
  name: string;
  url: string;
  size: number;
  contentType: string;
  created: string;
  updated: string;
  metadata?: Record<string, string>;
}

export async function listFiles(prefix?: string): Promise<FileMetadata[]> {
  const storage = getStorage();
  if (!storage) {
    throw new Error("Google Cloud Storage is not configured");
  }

  const bucketName = getBucketName();
  const bucket = storage.bucket(bucketName);
  
  const [files] = await bucket.getFiles({
    prefix: prefix || undefined,
  });

  return files.map(file => ({
    name: file.name,
    url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
    size: parseInt(String(file.metadata.size || "0")),
    contentType: file.metadata.contentType || "unknown",
    created: file.metadata.timeCreated || "",
    updated: file.metadata.updated || "",
    metadata: (file.metadata.metadata ?? undefined) as Record<string, string> | undefined,
  }));
}

export async function getSignedFileUrl(
  objectPath: string,
  expiresInSeconds = 10 * 60
): Promise<string> {
  const storage = getStorage();
  if (!storage) {
    throw new Error("Google Cloud Storage is not configured");
  }

  const bucketName = getBucketName();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectPath);

  const [url] = await file.getSignedUrl({
    action: "read",
    version: "v4",
    expires: Date.now() + expiresInSeconds * 1000,
  });

  return url;
}

