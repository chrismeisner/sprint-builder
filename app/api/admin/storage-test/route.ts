import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getStorage,
  getBucketName,
  uploadFileWithPath,
  listFiles,
  deleteFile,
  getSignedFileUrl,
} from "@/lib/storage";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ADMIN_UPLOAD_PREFIX = "admin-uploads";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // If action is "list", return the list of files
  if (action === "list") {
    try {
      const storage = getStorage();
      if (!storage) {
        return NextResponse.json(
          { error: "Google Cloud Storage is not configured" },
          { status: 503 }
        );
      }

      const prefixParam = searchParams.get("prefix");
      const includeSigned = searchParams.get("includeSignedUrls") === "true";

      let files = await listFiles(prefixParam || undefined);

      if (includeSigned) {
        files = await Promise.all(
          files.map(async (file) => {
            try {
              const signedUrl = await getSignedFileUrl(file.name);
              return { ...file, signedUrl };
            } catch (error) {
              console.warn(`[StorageTest] Failed to sign URL for ${file.name}:`, error);
              return file;
            }
          })
        );
      }

      return NextResponse.json({ success: true, files });
    } catch (error: unknown) {
      return NextResponse.json(
        {
          success: false,
          error: (error as Error).message ?? "Failed to list files",
        },
        { status: 500 }
      );
    }
  }

  // Default behavior: check connection status
  try {
    const checks = {
      configPresent: false,
      storageInitialized: false,
      bucketAccessible: false,
      projectId: process.env.GCS_PROJECT_ID || null,
      bucketName: process.env.GCS_BUCKET_NAME || null,
      credentialsPresent: false,
      error: null as string | null,
    };

    // Check if config is present
    checks.configPresent = !!(process.env.GCS_PROJECT_ID && process.env.GCS_BUCKET_NAME);
    checks.credentialsPresent = !!(process.env.GCS_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);

    if (!checks.configPresent) {
      checks.error = "GCS_PROJECT_ID or GCS_BUCKET_NAME not set in environment variables";
      return NextResponse.json(checks);
    }

    if (!checks.credentialsPresent) {
      checks.error = "GCS credentials not set (need GCS_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS)";
      return NextResponse.json(checks);
    }

    // Check if storage can be initialized
    const storage = getStorage();
    if (!storage) {
      checks.error = "Failed to initialize Google Cloud Storage client";
      return NextResponse.json(checks);
    }
    checks.storageInitialized = true;

    // Check if bucket is accessible
    const bucketName = getBucketName();
    const bucket = storage.bucket(bucketName);
    
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        checks.error = `Bucket '${bucketName}' does not exist or is not accessible`;
        return NextResponse.json(checks);
      }
      checks.bucketAccessible = true;

      // Try to get bucket metadata
      await bucket.getMetadata();
      
    } catch (error: unknown) {
      checks.error = `Bucket access failed: ${(error as Error).message}`;
      return NextResponse.json(checks);
    }

    return NextResponse.json({
      ...checks,
      success: true,
      message: "✅ Google Cloud Storage is properly configured and accessible!",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Unknown error",
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const storage = getStorage();
    if (!storage) {
      return NextResponse.json(
        { error: "Google Cloud Storage is not configured" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "File is too large. Maximum size is 50MB.",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = file.type || "application/octet-stream";
    const currentUser = await getCurrentUser();
    const metadata: Record<string, string> = {
      originalName: file.name,
      uploadSource: "admin",
      uploadSourceLabel: "Admin upload",
    };

    if (currentUser?.email) {
      metadata.uploaderEmail = currentUser.email;
    }
    if (currentUser?.accountId) {
      metadata.uploaderId = currentUser.accountId;
    }

    const { publicUrl, objectPath } = await uploadFileWithPath(buffer, file.name, contentType, {
      prefix: ADMIN_UPLOAD_PREFIX,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: "✅ File uploaded successfully!",
      url: publicUrl,
      objectPath,
      fileSize: file.size,
      fileName: file.name,
      contentType,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Upload test failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const storage = getStorage();
    if (!storage) {
      return NextResponse.json(
        { error: "Google Cloud Storage is not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const fileName = searchParams.get("name");

    if (!fileUrl && !fileName) {
      return NextResponse.json({ error: "No file identifier provided" }, { status: 400 });
    }

    const identifier = fileName || fileUrl!;

    // Delete the file
    await deleteFile(identifier);

    return NextResponse.json({
      success: true,
      message: "✅ File deleted successfully!",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Delete failed",
      },
      { status: 500 }
    );
  }
}

