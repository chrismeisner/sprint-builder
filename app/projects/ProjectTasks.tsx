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

type Task = {
  id: string;
  name: string;
  completed: boolean;
  parent_task_id: string | null;
  sort_order: number;
  sub_sort_order: number;
};

type Props = {
  projectId: string;
};

export default function ProjectTasks({ projectId }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasksByIdeaId, setTasksByIdeaId] = useState<Record<string, Task[]>>({});
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
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
      const projectIdeas = data.ideas.filter(
        (idea: Idea & { project_id: string | null }) => idea.project_id === projectId
      );
      setIdeas(projectIdeas);

      // Fetch tasks for all initiatives in parallel
      const taskResults = await Promise.all(
        projectIdeas.map((idea: Idea) =>
          fetch(`/api/admin/tasks/tasks?ideaId=${idea.id}`)
            .then((r) => r.json())
            .then((d) => ({ ideaId: idea.id, tasks: d.tasks as Task[] }))
            .catch(() => ({ ideaId: idea.id, tasks: [] }))
        )
      );

      const byId: Record<string, Task[]> = {};
      for (const { ideaId, tasks } of taskResults) {
        byId[ideaId] = tasks;
      }
      setTasksByIdeaId(byId);

      // Expand all by default
      setExpandedIdeas(new Set(projectIdeas.map((i: Idea) => i.id)));

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load initiatives");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const toggleExpanded = (ideaId: string) => {
    setExpandedIdeas((prev) => {
      const next = new Set(prev);
      if (next.has(ideaId)) {
        next.delete(ideaId);
      } else {
        next.add(ideaId);
      }
      return next;
    });
  };

  const toggleTaskComplete = async (ideaId: string, task: Task) => {
    if (togglingTaskId) return;
    setTogglingTaskId(task.id);

    // Optimistic update
    setTasksByIdeaId((prev) => ({
      ...prev,
      [ideaId]: prev[ideaId].map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      ),
    }));
    // Also update the aggregate count on the idea
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const delta = task.completed ? -1 : 1;
        return { ...idea, completed_task_count: idea.completed_task_count + delta };
      })
    );

    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Revert on failure
      setTasksByIdeaId((prev) => ({
        ...prev,
        [ideaId]: prev[ideaId].map((t) =>
          t.id === task.id ? { ...t, completed: task.completed } : t
        ),
      }));
      setIdeas((prev) =>
        prev.map((idea) => {
          if (idea.id !== ideaId) return idea;
          const delta = task.completed ? 1 : -1;
          return { ...idea, completed_task_count: idea.completed_task_count + delta };
        })
      );
    } finally {
      setTogglingTaskId(null);
    }
  };

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
        throw new Error(data.error || "Failed to create initiative");
      }

      const { idea } = await res.json();

      // Create a default task named "Finish <initiative title>"
      await fetch("/api/admin/tasks/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Finish ${newIdeaTitle.trim()}`,
          idea_id: idea.id,
        }),
      });

      setNewIdeaTitle("");
      setNewIdeaSummary("");
      setShowNewIdeaModal(false);
      await fetchIdeas();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create initiative");
    } finally {
      setCreatingIdea(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="py-4 text-sm opacity-70">Loading initiatives...</div>;
  }

  if (error) {
    return <div className="py-4 text-sm text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Typography as="h2" scale="h3">
            Initiatives
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
            + New initiative
          </button>
          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Manage all initiatives →
          </Link>
        </div>
      </div>

      {ideas.length === 0 ? (
        <Typography as="div" scale="body-sm" className="opacity-70">
          No initiatives yet.{" "}
          <button
            onClick={() => setShowNewIdeaModal(true)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create a new initiative
          </button>{" "}
          or link existing initiatives from the{" "}
          <Link href="/dashboard/tasks" className="text-blue-600 dark:text-blue-400 hover:underline">
            Tasks dashboard
          </Link>
          .
        </Typography>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => {
            const tasks = tasksByIdeaId[idea.id] ?? [];
            const topLevelTasks = tasks
              .filter((t) => !t.parent_task_id)
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return a.sort_order - b.sort_order;
              });
            const isExpanded = expandedIdeas.has(idea.id);
            const progress =
              idea.task_count > 0
                ? Math.round((idea.completed_task_count / idea.task_count) * 100)
                : 0;

            return (
              <div
                key={idea.id}
                className="border border-black/10 dark:border-white/15 rounded-lg overflow-hidden"
              >
                {/* Initiative header row */}
                <div className="flex items-start gap-3 p-4">
                  {/* Expand/collapse toggle */}
                  <button
                    onClick={() => toggleExpanded(idea.id)}
                    className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition text-xs"
                    aria-label={isExpanded ? "Collapse tasks" : "Expand tasks"}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{idea.title}</div>
                    {idea.summary && (
                      <div className="text-sm opacity-70 mt-0.5 line-clamp-1">
                        {idea.summary}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {/* Progress bar */}
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

                      {/* Milestone badge */}
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

                  <Link
                    href={`/dashboard/tasks/${idea.id}`}
                    className="flex-shrink-0 text-sm opacity-50 hover:opacity-100 transition px-1"
                    title="Open initiative"
                  >
                    →
                  </Link>
                </div>

                {/* Task list */}
                {isExpanded && (
                  <div className="border-t border-black/10 dark:border-white/15">
                    {topLevelTasks.length === 0 ? (
                      <div className="px-4 py-3 pl-12 text-sm opacity-50">
                        No tasks yet.{" "}
                        <Link
                          href={`/dashboard/tasks/${idea.id}`}
                          className="underline hover:opacity-80"
                        >
                          Add tasks →
                        </Link>
                      </div>
                    ) : (
                      <ul className="divide-y divide-black/5 dark:divide-white/5">
                        {topLevelTasks.map((task) => {
                          const subtaskCount = tasks.filter(
                            (t) => t.parent_task_id === task.id
                          ).length;
                          const completedSubtaskCount = tasks.filter(
                            (t) => t.parent_task_id === task.id && t.completed
                          ).length;

                          return (
                            <li
                              key={task.id}
                              className={`flex items-center gap-3 px-4 py-2.5 pl-12 ${
                                task.completed ? "opacity-50" : ""
                              }`}
                            >
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleTaskComplete(idea.id, task)}
                                disabled={togglingTaskId === task.id}
                                className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs transition ${
                                  task.completed
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-neutral-300 dark:border-neutral-600 hover:border-green-500"
                                } ${togglingTaskId === task.id ? "opacity-50 cursor-wait" : ""}`}
                              >
                                {task.completed && "✓"}
                              </button>

                              <span
                                className={`flex-1 text-sm ${
                                  task.completed ? "line-through" : ""
                                }`}
                              >
                                {task.name}
                              </span>

                              {/* Subtask count */}
                              {subtaskCount > 0 && (
                                <span className="text-xs opacity-40">
                                  {completedSubtaskCount}/{subtaskCount}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Initiative Modal */}
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
                New Initiative
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
                  placeholder="What's the initiative?"
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
                  {creatingIdea ? "Creating..." : "Create Initiative"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
