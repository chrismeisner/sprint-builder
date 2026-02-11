"use client";

import { useState, useEffect, useRef } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
};

type Props = {
  sprintId: string;
  currentUserEmail: string | null;
  currentUserName: string | null;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Simple hash to pick a consistent color per email
function avatarColor(email: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-fuchsia-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function SprintComments({
  sprintId,
  currentUserEmail,
  currentUserName,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!currentUserEmail;

  const bodyClass = getTypographyClassName("body-md");
  const bodySmClass = getTypographyClassName("body-sm");
  const labelClass = getTypographyClassName("body-sm");
  const cardTitleClass = getTypographyClassName("subtitle-md");

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintId]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // Silently fail — comments are non-critical
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || posting) return;
    setError(null);
    setPosting(true);

    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setBody("");

      // Scroll to bottom after posting
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-800">
        <h2 className={`${cardTitleClass} text-text-primary`}>
          Comments{" "}
          {comments.length > 0 && (
            <span className="text-text-secondary font-normal">
              ({comments.length})
            </span>
          )}
        </h2>
      </div>

      {/* Comments list */}
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <p className={`${labelClass} text-text-secondary`}>
              Loading comments...
            </p>
          </div>
        ) : comments.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className={`${labelClass} text-text-secondary`}>
              No comments yet. Be the first to share your thoughts.
            </p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="px-6 py-4">
              <div className="flex gap-3">
                {/* Avatar */}
                <div
                  className={`shrink-0 w-8 h-8 rounded-full ${avatarColor(c.authorEmail)} flex items-center justify-center`}
                >
                  <span className="text-white text-xs font-semibold leading-none">
                    {getInitials(c.authorName)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className={`${bodySmClass} text-text-primary font-semibold`}
                    >
                      {c.authorName}
                    </span>
                    <span
                      className={`${labelClass} text-text-secondary`}
                      title={new Date(c.createdAt).toLocaleString()}
                    >
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p
                    className={`${bodyClass} text-text-primary mt-1 whitespace-pre-line`}
                  >
                    {c.body}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Comment form */}
      <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-800/50">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              {/* Current user avatar */}
              <div
                className={`shrink-0 w-8 h-8 rounded-full ${avatarColor(currentUserEmail)} flex items-center justify-center`}
              >
                <span className="text-white text-xs font-semibold leading-none">
                  {getInitials(currentUserName || currentUserEmail)}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={2}
                  placeholder="Leave a comment..."
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y min-h-[2.5rem]"
                />
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 pl-11">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!body.trim() || posting}
                className="inline-flex items-center rounded-md bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className={`${labelClass} text-text-secondary`}>
              <a
                href="/login"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Log in
              </a>{" "}
              to leave a comment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
