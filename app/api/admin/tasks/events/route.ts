import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/tasks/events - List task events with optional filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const eventType = searchParams.get("eventType");
    const ideaId = searchParams.get("ideaId");
    const taskId = searchParams.get("taskId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const pool = getPool();

    let query = `
      SELECT 
        e.*,
        t.name as task_name,
        i.title as idea_title
      FROM admin_task_events e
      LEFT JOIN admin_tasks t ON e.task_id = t.id
      LEFT JOIN admin_ideas i ON e.idea_id = i.id
      WHERE 1=1
    `;
    const values: (string | number)[] = [];
    let paramCount = 1;

    if (eventType) {
      query += ` AND e.event_type = $${paramCount++}`;
      values.push(eventType);
    }

    if (ideaId) {
      query += ` AND e.idea_id = $${paramCount++}`;
      values.push(ideaId);
    }

    if (taskId) {
      query += ` AND e.task_id = $${paramCount++}`;
      values.push(taskId);
    }

    if (dateFrom) {
      query += ` AND e.created_at >= $${paramCount++}`;
      values.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND e.created_at <= $${paramCount++}`;
      values.push(dateTo);
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM admin_task_events e WHERE 1=1`;
    const countValues: string[] = [];
    let countParamCount = 1;

    if (eventType) {
      countQuery += ` AND e.event_type = $${countParamCount++}`;
      countValues.push(eventType);
    }
    if (ideaId) {
      countQuery += ` AND e.idea_id = $${countParamCount++}`;
      countValues.push(ideaId);
    }
    if (taskId) {
      countQuery += ` AND e.task_id = $${countParamCount++}`;
      countValues.push(taskId);
    }
    if (dateFrom) {
      countQuery += ` AND e.created_at >= $${countParamCount++}`;
      countValues.push(dateFrom);
    }
    if (dateTo) {
      countQuery += ` AND e.created_at <= $${countParamCount++}`;
      countValues.push(dateTo);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      events: result.rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching task events:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
