import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

type Params = {
  params: { id: string };
};

export async function POST(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    // Load document
    const docRes = await pool.query(
      `SELECT id, content FROM documents WHERE id = $1`,
      [params.id]
    );
    if (docRes.rowCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const document = docRes.rows[0] as { id: string; content: unknown };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model = "gpt-4o-mini";

    // Compose prompt
    const systemPrompt =
      "You are an experienced software project manager. Create a realistic, actionable 2-week sprint plan from the client's intake JSON. Return a single JSON object only.";
    const userPrompt =
      "This is an input form from a client that we're going to make a 2 week sprint from. Produce a JSON plan with fields: sprintTitle (string), goals (string[]), backlog (array of {id, title, description, estimatePoints, owner?, acceptanceCriteria?}), timeline (array of {day, focus, items: string[]}), assumptions (string[]), risks (string[]), notes (string[]). Use clear, concise language.";

    // Call OpenAI Chat Completions API with response_format json_object
    const openAIRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          {
            role: "user",
            content:
              "Client intake JSON:\n\n```json\n" +
              JSON.stringify(document.content, null, 2) +
              "\n```",
          },
        ],
      }),
    });

    if (!openAIRes.ok) {
      const errText = await openAIRes.text().catch(() => "");
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
    const messageContent = data.choices?.[0]?.message?.content ?? "";

    let parsedDraft: unknown = null;
    try {
      parsedDraft = JSON.parse(messageContent);
    } catch {
      // If not valid JSON, still store raw text and return error
    }

    const aiResponseId = crypto.randomUUID();
    const sprintDraftId = crypto.randomUUID();

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
        `${systemPrompt}\n\n${userPrompt}`,
        messageContent || null,
        parsedDraft ? JSON.stringify(parsedDraft) : null,
      ]
    );

    if (!parsedDraft) {
      // We stored the raw response, but cannot create a sprint draft without JSON
      return NextResponse.json(
        {
          aiResponseId,
          warning:
            "AI response was not valid JSON. Stored raw response; no sprint draft created.",
        },
        { status: 202 }
      );
    }

    // Store sprint draft
    await pool.query(
      `
      INSERT INTO sprint_drafts (id, document_id, ai_response_id, draft)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
      [sprintDraftId, params.id, aiResponseId, JSON.stringify(parsedDraft)]
    );

    return NextResponse.json(
      { sprintDraftId, aiResponseId },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


