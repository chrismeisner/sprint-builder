import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File must be JPEG, PNG, WebP, or GIF" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatar-${user.accountId}.${ext}`;

    const pool = getPool();

    // Delete old avatar from storage if it exists
    const existing = await pool.query(
      `SELECT profile_image_url FROM accounts WHERE id = $1`,
      [user.accountId]
    );
    const oldUrl = existing.rows[0]?.profile_image_url;
    if (oldUrl) {
      try {
        await deleteFile(oldUrl);
      } catch {
        // Old file may already be gone — not critical
      }
    }

    const publicUrl = await uploadFile(buffer, filename, file.type, {
      prefix: "avatars",
    });

    await pool.query(
      `UPDATE accounts SET profile_image_url = $1 WHERE id = $2`,
      [publicUrl, user.accountId]
    );

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pool = getPool();
    const existing = await pool.query(
      `SELECT profile_image_url FROM accounts WHERE id = $1`,
      [user.accountId]
    );
    const oldUrl = existing.rows[0]?.profile_image_url;

    if (oldUrl) {
      try {
        await deleteFile(oldUrl);
      } catch {
        // Not critical if cloud delete fails
      }
    }

    await pool.query(
      `UPDATE accounts SET profile_image_url = NULL WHERE id = $1`,
      [user.accountId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing avatar:", error);
    return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 });
  }
}
