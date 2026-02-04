"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchIdeas = async () => {
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
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [projectId]);

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
      <div className="py-4 text-sm opacity-70">Loading tasks...</div>
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
            Tasks
          </Typography>
          <Typography as="span" scale="body-sm" className="opacity-60">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""} linked
          </Typography>
        </div>
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          Manage all tasks →
        </Link>
      </div>

      {ideas.length === 0 ? (
        <Typography as="div" scale="body-sm" className="opacity-70">
          No ideas linked to this project. Link ideas from the{" "}
          <Link href="/dashboard/tasks" className="text-blue-600 hover:underline">
            Tasks dashboard
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
    </div>
  );
}
