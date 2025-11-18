import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { DEFAULT_SPRINT_SYSTEM_PROMPT, DEFAULT_SPRINT_USER_PROMPT } from "@/lib/prompts";

type Params = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Params) {
  try {
    const startedAt = new Date().toISOString();
    console.log("[SprintAPI] Start", {
      startedAt,
      documentId: params.id,
      contentType: request.headers.get("content-type"),
    });
    await ensureSchema();
    const pool = getPool();

    // Load document
    const docRes = await pool.query(
      `SELECT id, content FROM documents WHERE id = $1`,
      [params.id]
    );
    if (docRes.rowCount === 0) {
      console.warn("[SprintAPI] Document not found", { documentId: params.id });
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const document = docRes.rows[0] as { id: string; content: unknown };
    const docSize = (() => {
      try {
        return JSON.stringify(document.content)?.length ?? 0;
      } catch {
        return -1;
      }
    })();
    console.log("[SprintAPI] Loaded document", { documentId: params.id, docSize });

    const apiKey = process.env.OPENAI_API_KEY;
    const openaiProject = process.env.OPENAI_PROJECT_ID;
    const openaiOrg = process.env.OPENAI_ORG_ID;
    if (!apiKey) {
      console.error("[SprintAPI] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let model = "gpt-4o-mini";
    try {
      const body = (await request.json()) as unknown;
      if (body && typeof body === "object" && "model" in body) {
        const candidate = (body as { model?: unknown }).model;
        if (typeof candidate === "string" && candidate.trim().length > 0) {
          model = candidate.trim();
        }
      }
    } catch {
      // no body provided; keep default
    }
    // Allowlist models to avoid arbitrary values
    const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
    if (!ALLOWED_MODELS.has(model)) {
      console.warn("[SprintAPI] Model not allowed; falling back", { model });
      model = "gpt-4o-mini";
    }
    console.log("[SprintAPI] Using model", {
      model,
      hasApiKey: Boolean(apiKey),
    });

    // Guard extremely large documents to avoid blowing token limits
    if (docSize > 100_000) {
      console.warn("[SprintAPI] Document too large for AI request", { documentId: params.id, docSize });
      return NextResponse.json(
        {
          error: "Document too large to send to OpenAI.",
          details: { docSize, limit: 100000 },
        },
        { status: 413 }
      );
    }

    // Compose prompt (load from settings, fallback to defaults)
    let systemPrompt = DEFAULT_SPRINT_SYSTEM_PROMPT;
    let userPrompt = DEFAULT_SPRINT_USER_PROMPT;
    try {
      const settingsRes = await pool.query(
        `SELECT key, value FROM app_settings WHERE key = ANY($1::text[])`,
        [["sprint_system_prompt", "sprint_user_prompt"]]
      );
      const settings = new Map<string, string | null>(
        settingsRes.rows.map((r: { key: string; value: string | null }) => [r.key, r.value])
      );
      const s = settings.get("sprint_system_prompt");
      const u = settings.get("sprint_user_prompt");
      if (typeof s === "string" && s.trim()) systemPrompt = s;
      if (typeof u === "string" && u.trim()) userPrompt = u;
    } catch {
      // Ignore settings errors, keep defaults
    }

    // Load active deliverables to ground the sprint in 1-3 catalog items
    const deliverablesRes = await pool.query(
      `SELECT id, name, description, category, scope, default_estimate_points, fixed_hours, fixed_price
       FROM deliverables
       WHERE active = true
       ORDER BY name ASC
       LIMIT 50`
    );
    const deliverablesList: Array<{
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      scope: string | null;
      default_estimate_points: number | null;
      fixed_hours: number | null;
      fixed_price: number | null;
    }> = deliverablesRes.rows;
    const deliverablesText =
      deliverablesList.length === 0
        ? "No deliverables are currently defined in the catalog."
        : deliverablesList
            .map((d, idx) => {
              const parts = [
                `(${idx + 1}) id: ${d.id}`,
                `name: ${d.name}`,
                d.category ? `category: ${d.category}` : null,
                d.default_estimate_points != null ? `points: ${d.default_estimate_points}` : null,
                d.fixed_hours != null ? `fixed_hours: ${d.fixed_hours}` : null,
                d.fixed_price != null ? `fixed_price: $${d.fixed_price}` : null,
                d.scope ? `scope: ${d.scope}` : null,
              ].filter(Boolean);
              return parts.join(" | ");
            })
            .join("\n");

    const deliverablesInstructions =
      "You also have access to a catalog of predefined deliverables managed by the team.\n" +
      "From this catalog, choose 1 to 3 deliverables that best match the sprint you design. " +
      "If none are appropriate, you may return an empty deliverables list.\n\n" +
      "When you output the JSON, in addition to the existing fields, include a top-level field `deliverables` " +
      "which is an array of objects with the following fields:\n" +
      "- deliverableId (string): EXACTLY one of the ids from the catalog below.\n" +
      "- name (string): the name of the deliverable.\n" +
      "- reason (string): short explanation why this deliverable is included in this sprint.\n\n" +
      "Available deliverables catalog:\n" +
      deliverablesText;

    const combinedUserPrompt = `${userPrompt}\n\n${deliverablesInstructions}`;

    // Call OpenAI Chat Completions API with response_format json_object
    const requestBody = {
      model,
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: combinedUserPrompt },
        {
          role: "user",
          content:
            "Client intake JSON:\n\n```json\n" +
            JSON.stringify(document.content, null, 2) +
            "\n```",
        },
      ],
    };
    console.log("[SprintAPI] Sending OpenAI request", {
      endpoint: "https://api.openai.com/v1/chat/completions",
      model,
      temperature: requestBody.temperature,
      messagesCount: requestBody.messages.length,
      docSize,
      hasProjectHeader: Boolean(openaiProject),
    });
    // Prepare headers with optional org/project and idempotency key
    const requestId = crypto.randomUUID();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "form-intake/0.1.0",
      "Idempotency-Key": requestId,
    };
    if (openaiProject) headers["OpenAI-Project"] = openaiProject;
    if (openaiOrg) headers["OpenAI-Organization"] = openaiOrg;

    // Add timeout to avoid hanging
    const controller = new AbortController();
    const timeoutMs = 60_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let openAIRes: Response;
    try {
      openAIRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      if ((err as { name?: string })?.name === "AbortError") {
        console.error("[SprintAPI] OpenAI request timed out", { documentId: params.id, timeoutMs });
        return NextResponse.json(
          { error: "OpenAI request timed out" },
          { status: 504 }
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!openAIRes.ok) {
      const errText = await openAIRes.text().catch(() => "");
      console.error("[SprintAPI] OpenAI request failed", {
        status: openAIRes.status,
        statusText: openAIRes.statusText,
        bodyPreview: errText.slice(0, 2000),
      });
      // Pass through common statuses with clearer messages
      if (openAIRes.status === 429) {
        return NextResponse.json(
          {
            error: "OpenAI quota exceeded (429). Check plan/billing.",
            details: errText,
            retryAfter: openAIRes.headers.get("retry-after") || null,
          },
          { status: 429 }
        );
      }
      if (openAIRes.status === 401 || openAIRes.status === 403) {
        return NextResponse.json(
          {
            error: "OpenAI authentication/authorization failed",
            details: errText,
          },
          { status: openAIRes.status }
        );
      }
      return NextResponse.json(
        { error: "OpenAI request failed", details: errText },
        { status: 502 }
      );
    }

    type ChatCompletion = {
      choices: Array<{
        message: { role: string; content: string };
      }>;
    };
    const data = (await openAIRes.json()) as ChatCompletion;
    console.log("[SprintAPI] OpenAI response ok", {
      hasChoices: Array.isArray(data?.choices),
      firstChoiceLen: data?.choices?.[0]?.message?.content?.length ?? 0,
    });
    const messageContent = data.choices?.[0]?.message?.content ?? "";

    let parsedDraft: unknown = null;
    try {
      parsedDraft = JSON.parse(messageContent);
    } catch {
      // If not valid JSON, still store raw text and return error
      console.warn("[SprintAPI] Response was not valid JSON; storing raw text", {
        textPreview: messageContent.slice(0, 500),
      });
    }

    const aiResponseId = crypto.randomUUID();
    const sprintDraftId = crypto.randomUUID();
    console.log("[SprintAPI] Generated ids", { aiResponseId, sprintDraftId });

    // Store AI response
    await pool.query(
      `
      INSERT INTO ai_responses (id, document_id, provider, model, prompt, response_text, response_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
      [
        aiResponseId,
        params.id,
        "openai",
        model,
        `${systemPrompt}\n\n${combinedUserPrompt}`,
        messageContent || null,
        parsedDraft ? JSON.stringify(parsedDraft) : null,
      ]
    );
    console.log("[SprintAPI] Stored ai_responses row", { aiResponseId });

    if (!parsedDraft) {
      // We stored the raw response, but cannot create a sprint draft without JSON
      console.warn("[SprintAPI] Returning 202 due to non-JSON response", { aiResponseId });
      return NextResponse.json(
        {
          aiResponseId,
          warning:
            "AI response was not valid JSON. Stored raw response; no sprint draft created.",
        },
        { status: 202 }
      );
    }

    // Extract sprint title from parsed draft
    let sprintTitle: string | null = null;
    if (parsedDraft && typeof parsedDraft === "object" && "sprintTitle" in parsedDraft) {
      const titleValue = (parsedDraft as { sprintTitle?: unknown }).sprintTitle;
      if (typeof titleValue === "string") {
        sprintTitle = titleValue;
      }
    }

    // Store sprint draft
    await pool.query(
      `
      INSERT INTO sprint_drafts (id, document_id, ai_response_id, draft, status, title, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, 'draft', $5, now())
    `,
      [sprintDraftId, params.id, aiResponseId, JSON.stringify(parsedDraft), sprintTitle]
    );
    console.log("[SprintAPI] Created sprint_drafts row", { sprintDraftId, documentId: params.id, title: sprintTitle });

    // Extract deliverables from parsed draft and link them
    if (parsedDraft && typeof parsedDraft === "object" && "deliverables" in parsedDraft) {
      const deliverables = (parsedDraft as { deliverables?: unknown }).deliverables;
      if (Array.isArray(deliverables)) {
        let totalPoints = 0;
        let totalHours = 0;
        let totalBudget = 0;

        for (const d of deliverables) {
          if (d && typeof d === "object" && "deliverableId" in d) {
            const deliverableId = (d as { deliverableId?: unknown }).deliverableId;
            if (typeof deliverableId === "string" && deliverableId.trim()) {
              // Fetch the deliverable from catalog to get default values
              const delRes = await pool.query(
                `SELECT default_estimate_points, fixed_hours, fixed_price
                 FROM deliverables
                 WHERE id = $1`,
                [deliverableId]
              );
              if (delRes.rowCount > 0) {
                const delRow = delRes.rows[0] as {
                  default_estimate_points: number | null;
                  fixed_hours: number | null;
                  fixed_price: number | null;
                };
                const points = delRow.default_estimate_points ?? 0;
                const hours = delRow.fixed_hours ?? 0;
                const price = delRow.fixed_price ?? 0;

                totalPoints += points;
                totalHours += hours;
                totalBudget += price;

                // Insert into sprint_deliverables junction table
                const junctionId = crypto.randomUUID();
                await pool.query(
                  `
                  INSERT INTO sprint_deliverables (id, sprint_draft_id, deliverable_id, quantity)
                  VALUES ($1, $2, $3, 1)
                  ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING
                `,
                  [junctionId, sprintDraftId, deliverableId]
                );
              }
            }
          }
        }

        // Update sprint_drafts with calculated totals
        await pool.query(
          `
          UPDATE sprint_drafts
          SET total_estimate_points = $1,
              total_fixed_hours = $2,
              total_fixed_price = $3,
              deliverable_count = $4,
              updated_at = now()
          WHERE id = $5
        `,
          [totalPoints, totalHours, totalBudget, deliverables.length, sprintDraftId]
        );
        console.log("[SprintAPI] Linked deliverables and updated totals", {
          sprintDraftId,
          totalPoints,
          totalHours,
          totalBudget,
          deliverablesCount: deliverables.length,
        });
      }
    }

    return NextResponse.json(
      { sprintDraftId, aiResponseId },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[SprintAPI] Uncaught error", {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack?.slice(0, 1500),
    });
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


