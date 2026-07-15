import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { buildAgreementMarkdown, loadAgreementInputs } from "@/lib/hillAgreement";

// GET /api/admin/hills/[id]/agreement — return the stored agreement, if any.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const r = await pool.query(
      `SELECT type_data->>'agreement_markdown' AS markdown,
              type_data->>'agreement_generated_at' AS generated_at,
              type_data->>'agreement_pdf_url' AS pdf_url
         FROM hills WHERE id = $1`,
      [params.id]
    );
    if (r.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });
    return NextResponse.json({
      agreement: r.rows[0].markdown ?? null,
      generatedAt: r.rows[0].generated_at ?? null,
      pdfUrl: r.rows[0].pdf_url ?? null,
    });
  } catch (error) {
    console.error("Error fetching hill agreement:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch agreement" }, { status: 500 });
  }
}

// POST /api/admin/hills/[id]/agreement — (re)generate the agreement markdown
// from the hill's priced deliverables and store it on the hill's type_data.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const inputs = await loadAgreementInputs(pool, params.id);
    if (!inputs) return NextResponse.json({ error: "Hill not found" }, { status: 404 });

    const markdown = buildAgreementMarkdown(inputs);
    const generatedAt = new Date().toISOString();
    await pool.query(
      `UPDATE hills
          SET type_data = type_data || jsonb_build_object(
                'agreement_markdown', $1::text,
                'agreement_generated_at', $2::text
              ),
              updated_at = now()
        WHERE id = $3`,
      [markdown, generatedAt, params.id]
    );

    return NextResponse.json({ agreement: markdown, generatedAt });
  } catch (error) {
    console.error("Error generating hill agreement:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to generate agreement" }, { status: 500 });
  }
}
