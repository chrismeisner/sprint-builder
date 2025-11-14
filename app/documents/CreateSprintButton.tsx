"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  documentId: string;
  model?: string;
};

export default function CreateSprintButton({ documentId, model }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onClick() {
    try {
      const clickedAt = new Date().toISOString();
      const requestUrl = `/api/documents/${documentId}/sprint`;
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "server";
      const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

      console.log("[CreateSprint] Clicked", {
        documentId,
        clickedAt,
        userAgent: ua,
      });

      setError(null);
      setLoading(true);
      console.log("[CreateSprint] Sending request", {
        method: "POST",
        url: requestUrl,
        model,
      });
      const res = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          typeof model === "string" && model.length > 0 ? { model } : {}
        ),
      });
      const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      const durationMs = Math.round((endTime - startTime) * 100) * 0.01;
      console.log("[CreateSprint] Response received", {
        status: res.status,
        ok: res.ok,
        durationMs,
      });
      const data = await res.json().catch(() => ({}));
      const preview =
        typeof data === "object" && data !== null
          ? JSON.stringify(data).slice(0, 600)
          : String(data).slice(0, 600);
      console.debug("[CreateSprint] Response JSON preview", {
        keys: data && typeof data === "object" ? Object.keys(data) : [],
        preview,
      });
      if (!res.ok) {
        const errorData: { error?: string; details?: unknown } =
          typeof data === "object" && data !== null ? (data as { error?: string; details?: unknown }) : {};
        console.error("[CreateSprint] Request failed", {
          status: res.status,
          error: errorData.error,
          details: errorData.details,
        });
        setError(errorData.error || "Failed to create sprint draft");
        return;
      }
      // Navigate to the document detail to view the new sprint draft listing
      console.log("[CreateSprint] Navigating to document page", {
        to: `/documents/${documentId}`,
      });
      router.push(`/documents/${documentId}`);
    } catch (e) {
      console.error("[CreateSprint] Exception during request", {
        message: (e as Error)?.message,
        name: (e as Error)?.name,
      });
      setError((e as Error).message);
    } finally {
      console.log("[CreateSprint] Finished");
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Sprint"}
      </button>
      {error ? <span className="text-red-600 text-xs">{error}</span> : null}
    </div>
  );
}


