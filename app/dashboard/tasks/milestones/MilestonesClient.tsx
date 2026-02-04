"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Countdown from "../components/Countdown";

type Milestone = {
  id: string;
  name: string;
  target_date: string | null;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  task_count: number;
  completed_task_count: number;
  created_at: string;
};

type Task = {
  id: string;
  idea_id: string | null;
  milestone_id: string | null;
  name: string;
  completed: boolean;
  idea_title: string | null;
};

export default function MilestonesClient() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New milestone form
  const [newName, setNewName] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newTargetTime, setNewTargetTime] = useState("17:00"); // Default 5pm
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingTime, setEditingTime] = useState("");
  const [editingNotes, setEditingNotes] = useState("");

  // Expanded milestone
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [milestonesRes, tasksRes] = await Promise.all([
        fetch("/api/admin/tasks/milestones"),
        fetch("/api/admin/tasks/tasks"),
      ]);

      if (!milestonesRes.ok || !tasksRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const milestonesData = await milestonesRes.json();
      const tasksData = await tasksRes.json();

      setMilestones(milestonesData.milestones);
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

  // Combine date and time into ISO string
  const combineDateTime = (date: string, time: string) => {
    if (!date) return null;
    const timeValue = time || "00:00";
    return `${date}T${timeValue}:00`;
  };

  // Parse date and time from ISO string
  const parseDatePart = (isoString: string | null) => {
    if (!isoString) return "";
    return isoString.split("T")[0];
  };

  const parseTimePart = (isoString: string | null) => {
    if (!isoString) return "17:00";
    const match = isoString.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : "17:00";
  };

  const createMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/tasks/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          target_date: combineDateTime(newTargetDate, newTargetTime),
          notes: newNotes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create milestone");
      }

      setNewName("");
      setNewTargetDate("");
      setNewTargetTime("17:00");
      setNewNotes("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create milestone");
    } finally {
      setCreating(false);
    }
  };

  const updateMilestone = async (milestone: Milestone) => {
    try {
      const targetDateTime = combineDateTime(editingDate, editingTime);
      const res = await fetch("/api/admin/tasks/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: milestone.id,
          name: editingName,
          target_date: targetDateTime,
          notes: editingNotes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id
            ? { ...m, name: editingName, target_date: targetDateTime, notes: editingNotes || null }
            : m
        )
      );
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update milestone");
    }
  };

  const toggleMilestoneComplete = async (milestone: Milestone) => {
    try {
      const res = await fetch("/api/admin/tasks/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: milestone.id,
          completed: !milestone.completed,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id
            ? { ...m, completed: !m.completed, completed_at: !m.completed ? new Date().toISOString() : null }
            : m
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update milestone");
    }
  };

  const deleteMilestone = async (milestone: Milestone) => {
    if (!confirm(`Delete "${milestone.name}"? Tasks will be unlinked but not deleted.`)) return;

    try {
      const res = await fetch(`/api/admin/tasks/milestones?id=${milestone.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete milestone");
    }
  };

  const getTasksForMilestone = (milestoneId: string) => {
    return tasks.filter((t) => t.milestone_id === milestoneId);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Sort milestones: incomplete first (by date), then completed
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.target_date && b.target_date) {
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    }
    if (a.target_date) return -1;
    if (b.target_date) return 1;
    return a.sort_order - b.sort_order;
  });

  if (loading) {
    return (
      <div className="p-6">
        <p className="opacity-70">Loading milestones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/tasks" className="text-blue-600 hover:underline text-sm">
          ← Back to Tasks
        </Link>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
          <span>🎯</span>
          Milestones
        </h1>
        <p className="opacity-70 mt-1">
          {milestones.filter((m) => !m.completed).length} active milestones
        </p>
      </div>

      {/* New Milestone Form */}
      <form
        onSubmit={createMilestone}
        className="p-4 border border-black/10 dark:border-white/15 rounded-lg bg-black/5 dark:bg-white/5 space-y-3"
      >
        <h3 className="font-semibold">New Milestone</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Milestone name..."
            className="flex-1 px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={creating}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              className="px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
            <input
              type="time"
              value={newTargetTime}
              onChange={(e) => setNewTargetTime(e.target.value)}
              className="px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
          </div>
        </div>
        <input
          type="text"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          placeholder="Notes (optional)..."
          className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {creating ? "Creating..." : "Create Milestone"}
        </button>
      </form>

      {/* Milestones List */}
      {sortedMilestones.length === 0 ? (
        <div className="text-center py-12 opacity-70">
          <p className="text-lg">No milestones yet</p>
          <p className="text-sm mt-1">Create your first milestone to set deadlines for tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMilestones.map((milestone) => {
            const milestoneTasks = getTasksForMilestone(milestone.id);
            const isEditing = editingId === milestone.id;
            const isExpanded = expandedId === milestone.id;
            const daysUntil = getDaysUntil(milestone.target_date);
            const progress =
              milestone.task_count > 0
                ? Math.round((milestone.completed_task_count / milestone.task_count) * 100)
                : 0;

            return (
              <div
                key={milestone.id}
                className={`border border-black/10 dark:border-white/15 rounded-lg overflow-hidden ${
                  milestone.completed ? "opacity-60" : ""
                }`}
              >
                {/* Milestone Header */}
                <div className="p-4 bg-white dark:bg-black">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-500 rounded bg-white dark:bg-black focus:outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editingDate}
                          onChange={(e) => setEditingDate(e.target.value)}
                          className="px-3 py-2 border border-black/10 dark:border-white/15 rounded bg-white dark:bg-black focus:outline-none"
                        />
                        <input
                          type="time"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          className="px-3 py-2 border border-black/10 dark:border-white/15 rounded bg-white dark:bg-black focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder="Notes..."
                        className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded bg-white dark:bg-black focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMilestone(milestone)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleMilestoneComplete(milestone)}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                          milestone.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-black/30 dark:border-white/30 hover:border-green-500"
                        }`}
                      >
                        {milestone.completed && "✓"}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-lg font-semibold ${milestone.completed ? "line-through" : ""}`}
                          >
                            {milestone.name}
                          </span>
                          {milestone.target_date && daysUntil !== null && !milestone.completed && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                daysUntil < 0
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : daysUntil <= 3
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {daysUntil === 0
                                ? "Today"
                                : daysUntil < 0
                                ? `${Math.abs(daysUntil)}d overdue`
                                : `${daysUntil}d`}
                            </span>
                          )}
                        </div>

                        {milestone.target_date && (
                          <div className="text-sm opacity-70 mt-1 flex items-center gap-3">
                            <span>📅 {formatDate(milestone.target_date)} at {formatTime(milestone.target_date)}</span>
                            {!milestone.completed && daysUntil !== null && daysUntil >= 0 && (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                <Countdown 
                                  targetDate={milestone.target_date} 
                                  showSeconds={daysUntil <= 1}
                                  completedText="Due now!"
                                />
                              </span>
                            )}
                          </div>
                        )}

                        {milestone.notes && (
                          <div className="text-sm opacity-70 mt-1">{milestone.notes}</div>
                        )}

                        {/* Progress */}
                        {milestone.task_count > 0 && (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="w-32 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs opacity-70">
                              {milestone.completed_task_count}/{milestone.task_count} tasks
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                          className="p-2 opacity-50 hover:opacity-100 transition"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(milestone.id);
                            setEditingName(milestone.name);
                            setEditingDate(parseDatePart(milestone.target_date));
                            setEditingTime(parseTimePart(milestone.target_date));
                            setEditingNotes(milestone.notes || "");
                          }}
                          className="p-2 opacity-50 hover:opacity-100 transition"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteMilestone(milestone)}
                          className="p-2 opacity-50 hover:opacity-100 hover:text-red-500 transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Linked Tasks (expanded) */}
                {isExpanded && milestoneTasks.length > 0 && (
                  <div className="border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] divide-y divide-black/5 dark:divide-white/5">
                    {milestoneTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`px-4 py-2 pl-14 flex items-center gap-3 ${
                          task.completed ? "opacity-50" : ""
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                            task.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-black/30 dark:border-white/30"
                          }`}
                        >
                          {task.completed && "✓"}
                        </span>
                        <span className={`flex-1 ${task.completed ? "line-through" : ""}`}>
                          {task.name}
                        </span>
                        {task.idea_title && (
                          <Link
                            href={`/dashboard/tasks/${task.idea_id}`}
                            className="text-xs opacity-50 hover:opacity-100 transition"
                          >
                            📁 {task.idea_title}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && milestoneTasks.length === 0 && (
                  <div className="border-t border-black/10 dark:border-white/10 p-4 text-sm opacity-50 text-center">
                    No tasks linked to this milestone
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
