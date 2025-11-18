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

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const storage = getStorage();
  if (!storage) {
    throw new Error("Google Cloud Storage is not configured");
  }

  const bucketName = getBucketName();
  const bucket = storage.bucket(bucketName);
  
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFilename = `projects/${timestamp}-${sanitizedFilename}`;
  
  const file = bucket.file(uniqueFilename);

  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  // Try to make file publicly readable (works if uniform bucket-level access is disabled)
  // If it fails, we'll use the public URL anyway and the bucket must be public
  try {
    await file.makePublic();
  } catch {
    // Uniform bucket-level access is enabled, file can't be made public individually
    // The bucket itself needs to be public, or we return the public URL which will work if bucket is public
    console.warn("[Storage] Could not make file public individually (uniform bucket-level access enabled)");
  }

  // Return public URL (will work if bucket is public)
  return `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
}

export async function deleteFile(url: string): Promise<void> {
  const storage = getStorage();
  if (!storage) {
    throw new Error("Google Cloud Storage is not configured");
  }

  const bucketName = getBucketName();
  const bucket = storage.bucket(bucketName);
  
  // Extract filename from URL
  const urlPattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
  const match = url.match(urlPattern);
  
  if (!match || !match[1]) {
    throw new Error("Invalid GCS URL");
  }

  const filename = match[1];
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
    size: parseInt(file.metadata.size || "0"),
    contentType: file.metadata.contentType || "unknown",
    created: file.metadata.timeCreated || "",
    updated: file.metadata.updated || "",
  }));
}

