import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const startedAt = new Date().toISOString();
    const requestId = crypto.randomUUID();
    console.log("[AI Test] POST start", { requestId, startedAt, url: "/api/ai/test" });

    const apiKey = process.env.OPENAI_API_KEY;
    const openaiProject = process.env.OPENAI_PROJECT_ID;
    const openaiOrg = process.env.OPENAI_ORG_ID;
    if (!apiKey) {
      console.error("[AI Test] Missing OPENAI_API_KEY", { requestId });
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let model = "gpt-4o-mini";
    let prompt = 'Reply with the single word "pong".';
    try {
      const body = await request.json();
      if (body && typeof body === "object") {
        if (typeof body.model === "string" && body.model.trim()) {
          model = body.model.trim();
        }
        if (typeof body.prompt === "string" && body.prompt.trim()) {
          prompt = body.prompt.trim();
        }
      }
    } catch {
      // ignore body parse errors; use defaults
    }

    // Simple allowlist to avoid arbitrary/unsupported model usage
    const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
    if (!ALLOWED_MODELS.has(model)) {
      console.warn("[AI Test] Model not allowed; falling back", { requestId, model });
      model = "gpt-4o-mini";
    }

    const redact = (value?: string | null): string | null => {
      if (!value) return null;
      const len = value.length;
      if (len <= 8) return "*".repeat(len);
      return `${value.slice(0, 3)}${"*".repeat(Math.max(0, len - 7))}${value.slice(-4)}`;
    };

    console.log("[AI Test] Prepared request", {
      requestId,
      model,
      hasApiKey: Boolean(apiKey),
      hasProjectId: Boolean(openaiProject),
      keyPreview: redact(apiKey),
      projectPreview: redact(openaiProject || null),
      promptPreview: prompt.slice(0, 80),
    });

    const requestBody = {
      model,
      temperature: 0,
      max_tokens: 50,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    };

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "form-intake/0.1.0",
      "Idempotency-Key": requestId,
    };
    if (openaiProject) headers["OpenAI-Project"] = openaiProject;
    if (openaiOrg) headers["OpenAI-Organization"] = openaiOrg;

    // Add a timeout to avoid hanging requests
    const controller = new AbortController();
    const timeoutMs = 30_000;
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
        console.error("[AI Test] OpenAI request timed out", { requestId, timeoutMs });
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
      console.error("[AI Test] OpenAI error", {
        requestId,
        status: openAIRes.status,
        statusText: openAIRes.statusText,
        bodyPreview: errText.slice(0, 500),
      });
      if (openAIRes.status === 429) {
        return NextResponse.json(
          {
            error: "OpenAI quota exceeded (429). Check plan/billing.",
            details: errText,
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
    const content = data.choices?.[0]?.message?.content ?? "";

    console.log("[AI Test] OpenAI ok", {
      requestId,
      contentPreview: content.slice(0, 120),
    });

    return NextResponse.json({
      ok: true,
      model,
      content,
      meta: {
        requestId,
        startedAt,
        nodeEnv: process.env.NODE_ENV || "development",
        hasApiKey: true,
        apiKeyPreview: redact(apiKey),
        apiKeyLength: apiKey.length,
        openaiProjectPreview: redact(openaiProject || null),
        openaiProjectLength: (openaiProject || "").length,
      },
    });
  } catch (error: unknown) {
    console.error("[AI Test] Uncaught error", {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack?.slice(0, 800),
    });
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


