import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { enqueuePrintJob, PrintJobError } from "@/lib/printJobs";

// POST /api/print/jobs — admin: enqueue a receipt to print now (or scheduledAt).
// Body: { printerId, payload, scheduledAt? }
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const body = await request.json().catch(() => ({}));
    const { printerId, payload, scheduledAt } = body || {};

    if (!printerId || typeof printerId !== "string") {
      return NextResponse.json({ error: "printerId is required." }, { status: 400 });
    }

    const job = await enqueuePrintJob(printerId, payload, {
      source: typeof body.source === "string" ? body.source : "manual",
      createdBy: admin.accountId,
      scheduledAt: typeof scheduledAt === "string" ? scheduledAt : null,
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof PrintJobError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error enqueuing print job:", error);
    return NextResponse.json({ error: "Failed to enqueue" }, { status: 500 });
  }
}

// GET /api/print/jobs?status=&printerId=&limit= — admin: queue + history.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const printerId = searchParams.get("printerId");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const clauses: string[] = [];
    const params: unknown[] = [];
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (printerId) {
      params.push(printerId);
      clauses.push(`printer_id = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT j.*, p.label AS printer_label, p.cups_name
         FROM print_jobs j JOIN printers p ON p.id = j.printer_id
         ${where}
         ORDER BY j.created_at DESC LIMIT ${limit}`,
      params
    );
    return NextResponse.json({ jobs: rows });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error listing print jobs:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
