import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { onCycleRescheduled } from "@/lib/refinementCycleBilling";

type Params = { params: { id: string } };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Statuses where rescheduling is allowed. Excludes `submitted` (use the
// accept flow), `delivered`/`awaiting_payment` (already shipped), and
// `declined`/`expired` (terminal).
const RESCHEDULABLE_STATUSES = ["accepted", "awaiting_deposit", "in_progress"];

// POST /api/refinement-cycles/[id]/reschedule
//
// Updates `delivery_date` and emails the submitter + cc list with the new
// date. Admin-only. The acknowledgment checkbox is enforced server-side via
// the `acknowledged` flag — the UI sets it after the admin ticks the box.
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

    const body = (await request.json().catch(() => ({}))) as {
      deliveryDate?: unknown;
      acknowledged?: unknown;
    };

    const newDeliveryDate =
      typeof body.deliveryDate === "string" &&
      DATE_PATTERN.test(body.deliveryDate)
        ? body.deliveryDate
        : null;
    if (!newDeliveryDate) {
      return NextResponse.json(
        { error: "deliveryDate (YYYY-MM-DD) is required" },
        { status: 400 }
      );
    }

    if (body.acknowledged !== true) {
      return NextResponse.json(
        { error: "Acknowledgment required to reschedule" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    let previousDeliveryDate: string | null = null;
    try {
      await client.query("BEGIN");

      // Lock the row + capture the previous delivery date in one read.
      const lockRes = await client.query(
        `SELECT delivery_date, status
         FROM refinement_cycles
         WHERE id = $1
         FOR UPDATE`,
        [params.id]
      );
      if (lockRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
      }
      const row = lockRes.rows[0] as {
        delivery_date: string | Date | null;
        status: string;
      };
      if (!RESCHEDULABLE_STATUSES.includes(row.status)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Cycle cannot be rescheduled in its current status" },
          { status: 409 }
        );
      }

      previousDeliveryDate =
        row.delivery_date instanceof Date
          ? row.delivery_date.toISOString().slice(0, 10)
          : (row.delivery_date as string | null);

      await client.query(
        `UPDATE refinement_cycles
         SET delivery_date = $2,
             updated_at = now()
         WHERE id = $1`,
        [params.id, newDeliveryDate]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    // Send the email outside the transaction. Best-effort: failures here
    // don't roll back the date change.
    await onCycleRescheduled(params.id, previousDeliveryDate);

    return NextResponse.json({
      id: params.id,
      previousDeliveryDate,
      newDeliveryDate,
    });
  } catch (err) {
    console.error("[RefinementCycle reschedule]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Reschedule failed" },
      { status: 500 }
    );
  }
}
