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
  "application/pdf",
]);
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_BODY_CHARS = 10_000;
const MAX_FILES_PER_NOTE = 10;

type UploadedFile = {
  name?: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

// Anyone who can view the cycle (admin, project owner, project member, or
// the original submitter) can post and delete their own notes.
async function authorizeView(
  cycleId: string,
  user: { email: string; accountId: string; isAdmin?: boolean | null }
): Promise<{ error: string; status: 401 | 403 | 404 } | { isAdmin: boolean }> {
  const pool = getPool();
  const cycleRes = await pool.query(
    `SELECT rc.project_id, rc.submitter_email, p.account_id AS project_account_id
     FROM refinement_cycles rc
     LEFT JOIN projects p ON p.id = rc.project_id
     WHERE rc.id = $1
     LIMIT 1`,
    [cycleId]
  );
  if (cycleRes.rowCount === 0) {
    return { error: "Cycle not found", status: 404 };
  }
  const row = cycleRes.rows[0] as {
    project_id: string;
    submitter_email: string | null;
    project_account_id: string | null;
  };
  const isAdmin = Boolean(user.isAdmin);
  if (isAdmin) return { isAdmin: true };

  const isOwner = row.project_account_id === user.accountId;
  const isSubmitter =
    row.submitter_email != null &&
    row.submitter_email.toLowerCase() === user.email.toLowerCase();
  if (isOwner || isSubmitter) return { isAdmin: false };

  const memberRes = await pool.query(
    `SELECT 1 FROM project_members
     WHERE project_id = $1 AND lower(email) = lower($2)
     LIMIT 1`,
    [row.project_id, user.email]
  );
  if ((memberRes.rowCount ?? 0) > 0) return { isAdmin: false };
  return { error: "Not authorized", status: 403 };
}

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

    const guard = await authorizeView(params.id, user);
    if ("error" in guard) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const formData = await request.formData();
    const bodyRaw = formData.get("body");
    const body =
      typeof bodyRaw === "string" && bodyRaw.trim()
        ? bodyRaw.trim().slice(0, MAX_BODY_CHARS)
        : null;

    // Accept either repeated `files` or a single `file` field for backwards
    // compatibility with anyone calling with the old shape.
    const allEntries = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ];
    const rawFiles: UploadedFile[] = allEntries
      .filter(isFile)
      .filter((f) => f.size > 0);

    if (!body && rawFiles.length === 0) {
      return NextResponse.json(
        { error: "Add a note or an attachment" },
        { status: 400 }
      );
    }
    if (rawFiles.length > MAX_FILES_PER_NOTE) {
      return NextResponse.json(
        { error: `Up to ${MAX_FILES_PER_NOTE} attachments per note` },
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
    if (rawFiles.length > 0 && !getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured." },
        { status: 503 }
      );
    }

    type Uploaded = { fileUrl: string; filename: string; mimetype: string };
    const uploaded: Uploaded[] = [];
    for (const f of rawFiles) {
      const buffer = Buffer.from(await f.arrayBuffer());
      const filename = f.name || "attachment";
      const fileUrl = await uploadFile(buffer, filename, f.type, {
        prefix: `refinement-cycles/${params.id}/notes`,
      });
      uploaded.push({ fileUrl, filename, mimetype: f.type });
    }

    const id = randomUUID();
    const pool = getPool();
    const insertRes = await pool.query(
      `
      INSERT INTO refinement_cycle_notes (
        id, refinement_cycle_id, body, author_account_id, author_email
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, body, author_email, created_at
      `,
      [id, params.id, body, user.accountId, user.email]
    );

    const attachments: Array<{
      id: string;
      fileUrl: string;
      filename: string | null;
      mimetype: string | null;
      sortOrder: number;
    }> = [];
    for (let i = 0; i < uploaded.length; i++) {
      const u = uploaded[i];
      const attachmentId = randomUUID();
      await pool.query(
        `
        INSERT INTO refinement_cycle_note_attachments (
          id, note_id, file_url, filename, mimetype, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [attachmentId, id, u.fileUrl, u.filename, u.mimetype, i]
      );
      attachments.push({
        id: attachmentId,
        fileUrl: u.fileUrl,
        filename: u.filename,
        mimetype: u.mimetype,
        sortOrder: i,
      });
    }

    const row = insertRes.rows[0];
    return NextResponse.json(
      {
        note: {
          id: row.id as string,
          body: (row.body as string | null) ?? null,
          authorEmail: (row.author_email as string | null) ?? null,
          createdAt:
            row.created_at instanceof Date
              ? row.created_at.toISOString()
              : (row.created_at as string),
          attachments,
          canDelete: true,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[RefinementCycle notes POST]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to add note" },
      { status: 500 }
    );
  }
}
