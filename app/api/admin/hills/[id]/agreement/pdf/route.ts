import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";

type Params = { params: { id: string } };

// POST — upload a signed/rendered agreement PDF for a client hill; stored in
// GCS and referenced from the hill's type_data.agreement_pdf_url.
export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    await ensureSchema();

    if (!getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured (set GCS_PROJECT_ID, GCS_BUCKET_NAME, and credentials)." },
        { status: 503 }
      );
    }

    const pool = getPool();
    const hillRes = await pool.query(`SELECT id FROM hills WHERE id = $1`, [params.id]);
    if (hillRes.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type. Only PDF files are allowed." }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 25MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buffer, file.name, file.type, {
      prefix: `agreements/${params.id}`,
    });

    await pool.query(
      `UPDATE hills
          SET type_data = type_data || jsonb_build_object('agreement_pdf_url', $1::text),
              updated_at = now()
        WHERE id = $2`,
      [url, params.id]
    );

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("[Hill AgreementPDF Upload] Error:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message ?? "Upload failed" }, { status: 500 });
  }
}

// DELETE — clear the stored agreement PDF reference.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    await pool.query(
      `UPDATE hills SET type_data = type_data - 'agreement_pdf_url', updated_at = now() WHERE id = $1`,
      [params.id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Hill AgreementPDF Delete] Error:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message ?? "Delete failed" }, { status: 500 });
  }
}
