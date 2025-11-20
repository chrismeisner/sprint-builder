import { getPool } from "@/lib/db";
import { DEFAULT_SPRINT_SYSTEM_PROMPT, DEFAULT_SPRINT_USER_PROMPT } from "@/lib/prompts";
import { sendEmail, generateSprintDraftEmail } from "@/lib/email";

/**
 * Structured client data extracted from Typeform
 */
type ClientData = {
  projectName: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  projectDescription: string | null;
  currentStage: string | null;
  roles: string[];
  teamSize: string | null;
  helpNeeded: string | null;
  existingDesigns: string | null;
  deliverablesPriority: string[];
  mainUseCase: string[];
  timeline: string | null;
};

/**
 * Extract structured client data from Typeform document
 * Uses field titles from the definition to identify the right answers
 */
function extractClientDataFromTypeform(content: unknown): ClientData {
  const result: ClientData = {
    projectName: null,
    firstName: null,
    lastName: null,
    fullName: null,
    email: null,
    projectDescription: null,
    currentStage: null,
    roles: [],
    teamSize: null,
    helpNeeded: null,
    existingDesigns: null,
    deliverablesPriority: [],
    mainUseCase: [],
    timeline: null,
  };

  if (!content || typeof content !== "object") return result;
  const root = content as Record<string, unknown>;

  const formResponse = root.form_response as unknown;
  if (!formResponse || typeof formResponse !== "object") return result;

  const fr = formResponse as {
    answers?: unknown[];
    definition?: { fields?: unknown[] };
  };

  if (!Array.isArray(fr.answers)) return result;

  // Build a map of field IDs to titles for easy lookup
  const fieldTitles = new Map<string, string>();
  if (fr.definition && typeof fr.definition === "object") {
    const def = fr.definition as { fields?: unknown[] };
    if (Array.isArray(def.fields)) {
      for (const field of def.fields) {
        if (field && typeof field === "object") {
          const f = field as { id?: string; title?: string };
          if (f.id && f.title) {
            fieldTitles.set(f.id, f.title.toLowerCase());
          }
        }
      }
    }
  }

  // Extract answers
  for (const ans of fr.answers) {
    if (!ans || typeof ans !== "object") continue;

    const answer = ans as {
      type?: string;
      text?: string;
      email?: string;
      choice?: { label?: string };
      choices?: { labels?: string[] };
      boolean?: boolean;
      field?: { id?: string };
    };

    const fieldId = answer.field?.id;
    const fieldTitle = fieldId ? fieldTitles.get(fieldId) : null;

    // Project name
    if (fieldTitle?.includes("name of your startup") || fieldTitle?.includes("name of your project")) {
      result.projectName = answer.text || null;
    }

    // First name
    else if (fieldTitle?.includes("first name")) {
      result.firstName = answer.text || null;
    }

    // Last name
    else if (fieldTitle?.includes("last name")) {
      result.lastName = answer.text || null;
    }

    // Email
    else if (answer.type === "email" && answer.email) {
      result.email = answer.email;
    }

    // Project description
    else if (fieldTitle?.includes("what are you building")) {
      result.projectDescription = answer.text || null;
    }

    // Current stage
    else if (fieldTitle?.includes("current stage")) {
      result.currentStage = answer.choice?.label || null;
    }

    // Role(s)
    else if (fieldTitle?.includes("role")) {
      if (answer.choices?.labels) {
        result.roles = answer.choices.labels;
      } else if (answer.choice?.label) {
        result.roles = [answer.choice.label];
      }
    }

    // Team size
    else if (fieldTitle?.includes("how big is your team")) {
      result.teamSize = answer.choice?.label || null;
    }

    // What help is needed
    else if (fieldTitle?.includes("need help with")) {
      result.helpNeeded = answer.choice?.label || null;
    }

    // Existing designs
    else if (fieldTitle?.includes("interface") || fieldTitle?.includes("ux designs")) {
      result.existingDesigns = answer.choice?.label || null;
    }

    // Deliverables priority
    else if (fieldTitle?.includes("deliverables matter most") || fieldTitle?.includes("*p2*")) {
      if (answer.choices?.labels) {
        result.deliverablesPriority = answer.choices.labels;
      }
    }

    // Main use case
    else if (fieldTitle?.includes("main use case") || fieldTitle?.includes("*p3")) {
      if (answer.choices?.labels) {
        result.mainUseCase = answer.choices.labels;
      }
    }

    // Timeline
    else if (fieldTitle?.includes("how soon")) {
      result.timeline = answer.choice?.label || null;
    }
  }

  // Construct full name
  if (result.firstName && result.lastName) {
    result.fullName = `${result.firstName} ${result.lastName}`;
  } else if (result.firstName) {
    result.fullName = result.firstName;
  } else if (result.lastName) {
    result.fullName = result.lastName;
  }

  return result;
}

