import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";

type Params = { params: { id: string; screenId: string } };

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
]);
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_SCREEN = 10;

type UploadedFile = {
  name?: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function isFile(value: FormDataEntryValue): value is UploadedFile & FormDataEntryValue {
  return (
    typeof value !== "string" &&
    value !== null &&
    typeof value === "object" &&
    "size" in value &&
    "type" in value &&
    "arrayBuffer" in value
  );
}

// Mirrors the screens PATCH/DELETE auth: admin or original submitter, only
// while the cycle is still in `submitted`.
async function authorizeEdit(
  cycleId: string,
  user: { email: string; isAdmin?: boolean | null }
): Promise<
  { error: string; status: 401 | 403 | 404 | 409 } | { isAdmin: boolean }
> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT status, submitter_email
     FROM refinement_cycles WHERE id = $1 LIMIT 1`,
    [cycleId]
  );
  if (res.rowCount === 0) {
    return { error: "Cycle not found", status: 404 };
  }
  const row = res.rows[0] as {
    status: string;
    submitter_email: string | null;
  };
  const isAdmin = Boolean(user.isAdmin);
  const isSubmitter =
    row.submitter_email != null &&
    row.submitter_email.toLowerCase() === user.email.toLowerCase();
  if (!isAdmin && !isSubmitter) {
    return {
      error: "Only the studio or the original submitter can edit scope",
      status: 403,
    };
  }
  if (row.status !== "submitted") {
    return {
      error: "Scope is locked once the cycle is accepted or declined",
      status: 409,
    };
  }
  return { isAdmin };
}

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

    const guard = await authorizeEdit(params.id, user);
    if ("error" in guard) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const pool = getPool();
    const screenRes = await pool.query(
      `SELECT id FROM refinement_cycle_screens
       WHERE id = $1 AND refinement_cycle_id = $2 LIMIT 1`,
      [params.screenId, params.id]
    );
    if (screenRes.rowCount === 0) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const rawFiles: UploadedFile[] = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ]
      .filter(isFile)
      .filter((f) => f.size > 0);

    if (rawFiles.length === 0) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const existingCountRes = await pool.query(
      `SELECT COUNT(*)::int AS n
       FROM refinement_cycle_screen_attachments
       WHERE screen_id = $1`,
      [params.screenId]
    );
    const existing = Number(existingCountRes.rows[0]?.n ?? 0);
    if (existing + rawFiles.length > MAX_FILES_PER_SCREEN) {
      return NextResponse.json(
        { error: `Up to ${MAX_FILES_PER_SCREEN} attachments per screen` },
        { status: 400 }
      );
    }
    for (const f of rawFiles) {
      if (!ALLOWED_TYPES.has(f.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${f.type}` },
          { status: 400 }
        );
      }
      if (f.size > MAX_BYTES) {
        return NextResponse.json(
          { error: "File exceeds 25 MB" },
          { status: 400 }
        );
      }
    }
    if (!getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured." },
        { status: 503 }
      );
    }

    const sortRes = await pool.query(
      `SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_sort
       FROM refinement_cycle_screen_attachments
       WHERE screen_id = $1`,
      [params.screenId]
    );
    let sortOrder = Number(sortRes.rows[0].next_sort ?? 0);

    const created: Array<{
      id: string;
      fileUrl: string;
      filename: string | null;
      mimetype: string | null;
      sortOrder: number;
    }> = [];

    for (const f of rawFiles) {
      const buffer = Buffer.from(await f.arrayBuffer());
      const filename = f.name || "attachment";
      const fileUrl = await uploadFile(buffer, filename, f.type, {
        prefix: `refinement-cycles/${params.id}/screens`,
      });
      const id = randomUUID();
      await pool.query(
        `
        INSERT INTO refinement_cycle_screen_attachments (
          id, screen_id, file_url, filename, mimetype, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [id, params.screenId, fileUrl, filename, f.type, sortOrder]
      );
      created.push({
        id,
        fileUrl,
        filename,
        mimetype: f.type,
        sortOrder,
      });
      sortOrder += 1;
    }

    await pool.query(
      `UPDATE refinement_cycles
       SET last_edited_at = now(),
           last_edited_by = $1,
           updated_at = now()
       WHERE id = $2`,
      [user.accountId, params.id]
    );

    return NextResponse.json({ attachments: created }, { status: 201 });
  } catch (err) {
    console.error("[RefinementCycle screen attachments POST]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
