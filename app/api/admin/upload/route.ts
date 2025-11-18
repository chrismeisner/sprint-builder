import { NextResponse } from "next/server";
import { uploadFile, getStorage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    // Check if GCS is configured
    if (!getStorage()) {
      return NextResponse.json(
        { 
          error: "Image upload is not configured. Please set GCS_PROJECT_ID, GCS_BUCKET_NAME, and GCS credentials." 
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to GCS
    const url = await uploadFile(buffer, file.name, file.type);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