/**
 * Get base URL - prioritizes BASE_URL env variable for production reliability
 */
function getBaseUrl(): string {
  // Prioritize BASE_URL environment variable (most reliable in production)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
  }
  
  // Final fallback
  return "http://localhost:3000";
}

type CreateSprintResult = {
  success: boolean;
  sprintDraftId?: string;
  error?: string;
  details?: unknown;
};

/**
 * Automatically create a sprint draft for a document
 * This is the core logic extracted from /api/documents/[id]/sprint
 */
export async function createSprintForDocument(
  documentId: string,
  model: string = "gpt-4o-mini"
): Promise<CreateSprintResult> {
  try {
    const startedAt = new Date().toISOString();
    console.log("[AutoSprint] Start", {
      startedAt,
      documentId,
      model,
    });

    const pool = getPool();

    // Load document
    const docRes = await pool.query(
      `SELECT id, content FROM documents WHERE id = $1`,
      [documentId]
    );
    if (docRes.rowCount === 0) {
      console.warn("[AutoSprint] Document not found", { documentId });
      return { success: false, error: "Document not found" };
    }
    const document = docRes.rows[0] as { id: string; content: unknown };
    const docSize = (() => {
      try {
        return JSON.stringify(document.content)?.length ?? 0;
      } catch {
        return -1;
      }
    })();
    console.log("[AutoSprint] Loaded document", { documentId, docSize });

    const apiKey = process.env.OPENAI_API_KEY;
    const openaiProject = process.env.OPENAI_PROJECT_ID;
    const openaiOrg = process.env.OPENAI_ORG_ID;
    if (!apiKey) {
      console.error("[AutoSprint] Missing OPENAI_API_KEY");
      return { success: false, error: "OPENAI_API_KEY is not configured" };
    }

    // Allowlist models to avoid arbitrary values
    const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
    if (!ALLOWED_MODELS.has(model)) {
      console.warn("[AutoSprint] Model not allowed; falling back", { model });
      model = "gpt-4o-mini";
    }
    console.log("[AutoSprint] Using model", {
      model,
      hasApiKey: Boolean(apiKey),
    });

    // Guard extremely large documents to avoid blowing token limits
    if (docSize > 100_000) {
      console.warn("[AutoSprint] Document too large for AI request", { documentId, docSize });
      return {
        success: false,
        error: "Document too large to send to OpenAI.",
        details: { docSize, limit: 100000 },
      };
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

    // Extract structured client data from Typeform submission
    const clientData = extractClientDataFromTypeform(document.content);
    console.log("[AutoSprint] Extracted client data", {
      projectName: clientData.projectName,
      fullName: clientData.fullName,
      email: clientData.email,
      hasDescription: !!clientData.projectDescription,
    });

    // Build a personalized context summary for the AI
    const contextParts: string[] = [];
    
    if (clientData.projectName) {
      contextParts.push(`PROJECT NAME: ${clientData.projectName}`);
    }
    
    if (clientData.fullName) {
      contextParts.push(`CLIENT: ${clientData.fullName}`);
    }
    
    if (clientData.projectDescription) {
      contextParts.push(`WHAT THEY'RE BUILDING: ${clientData.projectDescription}`);
    }
    
    if (clientData.currentStage) {
      contextParts.push(`CURRENT STAGE: ${clientData.currentStage}`);
    }
    
    if (clientData.roles.length > 0) {
      contextParts.push(`CLIENT'S ROLE(S): ${clientData.roles.join(", ")}`);
    }
    
    if (clientData.teamSize) {
      contextParts.push(`TEAM SIZE: ${clientData.teamSize}`);
    }
    
    if (clientData.helpNeeded) {
      contextParts.push(`PRIMARY NEED: ${clientData.helpNeeded}`);
    }
    
    if (clientData.existingDesigns) {
      contextParts.push(`EXISTING DESIGNS: ${clientData.existingDesigns}`);
    }
    
    if (clientData.deliverablesPriority.length > 0) {
      contextParts.push(`PRIORITY DELIVERABLES: ${clientData.deliverablesPriority.join(", ")}`);
    }
    
    if (clientData.mainUseCase.length > 0) {
      contextParts.push(`MAIN USE CASE: ${clientData.mainUseCase.join(", ")}`);
    }
    
    if (clientData.timeline) {
      contextParts.push(`TIMELINE: ${clientData.timeline}`);
    }

    const personalizedContext = contextParts.length > 0
      ? "\n\n=== CLIENT CONTEXT ===\n\n" + contextParts.join("\n") + "\n\n=== END CONTEXT ===\n"
      : "";

    const combinedUserPrompt = `${userPrompt}\n\n${catalogInstructions}${personalizedContext}`;

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
            "Full client intake data (Typeform JSON):\n\n```json\n" +
            JSON.stringify(document.content, null, 2) +
            "\n```",
        },
      ],
    };
    console.log("[AutoSprint] Sending OpenAI request", {
      endpoint: "https://api.openai.com/v1/chat/completions",
      model,
      temperature: requestBody.temperature,
      messagesCount: requestBody.messages.length,
      docSize,
    });

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (openaiProject) headers["OpenAI-Project"] = openaiProject;
    if (openaiOrg) headers["OpenAI-Organization"] = openaiOrg;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("[AutoSprint] OpenAI API error", {
        status: openaiRes.status,
        statusText: openaiRes.statusText,
        body: errText.slice(0, 500),
      });
      return {
        success: false,
        error: `OpenAI API error: ${openaiRes.status} ${openaiRes.statusText}`,
        details: errText.slice(0, 500),
      };
    }

    const openaiData = (await openaiRes.json()) as {
      id: string;
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string;
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const content = openaiData.choices?.[0]?.message?.content || "{}";
    const usage = openaiData.usage;
    console.log("[AutoSprint] OpenAI response", {
      openaiId: openaiData.id,
      finishReason: openaiData.choices?.[0]?.finish_reason,
      contentLength: content.length,
      usage,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("[AutoSprint] Failed to parse AI response as JSON", {
        parseError: (parseError as Error).message,
        contentPreview: content.slice(0, 300),
      });
      return {
        success: false,
        error: "AI did not return valid JSON",
        details: content.slice(0, 300),
      };
    }

    const maybeObj = parsed as Record<string, unknown> | null;
    if (!maybeObj || typeof maybeObj !== "object") {
      console.error("[AutoSprint] AI JSON not an object", { parsed });
      return {
        success: false,
        error: "AI response is not a valid object",
        details: parsed,
      };
    }

    // Validate sprintPackageId if provided
    if (maybeObj.sprintPackageId && typeof maybeObj.sprintPackageId === "string") {
      const pkgCheck = await pool.query(
        `SELECT id FROM sprint_packages WHERE id = $1 AND active = true`,
        [maybeObj.sprintPackageId]
      );
      if (pkgCheck.rowCount === 0) {
        console.warn("[AutoSprint] AI returned invalid sprintPackageId", {
          sprintPackageId: maybeObj.sprintPackageId,
        });
        delete maybeObj.sprintPackageId;
      }
    }

    // Validate deliverables if provided
    if (Array.isArray(maybeObj.deliverables)) {
      const validDeliverables = [];
      for (const d of maybeObj.deliverables) {
        if (d && typeof d === "object") {
          const deliverableId = (d as { id?: unknown }).id;
          if (typeof deliverableId === "string") {
            const delCheck = await pool.query(
              `SELECT id FROM deliverables WHERE id = $1 AND active = true`,
              [deliverableId]
            );
            if (delCheck.rowCount && delCheck.rowCount > 0) {
              validDeliverables.push(d);
            } else {
              console.warn("[AutoSprint] AI returned invalid deliverableId", { deliverableId });
            }
          }
        }
      }
      maybeObj.deliverables = validDeliverables;
    }

    // Extract title for the sprint draft, with personalized fallback
    let title: string;
    if (typeof maybeObj.title === "string" && maybeObj.title.length > 0) {
      title = maybeObj.title.slice(0, 255);
    } else {
      // Generate a personalized default title using client data
      if (clientData.projectName) {
        title = `Sprint Plan for ${clientData.projectName}`;
      } else if (clientData.fullName) {
        title = `Sprint Plan for ${clientData.fullName}`;
      } else {
        title = "Sprint Draft";
      }
    }

    // Store AI response
    const responseId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO ai_responses (id, model, prompt_tokens, completion_tokens, total_tokens, response_json)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        responseId,
        model,
        usage?.prompt_tokens ?? null,
        usage?.completion_tokens ?? null,
        usage?.total_tokens ?? null,
        JSON.stringify(maybeObj),
      ]
    );
    console.log("[AutoSprint] Stored AI response", { responseId });

    // Store sprint draft
    const draftId = crypto.randomUUID();
    const sprintPackageId =
      typeof maybeObj.sprintPackageId === "string" ? maybeObj.sprintPackageId : null;
    await pool.query(
      `
      INSERT INTO sprint_drafts (id, document_id, ai_response_id, draft, status, title, sprint_package_id, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, 'draft', $5, $6, now())
    `,
      [draftId, documentId, responseId, JSON.stringify(maybeObj), title, sprintPackageId]
    );
    console.log("[AutoSprint] Stored sprint draft", {
      draftId,
      title,
      sprintPackageId,
    });

    // Send email notification (non-blocking)
    const recipientEmail = clientData.email;
    if (recipientEmail) {
      const baseUrl = getBaseUrl();
      const sprintUrl = `${baseUrl}/sprints/${draftId}`;
      const emailContent = generateSprintDraftEmail({
        sprintTitle: title,
        sprintUrl,
        clientName: clientData.firstName || undefined,
        projectName: clientData.projectName || undefined,
      });
      
      sendEmail({
        to: recipientEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      }).catch((error) => {
        console.error("[AutoSprint] Failed to send sprint draft email:", error);
        // Don't throw - we don't want email failures to break sprint creation
      });
      
      console.log("[AutoSprint] Email notification queued", {
        to: recipientEmail,
        sprintUrl,
        clientName: clientData.firstName,
        projectName: clientData.projectName,
      });
    } else {
      console.warn("[AutoSprint] No recipient email found in document");
    }

    console.log("[AutoSprint] Complete", {
      draftId,
      documentId,
      duration: `${Date.now() - new Date(startedAt).getTime()}ms`,
    });

    return {
      success: true,
      sprintDraftId: draftId,
    };
  } catch (error: unknown) {
    console.error("[AutoSprint] Error creating sprint", {
      documentId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    return {
      success: false,
      error: (error as Error).message ?? "Unknown error",
    };
  }
}

