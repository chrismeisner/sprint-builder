"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Idea = {
  id: string;
  title: string;
  summary: string | null;
  sort_order: number;
  task_count: number;
  completed_task_count: number;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: string;
  idea_id: string | null;
  parent_task_id: string | null;
  milestone_id: string | null;
  name: string;
  note: string | null;
  completed: boolean;
  completed_at: string | null;
  focus: string;
  sort_order: number;
  sub_sort_order: number;
  idea_title: string | null;
  milestone_name: string | null;
  milestone_target_date: string | null;
  created_at: string;
};

export default function TasksClient() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New idea form
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaSummary, setNewIdeaSummary] = useState("");
  const [creatingIdea, setCreatingIdea] = useState(false);

  // Inline task creation
  const [newTaskIdeaId, setNewTaskIdeaId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ideasRes, tasksRes] = await Promise.all([
        fetch("/api/admin/tasks/ideas"),
        fetch("/api/admin/tasks/tasks"),
      ]);

      if (!ideasRes.ok || !tasksRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const ideasData = await ideasRes.json();
      const tasksData = await tasksRes.json();

      setIdeas(ideasData.ideas);
      setTasks(tasksData.tasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create idea");
      }

      setNewIdeaTitle("");
      setNewIdeaSummary("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create idea");
    } finally {
      setCreatingIdea(false);
    }
  };

  const deleteIdea = async (idea: Idea) => {
    if (!confirm(`Delete "${idea.title}" and all its tasks?`)) return;

    try {
      const res = await fetch(`/api/admin/tasks/ideas?id=${idea.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete idea");
      }

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete idea");
    }
  };

  const createTask = async (ideaId: string) => {
    if (!newTaskName.trim()) return;

    try {
      setCreatingTask(true);
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTaskName,
          idea_id: ideaId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      setNewTaskName("");
      setNewTaskIdeaId(null);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          completed: !task.completed,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
            : t
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const toggleTaskFocus = async (task: Task) => {
    const newFocus = task.focus === "today" ? "" : "today";
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          focus: newFocus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, focus: newFocus } : t))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  // Toggle "now" focus - only one task can be "in focus" at a time
  const toggleNowFocus = async (task: Task) => {
    const newFocus = task.focus === "now" ? "" : "now";
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          focus: newFocus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      // Clear "now" from all other tasks and set on this one
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return { ...t, focus: newFocus };
          }
          // If another task was "now", clear it
          if (t.focus === "now") {
            return { ...t, focus: "" };
          }
          return t;
        })
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const getTasksForIdea = (ideaId: string) => {
    return tasks
      .filter((t) => t.idea_id === ideaId && !t.parent_task_id)
      .sort((a, b) => {
        // Incomplete first, then by sort order
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.sort_order - b.sort_order;
      });
  };

  const todayTasks = tasks.filter((t) => t.focus === "today" && !t.completed);
  const inFocusTask = tasks.find((t) => t.focus === "now" && !t.completed);

  if (loading) {
    return (
      <div className="p-6">
        <p className="opacity-70">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 font-semibold">Error</p>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="opacity-70 mt-1">
            {ideas.length} ideas · {tasks.filter((t) => !t.completed).length} open tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/tasks/today"
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition flex items-center gap-2"
          >
            <span>☀️</span>
            Today ({todayTasks.length})
          </Link>
          <Link
            href="/dashboard/tasks/milestones"
            className="px-4 py-2 border border-black/10 dark:border-white/15 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            🎯 Milestones
          </Link>
        </div>
      </div>

      {/* In Focus Task */}
      {inFocusTask && (
        <div className="p-4 border-2 border-red-500/50 bg-red-500/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                  In Focus
                </p>
                <p className="font-medium mt-0.5">{inFocusTask.name}</p>
                {inFocusTask.idea_title && (
                  <Link
                    href={`/dashboard/tasks/${inFocusTask.idea_id}`}
                    className="text-xs opacity-70 hover:opacity-100 transition"
                  >
                    📁 {inFocusTask.idea_title}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleTaskComplete(inFocusTask)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                ✓ Complete
              </button>
              <button
                onClick={() => toggleNowFocus(inFocusTask)}
                className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Clear focus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Idea Form */}
      <form
        onSubmit={createIdea}
        className="p-4 border border-black/10 dark:border-white/15 rounded-lg bg-black/5 dark:bg-white/5"
      >
        <h3 className="font-semibold mb-3">New Idea</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newIdeaTitle}
            onChange={(e) => setNewIdeaTitle(e.target.value)}
            placeholder="Idea title..."
            className="flex-1 px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={creatingIdea}
          />
          <input
            type="text"
            value={newIdeaSummary}
            onChange={(e) => setNewIdeaSummary(e.target.value)}
            placeholder="Summary (optional)"
            className="flex-1 px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={creatingIdea}
          />
          <button
            type="submit"
            disabled={creatingIdea || !newIdeaTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {creatingIdea ? "Creating..." : "Create Idea"}
          </button>
        </div>
      </form>

      {/* Ideas List */}
      {ideas.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg">No ideas yet</p>
          <p className="text-sm mt-1">Create your first idea above to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => {
            const ideaTasks = getTasksForIdea(idea.id);
            const completedCount = ideaTasks.filter((t) => t.completed).length;
            const totalCount = ideaTasks.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={idea.id}
                className="border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-black overflow-hidden"
              >
                {/* Idea Header */}
                <div className="p-4 border-b border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/tasks/${idea.id}`}
                        className="text-lg font-semibold hover:underline"
                      >
                        {idea.title}
                      </Link>
                      {idea.summary && (
                        <p className="text-sm opacity-70 mt-1">{idea.summary}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="opacity-70">
                          {completedCount}/{totalCount} tasks
                        </span>
                        {totalCount > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="opacity-70">{progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/tasks/${idea.id}`}
                        className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => deleteIdea(idea)}
                        className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-600/20 dark:border-red-400/20 rounded hover:bg-red-600/10 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tasks Preview */}
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {ideaTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 flex items-center gap-3 ${
                        task.completed ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        onClick={() => toggleTaskComplete(task)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                          task.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-black/30 dark:border-white/30 hover:border-green-500"
                        }`}
                      >
                        {task.completed && "✓"}
                      </button>
                      <span
                        className={`flex-1 ${task.completed ? "line-through" : ""}`}
                      >
                        {task.name}
                      </span>
                      <button
                        onClick={() => toggleNowFocus(task)}
                        className={`text-lg ${
                          task.focus === "now"
                            ? "text-red-500"
                            : "opacity-30 hover:opacity-70"
                        } transition`}
                        title={task.focus === "now" ? "Remove focus" : "Focus now"}
                      >
                        🔥
                      </button>
                      <button
                        onClick={() => toggleTaskFocus(task)}
                        className={`text-lg ${
                          task.focus === "today"
                            ? "text-amber-500"
                            : "opacity-30 hover:opacity-70"
                        } transition`}
                        title={task.focus === "today" ? "Remove from Today" : "Add to Today"}
                      >
                        ☀️
                      </button>
                    </div>
                  ))}
                  {ideaTasks.length > 5 && (
                    <Link
                      href={`/dashboard/tasks/${idea.id}`}
                      className="block p-3 text-sm text-center opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      +{ideaTasks.length - 5} more tasks
                    </Link>
                  )}
                  {ideaTasks.length === 0 && (
                    <div className="p-3 text-sm opacity-50 text-center">
                      No tasks yet
                    </div>
                  )}
                </div>

                {/* Quick Add Task */}
                <div className="p-3 border-t border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                  {newTaskIdeaId === idea.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="Task name..."
                        className="flex-1 px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            createTask(idea.id);
                          }
                          if (e.key === "Escape") {
                            setNewTaskIdeaId(null);
                            setNewTaskName("");
                          }
                        }}
                        disabled={creatingTask}
                      />
                      <button
                        onClick={() => createTask(idea.id)}
                        disabled={creatingTask || !newTaskName.trim()}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {creatingTask ? "..." : "Add"}
                      </button>
                      <button
                        onClick={() => {
                          setNewTaskIdeaId(null);
                          setNewTaskName("");
                        }}
                        className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewTaskIdeaId(idea.id)}
                      className="text-sm opacity-50 hover:opacity-100 transition"
                    >
                      + Add task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
