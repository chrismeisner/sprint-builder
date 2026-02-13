import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";

type Params = { params: { id: string; invoiceId: string } };

/**
 * POST /api/sprint-drafts/[id]/invoices/[invoiceId]/pdf
 * Upload a PDF for a specific invoice.
 * Admin only.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    if (!getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured." },
        { status: 503 }
      );
    }

    const pool = getPool();

    // Verify invoice exists and belongs to this sprint
    const invoiceRes = await pool.query(
      `SELECT id FROM sprint_invoices WHERE id = $1 AND sprint_id = $2`,
      [params.invoiceId, params.id]
    );
    if ((invoiceRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 25MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadFile(buffer, file.name, file.type, {
      prefix: `invoices/${params.id}/${params.invoiceId}`,
    });

    await pool.query(
      `UPDATE sprint_invoices SET invoice_pdf_url = $1, updated_at = now() WHERE id = $2`,
      [url, params.invoiceId]
    );

    return NextResponse.json({ url }, { status: 201 });
  } catch (error: unknown) {
    console.error("[InvoicePDF Upload]", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprint-drafts/[id]/invoices/[invoiceId]/pdf
 * Remove PDF from a specific invoice.
 * Admin only.
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const pool = getPool();
    await pool.query(
      `UPDATE sprint_invoices SET invoice_pdf_url = NULL, updated_at = now() WHERE id = $1 AND sprint_id = $2`,
      [params.invoiceId, params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[InvoicePDF Delete]", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
