import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { createSprintForDocument } from "@/lib/sprint-creation";

type Params = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Params) {
  try {
    console.log("[SprintAPI] Manual sprint creation triggered", {
      documentId: params.id,
    });
    await ensureSchema();

    // Extract model from request body (optional)
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

    // Use shared sprint creation function
    const result = await createSprintForDocument(params.id, model);

    if (!result.success) {
      const status = result.error === "Document not found" ? 404 : 500;
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status }
      );
    }

    return NextResponse.json(
      { sprintDraftId: result.sprintDraftId },
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
