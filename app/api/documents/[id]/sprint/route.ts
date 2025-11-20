import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { DEFAULT_SPRINT_SYSTEM_PROMPT, DEFAULT_SPRINT_USER_PROMPT } from "@/lib/prompts";
import { sendEmail, generateSprintDraftEmail } from "@/lib/email";

type Params = {
  params: { id: string };
};

/**
 * Extract email from Typeform document content
 */
function extractEmailFromDocument(content: unknown): string | null {
  const maybeEmail = (value: unknown): string | null => {
    if (typeof value === "string" && value.includes("@")) {
      return value.trim();
    }
    return null;
  };

  if (!content || typeof content !== "object") return null;
  const root = content as Record<string, unknown>;

  // Prefer Typeform v2-style payload: form_response.answers[]
  const formResponse = root.form_response as unknown;
  if (formResponse && typeof formResponse === "object") {
    const fr = formResponse as { answers?: unknown[]; hidden?: Record<string, unknown> | undefined };
    if (Array.isArray(fr.answers)) {
      for (const ans of fr.answers) {
        if (ans && typeof ans === "object") {
          const a = ans as { type?: string; email?: unknown; text?: unknown };
          const emailFromField = maybeEmail(a.email);
          if (a.type === "email" && emailFromField) return emailFromField;
          const emailFromText = maybeEmail(a.text);
          if (a.type === "email" && emailFromText) return emailFromText;
        }
      }
    }
    if (fr.hidden && typeof fr.hidden === "object") {
      const hidden = fr.hidden as Record<string, unknown>;
      const emailFromHidden = maybeEmail(hidden.email ?? hidden.contact_email ?? hidden.user_email);
      if (emailFromHidden) return emailFromHidden;
    }
  }

  // Generic fallback: look for a top-level email-ish field
  const emailFromRoot = maybeEmail(
    (root.email as unknown) ?? (root.contact_email as unknown) ?? (root.user_email as unknown)
  );
  if (emailFromRoot) return emailFromRoot;

  return null;
}

/**
 * Get base URL - prioritizes BASE_URL env variable for production reliability
 */
