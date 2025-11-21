import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { WORKSHOP_GENERATION_SYSTEM_PROMPT, WORKSHOP_GENERATION_USER_PROMPT } from "@/lib/prompts";

type Params = {
  params: { id: string };
};

/**
 * POST /api/admin/sprint-drafts/[id]/workshop
 * 
 * Generates a custom workshop for a sprint draft using AI
 * - Only accessible to admin users
 * - Sprint must be in 'draft' or 'studio_review' status
 * - Analyzes sprint deliverables and context
 * - Generates workshop agenda, exercises, and client prep checklist
 * - Updates sprint status to 'pending_client'
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    
    // Verify user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch sprint draft with all context
    const sprintResult = await pool.query(
      `SELECT 
        sd.id,
        sd.document_id,
        sd.draft,
        sd.status,
        sd.title,
        sd.workshop_agenda,
        sd.workshop_generated_at,
        d.email,
        d.content as document_content
       FROM sprint_drafts sd
       JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [params.id]
    );

    if (sprintResult.rows.length === 0) {
      return NextResponse.json({ error: "Sprint draft not found" }, { status: 404 });
    }

    const sprint = sprintResult.rows[0];

    // Only allow workshop generation for drafts or studio_review status
    if (sprint.status !== 'draft' && sprint.status !== 'studio_review') {
      return NextResponse.json(
        { error: `Cannot generate workshop for sprint in '${sprint.status}' status` },
        { status: 400 }
      );
    }

    // Fetch sprint deliverables with full details
    const deliverablesResult = await pool.query(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.category,
        d.deliverable_type,
        d.scope,
        d.fixed_hours,
        d.fixed_price,
        d.default_estimate_points,
        spd.complexity_score,
        spd.custom_scope
       FROM sprint_deliverables spd
       JOIN deliverables d ON spd.deliverable_id = d.id
       WHERE spd.sprint_draft_id = $1
       ORDER BY spd.created_at`,
      [params.id]
    );

    const deliverables = deliverablesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      type: row.deliverable_type,
      scope: row.custom_scope || row.scope,
      hours: row.fixed_hours,
      price: row.fixed_price,
      points: row.default_estimate_points,
      complexity: row.complexity_score,
    }));

    // Build context for AI
    const sprintContext = {
      sprintTitle: sprint.title || "Untitled Sprint",
      clientEmail: sprint.email,
      deliverables: deliverables,
      sprintDraft: sprint.draft,
      documentContent: sprint.document_content,
    };

    // Call OpenAI to generate workshop
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const aiPayload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: WORKSHOP_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `${WORKSHOP_GENERATION_USER_PROMPT}

SPRINT CONTEXT:
${JSON.stringify(sprintContext, null, 2)}

Generate a workshop that:
1. Aligns with the specific deliverables in this sprint
2. Addresses the client's goals from their intake form
3. Selects 1-2 proven workshop exercises appropriate for the deliverable types
4. Provides a clear prep checklist for the client
5. Produces actionable outputs that feed into sprint execution`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    };

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate workshop" },
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const workshopContent = aiData.choices[0]?.message?.content;

    if (!workshopContent) {
      return NextResponse.json(
        { error: "No workshop content received from AI" },
        { status: 500 }
      );
    }

    let workshopAgenda;
    try {
      workshopAgenda = JSON.parse(workshopContent);
    } catch (e) {
      console.error("Failed to parse workshop JSON:", e);
      return NextResponse.json(
        { error: "Invalid workshop format from AI" },
        { status: 500 }
      );
    }

    // Store AI response for audit trail
    const aiResponseId = `ai-workshop-${crypto.randomUUID()}`;
    await pool.query(
      `INSERT INTO ai_responses (id, document_id, provider, model, prompt, response_text, response_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        aiResponseId,
        sprint.document_id,
        "openai",
        aiPayload.model,
        JSON.stringify(aiPayload.messages),
        workshopContent,
        workshopAgenda,
      ]
    );

    // Update sprint draft with workshop and change status
    await pool.query(
      `UPDATE sprint_drafts
       SET workshop_agenda = $1,
           workshop_generated_at = NOW(),
           workshop_ai_response_id = $2,
           status = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [
        workshopAgenda,
        aiResponseId,
        'pending_client', // Move to pending_client status after workshop is created
        params.id,
      ]
    );

    return NextResponse.json({
      success: true,
      workshop: workshopAgenda,
      aiResponseId: aiResponseId,
      message: "Workshop generated successfully. Sprint status updated to 'pending_client'.",
    });

  } catch (error: unknown) {
    console.error("Error generating workshop:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sprint-drafts/[id]/workshop
 * 
 * Removes workshop from sprint draft and resets status back to studio_review
 * Useful if workshop needs to be regenerated or adjusted
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    
    // Verify user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Update sprint draft to remove workshop
    const result = await pool.query(
      `UPDATE sprint_drafts
       SET workshop_agenda = NULL,
           workshop_generated_at = NULL,
           workshop_ai_response_id = NULL,
           status = 'studio_review',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Sprint draft not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Workshop removed. Sprint status reset to 'studio_review'.",
    });

  } catch (error: unknown) {
    console.error("Error removing workshop:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

