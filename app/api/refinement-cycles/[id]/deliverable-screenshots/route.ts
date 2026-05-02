import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";

type Params = { params: { id: string } };

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    if (!getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured." },
        { status: 503 }
      );
    }

    const pool = getPool();
    const cycleRes = await pool.query(
      `SELECT id FROM refinement_cycles WHERE id = $1 LIMIT 1`,
      [params.id]
    );
    if (cycleRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const raw = formData.get("file");
    const file =
      raw && typeof raw !== "string" && typeof raw === "object"
        ? (raw as {
            name?: string;
            size: number;
            type: string;
            arrayBuffer: () => Promise<ArrayBuffer>;
          })
        : null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 25 MB" },
        { status: 400 }
      );
    }

    const captionRaw = formData.get("caption");
    const caption =
      typeof captionRaw === "string" && captionRaw.trim()
        ? captionRaw.trim().slice(0, 500)
        : null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || "screenshot";
    const fileUrl = await uploadFile(buffer, filename, file.type, {
      prefix: `refinement-cycles/${params.id}/deliverables`,
    });

    const sortRes = await pool.query(
      `SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_sort
       FROM refinement_cycle_deliverable_screenshots
       WHERE refinement_cycle_id = $1`,
      [params.id]
    );
    const sortOrder = Number(sortRes.rows[0].next_sort ?? 0);

    const id = randomUUID();
    const insertRes = await pool.query(
      `
      INSERT INTO refinement_cycle_deliverable_screenshots (
        id, refinement_cycle_id, file_url, filename, mimetype,
        caption, sort_order, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, file_url, filename, mimetype, caption, sort_order, created_at
      `,
      [
        id,
        params.id,
        fileUrl,
        filename,
        file.type,
        caption,
        sortOrder,
        user.accountId,
      ]
    );

    const row = insertRes.rows[0];
    return NextResponse.json(
      {
        screenshot: {
          id: row.id as string,
          fileUrl: row.file_url as string,
          filename: (row.filename as string | null) ?? null,
          mimetype: (row.mimetype as string | null) ?? null,
          caption: (row.caption as string | null) ?? null,
          sortOrder: Number(row.sort_order ?? 0),
          createdAt:
            row.created_at instanceof Date
              ? row.created_at.toISOString()
              : (row.created_at as string),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[RefinementCycle deliverable-screenshots POST]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
