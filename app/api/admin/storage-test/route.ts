import { NextResponse } from "next/server";
import { getStorage, getBucketName, uploadFile, listFiles } from "@/lib/storage";

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

      const files = await listFiles();
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload test file
    const url = await uploadFile(buffer, `test-${file.name}`, file.type);

    return NextResponse.json({
      success: true,
      message: "✅ Test file uploaded successfully!",
      url,
      fileSize: file.size,
      fileName: file.name,
      contentType: file.type,
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

