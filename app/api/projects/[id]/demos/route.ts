import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFileWithPath, deleteFile } from "@/lib/storage";

type Params = { params: { id: string } };

// Video file types we accept
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-m4v",
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function GET(_req: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const pool = getPool();
    
    // Check project access
    const projectCheck = await pool.query(
      `SELECT account_id FROM projects WHERE id = $1`,
      [params.id]
    );
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    
    const projectAccountId = (projectCheck.rows[0] as { account_id: string | null }).account_id;
    const isOwner = projectAccountId === user.accountId;
    const isAdmin = Boolean(user.isAdmin);
    const membershipRes = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
      [params.id, user.email]
    );
    const isMember = (membershipRes?.rowCount ?? 0) > 0;

    if (!isOwner && !isAdmin && !isMember) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const demosResult = await pool.query(
      `SELECT id, title, description, demo_type, video_url, thumbnail_url, 
              duration_seconds, file_size_bytes, mimetype, created_at
       FROM project_demos
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [params.id]
    );

    const demos = demosResult.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      demoType: (row.demo_type as string) || "file",
      videoUrl: row.video_url as string,
      thumbnailUrl: row.thumbnail_url as string | null,
      durationSeconds: row.duration_seconds as number | null,
      fileSizeBytes: row.file_size_bytes ? Number(row.file_size_bytes) : null,
      mimetype: row.mimetype as string | null,
      createdAt: row.created_at as string,
    }));

    return NextResponse.json({ demos });
  } catch (error: unknown) {
    console.error("[ProjectDemos] GET error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    // Only admins can add demos
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const pool = getPool();
    
    // Check project exists
    const projectCheck = await pool.query(
      `SELECT id FROM projects WHERE id = $1`,
      [params.id]
    );
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";

    // Branch: JSON body for link
    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as { 
        url?: unknown; 
        title?: unknown;
        description?: unknown;
      };
      
      if (typeof body.url !== "string" || !body.url.trim()) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
      }
      
      const url = body.url.trim();
      const title = typeof body.title === "string" && body.title.trim() 
        ? body.title.trim() 
        : new URL(url).hostname + " Demo";
      const description = typeof body.description === "string" ? body.description.trim() || null : null;

      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO project_demos (id, project_id, title, description, demo_type, video_url, uploaded_by)
         VALUES ($1, $2, $3, $4, 'link', $5, $6)`,
        [id, params.id, title, description, url, user.accountId]
      );

      return NextResponse.json({ id, videoUrl: url }, { status: 201 });
    }

    // Branch: file upload via form-data
    const form = await request.formData();
    const file = form.get("file");
    const title = form.get("title");
    const description = form.get("description");

    if (!file || typeof (file as Blob).arrayBuffer !== "function") {
      return NextResponse.json({ error: "Video file is required" }, { status: 400 });
    }

    const blob = file as Blob & { name?: string; type?: string };
    
    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(blob.type || "")) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    const arrayBuffer = await blob.arrayBuffer();
    const size = arrayBuffer.byteLength;
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Upload to GCS
    const buffer = Buffer.from(arrayBuffer);
    const filename = blob.name || `demo-${Date.now()}.mp4`;
    
    const { publicUrl } = await uploadFileWithPath(
      buffer,
      filename,
      blob.type || "video/mp4",
      { prefix: `demos/${params.id}` }
    );

    // Create database record
    const id = crypto.randomUUID();
    const demoTitle = typeof title === "string" && title.trim() 
      ? title.trim() 
      : filename.replace(/\.[^/.]+$/, ""); // Use filename without extension as fallback

    await pool.query(
      `INSERT INTO project_demos (id, project_id, title, description, demo_type, video_url, file_size_bytes, mimetype, uploaded_by)
       VALUES ($1, $2, $3, $4, 'file', $5, $6, $7, $8)`,
      [
        id,
        params.id,
        demoTitle,
        typeof description === "string" ? description.trim() || null : null,
        publicUrl,
        size,
        blob.type || "video/mp4",
        user.accountId,
      ]
    );

    return NextResponse.json({ id, videoUrl: publicUrl }, { status: 201 });
  } catch (error: unknown) {
    console.error("[ProjectDemos] POST error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    // Only admins can delete demos
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get("id");
    if (!demoId) {
      return NextResponse.json({ error: "Missing demo id" }, { status: 400 });
    }

    const pool = getPool();
    
    // Check project exists
    const projectCheck = await pool.query(
      `SELECT id FROM projects WHERE id = $1`,
      [params.id]
    );
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get demo to retrieve video URL for GCS deletion
    const demoResult = await pool.query(
      `SELECT demo_type, video_url, thumbnail_url FROM project_demos WHERE id = $1 AND project_id = $2`,
      [demoId, params.id]
    );
    
    if (demoResult.rowCount === 0) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    }

    const demo = demoResult.rows[0] as { demo_type: string; video_url: string; thumbnail_url: string | null };

    // Only delete from GCS if it's a file upload (not a link)
    if (demo.demo_type === "file") {
      try {
        await deleteFile(demo.video_url);
        if (demo.thumbnail_url) {
          await deleteFile(demo.thumbnail_url);
        }
      } catch (gcsError) {
        console.warn("[ProjectDemos] GCS deletion failed:", gcsError);
        // Continue with DB deletion even if GCS fails
      }
    }

    // Delete from database
    await pool.query(
      `DELETE FROM project_demos WHERE id = $1 AND project_id = $2`,
      [demoId, params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[ProjectDemos] DELETE error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
