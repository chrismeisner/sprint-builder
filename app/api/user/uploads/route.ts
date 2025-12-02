import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteFile,
  getSignedFileUrl,
  listFiles,
  uploadFileWithPath,
} from "@/lib/storage";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 15 * 60;
const USER_UPLOAD_PREFIX = "user-uploads";

const EXPLICIT_ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);

const ALLOWED_TYPE_PREFIXES = ["image/"];

function isAllowedType(mime: string): boolean {
  if (!mime) return true;
  if (EXPLICIT_ALLOWED_TYPES.has(mime)) return true;
  return ALLOWED_TYPE_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

function getUserPrefix(accountId: string): string {
  return `${USER_UPLOAD_PREFIX}/${accountId}`;
}

function buildDisplayName(name: string, metadata?: Record<string, string>): string {
  if (metadata?.originalName) {
    return metadata.originalName;
  }
  const parts = name.split("/");
  return parts[parts.length - 1] || name;
}

async function ensureUser() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const prefix = getUserPrefix(user.accountId);
    const files = await listFiles(prefix);

    const filesWithSignedUrls = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        contentType: file.contentType,
        created: file.created,
        updated: file.updated,
        downloadUrl: await getSignedFileUrl(file.name, SIGNED_URL_TTL_SECONDS),
        displayName: buildDisplayName(file.name, file.metadata),
      }))
    );

    return NextResponse.json({
      success: true,
      files: filesWithSignedUrls,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Failed to load files",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    if (!isAllowedType(file.type)) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Images, PDFs, ZIPs, and plain text are accepted.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";

    const { objectPath } = await uploadFileWithPath(buffer, file.name, contentType, {
      prefix: getUserPrefix(user.accountId),
      makePublic: false,
      metadata: {
        originalName: file.name,
        uploaderId: user.accountId,
        uploaderEmail: user.email,
      },
    });

    const downloadUrl = await getSignedFileUrl(objectPath, SIGNED_URL_TTL_SECONDS);

    return NextResponse.json({
      success: true,
      file: {
        name: objectPath,
        size: file.size,
        contentType,
        downloadUrl,
        displayName: file.name,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Upload failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing file name" }, { status: 400 });
  }

  const decodedName = decodeURIComponent(name);
  const userPrefix = `${getUserPrefix(user.accountId)}/`;

  if (!decodedName.startsWith(userPrefix)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await deleteFile(decodedName);
    return NextResponse.json({
      success: true,
      message: "File deleted",
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

