"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Typography from "@/components/ui/Typography";

type Idea = {
  id: string;
  title: string;
  summary: string | null;
  milestone_id: string | null;
  milestone_name: string | null;
  milestone_target_date: string | null;
  task_count: number;
  completed_task_count: number;
  created_at: string;
};

type Props = {
  projectId: string;
};

export default function ProjectTasks({ projectId }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New idea modal state
  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaSummary, setNewIdeaSummary] = useState("");
  const [creatingIdea, setCreatingIdea] = useState(false);

  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tasks/ideas");
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      // Filter to only ideas linked to this project
      const projectIdeas = data.ideas.filter(
        (idea: Idea & { project_id: string | null }) => idea.project_id === projectId
      );
      setIdeas(projectIdeas);
      setError(null);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ideas");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const createIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;

    try {
      setCreatingIdea(true);
      const res = await fetch("/api/admin/tasks/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIdeaTitle,
          summary: newIdeaSummary || null,
          project_id: projectId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create idea");
      }

      setNewIdeaTitle("");
      setNewIdeaSummary("");
      setShowNewIdeaModal(false);
      await fetchIdeas();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create idea");
    } finally {
      setCreatingIdea(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="py-4 text-sm opacity-70">Loading ideas...</div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-sm text-red-600 dark:text-red-400">{error}</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Typography as="h2" scale="h3">
            Ideas
          </Typography>
          <Typography as="span" scale="body-sm" className="opacity-60">
            {ideas.length} total
          </Typography>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewIdeaModal(true)}
            className="inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm hover:bg-black/80 dark:hover:bg-white/80 transition"
          >
            + New idea
          </button>
          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Manage all ideas →
          </Link>
        </div>
      </div>

      {ideas.length === 0 ? (
        <Typography as="div" scale="body-sm" className="opacity-70">
          No ideas yet.{" "}
          <button
            onClick={() => setShowNewIdeaModal(true)}
            className="text-blue-600 hover:underline"
          >
            Create a new idea
          </button>{" "}
          or link existing ideas from the{" "}
          <Link href="/dashboard/tasks" className="text-blue-600 hover:underline">
            Ideas dashboard
          </Link>
          .
        </Typography>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => {
            const progress = idea.task_count > 0
              ? Math.round((idea.completed_task_count / idea.task_count) * 100)
              : 0;

            return (
              <Link
                key={idea.id}
                href={`/dashboard/tasks/${idea.id}`}
                className="block p-4 border border-black/10 dark:border-white/15 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{idea.title}</div>
                    {idea.summary && (
                      <div className="text-sm opacity-70 mt-1 line-clamp-1">
                        {idea.summary}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {/* Progress */}
                      {idea.task_count > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs opacity-60">
                            {idea.completed_task_count}/{idea.task_count}
                          </span>
                        </div>
                      )}

                      {/* Milestone */}
                      {idea.milestone_name && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          🎯 {idea.milestone_name}
                          {idea.milestone_target_date && (
                            <span className="opacity-70">
                              · {formatDate(idea.milestone_target_date)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-sm opacity-50">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Idea Modal */}
      {showNewIdeaModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewIdeaModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <Typography as="h3" scale="h3">
                New Idea
              </Typography>
              <button
                onClick={() => setShowNewIdeaModal(false)}
                className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={createIdea} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="What's the idea?"
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creatingIdea}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Summary <span className="opacity-50">(optional)</span>
                </label>
                <textarea
                  value={newIdeaSummary}
                  onChange={(e) => setNewIdeaSummary(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={creatingIdea}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewIdeaModal(false);
                    setNewIdeaTitle("");
                    setNewIdeaSummary("");
                  }}
                  className="px-4 py-2 text-sm border border-black/10 dark:border-white/15 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingIdea || !newIdeaTitle.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {creatingIdea ? "Creating..." : "Create Idea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
