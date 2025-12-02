import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  EMPHASIS_MAP,
  EMPHASIS_OPTIONS,
  FORMAT_MAP,
  FORMAT_OPTIONS,
  HOW_IT_WORKS_MAX_STEPS,
  HOW_IT_WORKS_MIN_STEPS,
  HOW_IT_WORKS_PLAN_JSON_SCHEMA,
  HowItWorksPlan,
  PERSONALITY_MAP,
  PERSONALITY_OPTIONS,
  STRATEGY_MAP,
  STRATEGY_OPTIONS,
  sanitizePlan,
} from "@/lib/how-it-works-writer";

type GenerateBody = {
  productExplanation?: string;
  steps?: number;
  strategy?: string;
  personality?: string;
  emphasis?: string;
  format?: string;
  model?: string;
};

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
const DEFAULT_MODEL = "gpt-4o-mini";

function clampSteps(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 3;
  }
  const rounded = Math.round(numeric);
  return Math.min(HOW_IT_WORKS_MAX_STEPS, Math.max(HOW_IT_WORKS_MIN_STEPS, rounded));
}

function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const requestId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    let body: GenerateBody = {};
    try {
      body = (await request.json()) as GenerateBody;
    } catch {
      body = {};
    }

    const productExplanation = (body.productExplanation ?? "").trim();
    if (!productExplanation) {
      return NextResponse.json({ error: "productExplanation is required" }, { status: 400 });
    }

    const steps = clampSteps(body.steps);
    const strategy = STRATEGY_MAP[body.strategy ?? ""] ?? STRATEGY_OPTIONS[0];
    const personality = PERSONALITY_MAP[body.personality ?? ""] ?? PERSONALITY_OPTIONS[0];
    const emphasis = EMPHASIS_MAP[body.emphasis ?? ""] ?? EMPHASIS_OPTIONS[0];
    const format = FORMAT_MAP[body.format ?? ""] ?? FORMAT_OPTIONS[0];

    let modelCandidate = (body.model ?? "").trim();
    if (!ALLOWED_MODELS.has(modelCandidate)) {
      modelCandidate = DEFAULT_MODEL;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const openaiProject = process.env.OPENAI_PROJECT_ID;
    const openaiOrg = process.env.OPENAI_ORG_ID;
    if (!apiKey) {
      console.error("[HowItWorksWriter] Missing OPENAI_API_KEY");
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const systemPrompt =
      "You are a senior narrative strategist at a world-class product studio. You write high-converting 'How It Works' sections that make complex offerings legible. Be specific, avoid filler, and speak directly to the buyer.";

    const userPrompt = [
      `Product summary:\n${productExplanation}`,
      `Steps required: ${steps} distinct phases.`,
      `Strategy (${strategy.label}): ${strategy.guidance}`,
      `Personality (${personality.label}): ${personality.guidance}`,
      `Emphasis (${emphasis.label}): ${emphasis.guidance}`,
      `Format (${format.label}): ${format.guidance}`,
      "Output requirements:",
      "- Return JSON matching the provided schema (headline, intro, steps, optional outro/callToAction/toneNotes/formatNotes).",
      "- Each step must include: title (max ~6 words), description (<= 60 words), optional proofPoint, optional successSignal.",
      "- Keep claims grounded in the supplied product summary—no hallucinated metrics.",
      "- Include a succinct callToAction if relevant.",
    ].join("\n\n");

    const requestBody = {
      model: modelCandidate,
      temperature: 0.65,
      top_p: 0.9,
      max_tokens: 900,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "how_it_works_plan",
          schema: HOW_IT_WORKS_PLAN_JSON_SCHEMA,
        },
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "form-intake/how-it-works-writer",
      "Idempotency-Key": requestId,
    };
    if (openaiProject) headers["OpenAI-Project"] = openaiProject;
    if (openaiOrg) headers["OpenAI-Organization"] = openaiOrg;

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
    } catch (error) {
      clearTimeout(timeout);
      const err = error as Error;
      if (err.name === "AbortError") {
        console.error("[HowItWorksWriter] OpenAI request timed out", { requestId });
        return NextResponse.json({ error: "OpenAI request timed out" }, { status: 504 });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!openAIRes.ok) {
      const errText = await openAIRes.text().catch(() => "");
      console.error("[HowItWorksWriter] OpenAI error", {
        status: openAIRes.status,
        statusText: openAIRes.statusText,
        bodyPreview: errText.slice(0, 500),
      });
      const status = openAIRes.status === 429 ? 429 : openAIRes.status === 401 ? 401 : 502;
      return NextResponse.json({ error: "OpenAI request failed", details: errText }, { status });
    }

    type CompletionResponse = {
      id?: string;
      choices: Array<{ message: { content: string | null } }>;
    };
    const completion = (await openAIRes.json()) as CompletionResponse;
    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json({ error: "OpenAI response missing content" }, { status: 502 });
    }

    let parsedPlan: HowItWorksPlan | null = null;
    try {
      const jsonPayload = JSON.parse(stripCodeFences(rawContent));
      parsedPlan = sanitizePlan(jsonPayload);
    } catch (error) {
      console.error("[HowItWorksWriter] Failed to parse JSON", {
        message: (error as Error)?.message,
        preview: rawContent.slice(0, 200),
      });
    }

    if (!parsedPlan) {
      return NextResponse.json({ error: "Unable to interpret OpenAI response." }, { status: 502 });
    }

    const normalizedPlan: HowItWorksPlan = {
      ...parsedPlan,
      steps: parsedPlan.steps.slice(0, steps),
    };

    const meta = {
      requestId,
      model: modelCandidate,
      openaiId: completion.id,
      stepsRequested: steps,
      stepsReturned: parsedPlan.steps.length,
      strategy: strategy.value,
      personality: personality.value,
      emphasis: emphasis.value,
      format: format.value,
    };

    return NextResponse.json({ success: true, plan: normalizedPlan, meta });
  } catch (error) {
    console.error("[HowItWorksWriter] Unhandled error", {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack?.slice(0, 800),
    });
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