function getBaseUrl(request: Request): string {
  // Prioritize BASE_URL environment variable (most reliable in production)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
  }
  
  // Fallback to request headers (useful in development)
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Final fallback
  return "http://localhost:3000";
}

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
                `\n[${idx + 1}] ${d.name}`,
                `    id: ${d.id}`,
                d.category ? `    category: ${d.category}` : null,
                d.description ? `    when to use: ${d.description}` : null,
                d.default_estimate_points != null ? `    points: ${d.default_estimate_points}` : null,
                d.fixed_hours != null ? `    fixed_hours: ${d.fixed_hours}h` : null,
                d.fixed_price != null ? `    fixed_price: $${d.fixed_price}` : null,
                d.scope ? `    scope: ${d.scope.replace(/\n/g, '\n           ')}` : null,
              ].filter(Boolean);
              return parts.join("\n");
            })
            .join("\n");

    // Load active sprint packages
    const packagesRes = await pool.query(
      `SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.category,
        sp.tagline,
        sp.flat_fee,
        sp.flat_hours,
        sp.discount_percentage,
        COALESCE(
          json_agg(
            json_build_object(
              'deliverableId', d.id,
              'name', d.name,
              'quantity', spd.quantity
            ) ORDER BY spd.sort_order ASC
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) as deliverables
      FROM sprint_packages sp
      LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
      LEFT JOIN deliverables d ON spd.deliverable_id = d.id AND d.active = true
      WHERE sp.active = true
      GROUP BY sp.id
      ORDER BY sp.featured DESC, sp.sort_order ASC
      LIMIT 20`
    );
    
    type PackageRow = {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      category: string | null;
      tagline: string | null;
      flat_fee: number | null;
      flat_hours: number | null;
      discount_percentage: number | null;
      deliverables: Array<{
        deliverableId: string;
        name: string;
        quantity: number;
      }>;
    };
    
    const packagesList: PackageRow[] = packagesRes.rows;
    const packagesText =
      packagesList.length === 0
        ? "No sprint packages are currently available."
        : packagesList
            .map((p, idx) => {
              const deliverableList = p.deliverables
                .map((d) => `${d.name}${d.quantity > 1 ? ` (×${d.quantity})` : ""}`)
                .join(", ");
              const parts = [
                `\n[${idx + 1}] ${p.name}`,
                `    id: ${p.id}`,
                p.category ? `    category: ${p.category}` : null,
                p.tagline ? `    tagline: ${p.tagline}` : null,
                p.description ? `    description: ${p.description}` : null,
                p.flat_fee != null ? `    flat_fee: $${p.flat_fee}` : null,
                p.flat_hours != null ? `    flat_hours: ${p.flat_hours}h` : null,
                p.discount_percentage != null ? `    discount: ${p.discount_percentage}%` : null,
                `    includes: ${deliverableList}`,
              ].filter(Boolean);
              return parts.join("\n");
            })
            .join("\n");

    const catalogInstructions =
      "\n\n=== SPRINT PACKAGES & DELIVERABLES ===\n\n" +
      "You have TWO OPTIONS for recommending work to the client:\n\n" +
      "OPTION 1: Recommend a SPRINT PACKAGE (preferred when a good fit exists)\n" +
      "Sprint packages are pre-bundled collections of deliverables with fixed pricing.\n" +
      "They offer better value and are easier for clients to understand.\n" +
      "If you recommend a package, include 'sprintPackageId' in your JSON response.\n" +
      packagesText +
      "\n\n" +
      "OPTION 2: Recommend INDIVIDUAL DELIVERABLES (when no package fits)\n" +
      "Select 1-3 individual deliverables from the catalog below.\n" +
      "Each deliverable has fixed hours and fixed price (NOT estimates).\n" +
      "If you recommend individual deliverables, include them in 'deliverables' array.\n" +
      deliverablesText +
      "\n\n" +
      "INSTRUCTIONS:\n" +
      "- First check if any sprint package is a good fit for the client's needs\n" +
      "- If a package matches well, use 'sprintPackageId' in your response\n" +
      "- If no package fits, select 1-3 individual deliverables\n" +
      "- NEVER recommend both a package AND individual deliverables together\n" +
      "- Use EXACT IDs from the catalogs above\n" +
      "\n=== END CATALOG ===\n";

    const combinedUserPrompt = `${userPrompt}\n\n${catalogInstructions}`;

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

    // Extract sprint title and package ID from parsed draft
    let sprintTitle: string | null = null;
    let sprintPackageId: string | null = null;
    
    if (parsedDraft && typeof parsedDraft === "object") {
      if ("sprintTitle" in parsedDraft) {
        const titleValue = (parsedDraft as { sprintTitle?: unknown }).sprintTitle;
        if (typeof titleValue === "string") {
          sprintTitle = titleValue;
        }
      }
      if ("sprintPackageId" in parsedDraft) {
        const packageIdValue = (parsedDraft as { sprintPackageId?: unknown }).sprintPackageId;
        if (typeof packageIdValue === "string" && packageIdValue.trim()) {
          sprintPackageId = packageIdValue.trim();
        }
      }
    }

    // Store sprint draft with optional package reference
    await pool.query(
      `
      INSERT INTO sprint_drafts (id, document_id, ai_response_id, draft, status, title, sprint_package_id, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, 'draft', $5, $6, now())
    `,
      [sprintDraftId, params.id, aiResponseId, JSON.stringify(parsedDraft), sprintTitle, sprintPackageId]
    );
    console.log("[SprintAPI] Created sprint_drafts row", { 
      sprintDraftId, 
      documentId: params.id, 
      title: sprintTitle,
      sprintPackageId 
    });

    let totalPoints = 0;
    let totalHours = 0;
    let totalBudget = 0;
    let deliverablesCount = 0;

    // If a sprint package is specified, use its deliverables
    if (sprintPackageId) {
      console.log("[SprintAPI] Using sprint package", { sprintPackageId });
      
      // Fetch package deliverables
      const pkgDelResult = await pool.query(
        `
        SELECT 
          spd.deliverable_id,
          spd.quantity,
          d.default_estimate_points,
          d.fixed_hours,
          d.fixed_price
        FROM sprint_package_deliverables spd
        JOIN deliverables d ON spd.deliverable_id = d.id
        WHERE spd.sprint_package_id = $1
        ORDER BY spd.sort_order ASC
      `,
        [sprintPackageId]
      );

      for (const row of pkgDelResult.rows) {
        const deliverableId = row.deliverable_id;
        const quantity = row.quantity ?? 1;
        const points = (row.default_estimate_points ?? 0) * quantity;
        const hours = (row.fixed_hours ?? 0) * quantity;
        const price = (row.fixed_price ?? 0) * quantity;

        totalPoints += points;
        totalHours += hours;
        totalBudget += price;
        deliverablesCount += quantity;

        // Link deliverable to sprint
        const junctionId = crypto.randomUUID();
        await pool.query(
          `
          INSERT INTO sprint_deliverables (id, sprint_draft_id, deliverable_id, quantity)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING
        `,
          [junctionId, sprintDraftId, deliverableId, quantity]
        );
      }

      console.log("[SprintAPI] Linked package deliverables", {
        sprintDraftId,
        sprintPackageId,
        deliverablesCount,
        totalPoints,
        totalHours,
        totalBudget,
      });
    }
    // Otherwise, extract deliverables from parsed draft and link them
    else if (parsedDraft && typeof parsedDraft === "object" && "deliverables" in parsedDraft) {
      const deliverables = (parsedDraft as { deliverables?: unknown }).deliverables;
      if (Array.isArray(deliverables)) {
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
              if (delRes.rowCount && delRes.rowCount > 0) {
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
                deliverablesCount++;

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

        console.log("[SprintAPI] Linked individual deliverables and calculated totals", {
          sprintDraftId,
          totalPoints,
          totalHours,
          totalBudget,
          deliverablesCount,
        });
      }
    }

    // Update sprint_drafts with calculated totals (for both package and individual deliverables)
    if (deliverablesCount > 0) {
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
        [totalPoints, totalHours, totalBudget, deliverablesCount, sprintDraftId]
      );
    }

    // Send email notification to the user who submitted the form
    try {
      // Extract email from document content
      const userEmail = extractEmailFromDocument(document.content);
      
      if (userEmail) {
        // Get the base URL for the sprint link
        const baseUrl = getBaseUrl(request);
        const sprintUrl = `${baseUrl}/sprints/${sprintDraftId}`;
        
        // Generate email content
        const emailContent = generateSprintDraftEmail({
          sprintTitle: sprintTitle || "Your Sprint Plan",
          sprintUrl,
        });
        
        // Send the email
        const emailResult = await sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
        
        if (emailResult.success) {
          console.log("[SprintAPI] Notification email sent", {
            sprintDraftId,
            to: userEmail,
            messageId: emailResult.messageId,
          });
        } else {
          console.warn("[SprintAPI] Failed to send notification email", {
            sprintDraftId,
            to: userEmail,
            error: emailResult.error,
          });
        }
      } else {
        console.warn("[SprintAPI] No email found in document, skipping notification", {
          documentId: params.id,
        });
      }
    } catch (emailError: unknown) {
      // Don't fail the sprint creation if email fails
      console.error("[SprintAPI] Error sending notification email", {
        sprintDraftId,
        error: (emailError as Error).message,
      });
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


