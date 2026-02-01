import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Check if GCS is configured
    if (!getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured. Please set GCS_PROJECT_ID, GCS_BUCKET_NAME, and GCS credentials." },
        { status: 503 }
      );
    }

    // Verify sprint exists
    const pool = getPool();
    const sprintRes = await pool.query(
      `SELECT id FROM sprint_drafts WHERE id = $1`,
      [params.id]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type - only PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for PDFs)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to GCS with sprint-specific prefix
    const url = await uploadFile(buffer, file.name, file.type, {
      prefix: `invoices/${params.id}`,
    });

    // Update sprint with PDF URL
    await pool.query(
      `UPDATE sprint_drafts SET invoice_pdf_url = $1, updated_at = now() WHERE id = $2`,
      [url, params.id]
    );

    return NextResponse.json({ url }, { status: 201 });
  } catch (error: unknown) {
    console.error("[InvoicePDF Upload] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const pool = getPool();
    
    // Clear the PDF URL from the sprint
    await pool.query(
      `UPDATE sprint_drafts SET invoice_pdf_url = NULL, updated_at = now() WHERE id = $1`,
      [params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[InvoicePDF Delete] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
