"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DailyCountdown } from "../components/Countdown";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DAILY_TARGET_TIME_KEY = "tasks_daily_target_time";
const DEFAULT_TARGET_TIME = "17:00"; // 5 PM

type Attachment = {
  id: string;
  name: string;
  objectPath: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  downloadUrl?: string;
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
  attachments: Attachment[];
  created_at: string;
};

// Sortable Task Item for Today view
type SortableTodayTaskProps = {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onRemoveFromToday: (task: Task) => void;
  onToggleNowFocus: (task: Task) => void;
  isEditing: boolean;
  editValue: string;
  onStartEdit: (task: Task) => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
};

function SortableTodayTask({ 
  task, 
  onToggleComplete, 
  onRemoveFromToday, 
  onToggleNowFocus,
  isEditing,
  editValue,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}: SortableTodayTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-black flex items-start gap-4"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition touch-none"
        title="Drag to reorder"
      >
        ⋮⋮
      </button>
      <button
        onClick={() => onToggleComplete(task)}
        className="mt-0.5 w-6 h-6 rounded-full border-2 border-black/30 dark:border-white/30 hover:border-green-500 flex items-center justify-center transition"
      />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onSaveEdit}
            autoFocus
            className="w-full font-medium bg-transparent border-b-2 border-blue-500 outline-none py-0.5"
          />
        ) : (
          <div 
            className="font-medium cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition"
            onClick={() => onStartEdit(task)}
            title="Click to edit"
          >
            {task.name}
          </div>
        )}
        {task.note && (
          <div className="text-sm opacity-70 mt-1">{task.note}</div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {task.idea_title && (
            <Link
              href={`/dashboard/tasks/${task.idea_id}`}
              className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition"
            >
              📁 {task.idea_title}
            </Link>
          )}
          {task.milestone_name && (
            <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              🎯 {task.milestone_name}
            </span>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-gray-500/10 text-gray-600 dark:text-gray-400">
              📎 {task.attachments.length}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onToggleNowFocus(task)}
        className={`text-lg ${
          task.focus.includes("now")
            ? "text-red-500"
            : "opacity-30 hover:opacity-70"
        } transition`}
        title={task.focus.includes("now") ? "Remove focus" : "Focus now"}
      >
        🔥
      </button>
      <button
        onClick={() => onRemoveFromToday(task)}
        className="text-sm opacity-50 hover:opacity-100 hover:text-red-500 transition"
        title="Remove from Today"
      >
        ✕
      </button>
    </div>
  );
}

export default function TodayClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Daily countdown state
  const [targetTime, setTargetTime] = useState(DEFAULT_TARGET_TIME);
  const [showEditTime, setShowEditTime] = useState(false);
  const [tempTime, setTempTime] = useState("");

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Load target time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DAILY_TARGET_TIME_KEY);
    if (stored) {
      setTargetTime(stored);
    }
  }, []);

  const handleSaveTime = () => {
    if (tempTime) {
      setTargetTime(tempTime);
      localStorage.setItem(DAILY_TARGET_TIME_KEY, tempTime);
    }
    setShowEditTime(false);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tasks/tasks?focus=today");

      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await res.json();
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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

      if (!res.ok) throw new Error("Failed to update");

      // Also clear "now" focus when completing (but keep "today" if present)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { 
                ...t, 
                completed: !t.completed, 
                completed_at: !t.completed ? new Date().toISOString() : null,
                // Clear "now" but keep "today" if present
                focus: (!t.completed && t.focus.includes("now")) 
                  ? (t.focus.includes("today") ? "today" : "") 
                  : t.focus
              }
            : t
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const removeFromToday = async (task: Task) => {
    // Remove "today" but keep "now" if present
    const hasNow = task.focus.includes("now");
    const newFocus = hasNow ? "now" : "";
    
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          focus: newFocus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      // If task still has "now" focus, keep it in the list; otherwise remove it
      if (hasNow) {
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, focus: newFocus } : t));
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  // Toggle "now" focus - only one task can be "in focus" at a time
  const toggleNowFocus = async (task: Task) => {
    // All tasks in Today view have "today" focus, so toggle "now" while keeping "today"
    const hasNow = task.focus.includes("now");
    const newFocus = hasNow ? "today" : "now,today";
    
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          focus: newFocus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Clear "now" from all other tasks (keep their "today") and set on this one
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return { ...t, focus: newFocus };
          }
          // If another task had "now", remove it but keep "today"
          if (t.focus.includes("now")) {
            return { ...t, focus: t.focus.includes("today") ? "today" : "" };
          }
          return t;
        })
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  // Inline editing handlers
  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditValue(task.name);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingTaskId) return;
    
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      cancelEdit();
      return;
    }

    const task = tasks.find((t) => t.id === editingTaskId);
    if (!task || task.name === trimmedValue) {
      cancelEdit();
      return;
    }

    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTaskId,
          name: trimmedValue,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId ? { ...t, name: trimmedValue } : t
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      cancelEdit();
    }
  };

  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter((t) => !t.completed && !t.focus.includes("now")).sort((a, b) => a.sort_order - b.sort_order);
  const inFocusTask = tasks.find((t) => t.focus.includes("now") && !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const completedToday = completedTasks.filter((t) => {
    if (!t.completed_at) return false;
    const completedDate = new Date(t.completed_at).toDateString();
    return completedDate === new Date().toDateString();
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering tasks
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = incompleteTasks.findIndex((t) => t.id === active.id);
    const newIndex = incompleteTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const reorderedTasks = arrayMove(incompleteTasks, oldIndex, newIndex);
    
    // Update tasks state with new sort orders
    const updatedTasks = tasks.map((task) => {
      const reorderedIndex = reorderedTasks.findIndex((t) => t.id === task.id);
      if (reorderedIndex !== -1 && !task.completed) {
        return { ...task, sort_order: reorderedIndex + 1 };
      }
      return task;
    });
    setTasks(updatedTasks);

    // Send reorder to API
    try {
      const reorderPayload = reorderedTasks.map((task, index) => ({
        id: task.id,
        sort_order: index + 1,
      }));

      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: reorderPayload }),
      });

      if (!res.ok) throw new Error("Failed to reorder");
    } catch (err) {
      // Revert on error
      alert(err instanceof Error ? err.message : "Failed to reorder tasks");
      await fetchTasks();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="opacity-70">Loading today&apos;s tasks...</p>
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
      <div className="flex justify-between items-start">
        <div>
          <Link href="/dashboard/tasks" className="text-blue-600 hover:underline text-sm">
            ← Back to Tasks
          </Link>
          <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
            <span>☀️</span>
            Today
          </h1>
          <p className="opacity-70 mt-1">
            {incompleteTasks.length} tasks to do · {completedToday.length} completed today
          </p>
        </div>
      </div>

      {/* In Focus Task */}
      {inFocusTask && (
        <div className="p-4 border-2 border-red-500/50 bg-red-500/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    In Focus
                  </p>
                  {inFocusTask.focus.includes("today") && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      ☀️ Today
                    </span>
                  )}
                </div>
                {editingTaskId === inFocusTask.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEdit();
                      }
                    }}
                    onBlur={saveEdit}
                    autoFocus
                    className="font-medium mt-0.5 bg-transparent border-b-2 border-blue-500 outline-none w-full"
                  />
                ) : (
                  <p 
                    className="font-medium mt-0.5 cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 transition"
                    onClick={() => startEdit(inFocusTask)}
                    title="Click to edit"
                  >
                    {inFocusTask.name}
                  </p>
                )}
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

      {/* Daily Countdown */}
      <div className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                <DailyCountdown targetTime={targetTime} />
              </div>
              <p className="text-xs opacity-60 mt-0.5">Daily deadline</p>
            </div>
          </div>
          
          {showEditTime ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="px-2 py-1 border border-black/10 dark:border-white/15 rounded bg-white dark:bg-black text-sm"
              />
              <button
                onClick={handleSaveTime}
                className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowEditTime(false)}
                className="px-3 py-1 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempTime(targetTime);
                setShowEditTime(true);
              }}
              className="text-sm opacity-50 hover:opacity-100 transition"
            >
              Edit time
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: `${Math.round((completedToday.length / tasks.length) * 100)}%`,
              }}
            />
          </div>
          <span className="text-sm font-medium">
            {completedToday.length}/{tasks.length}
          </span>
        </div>
      )}

      {/* Tasks */}
      {incompleteTasks.length === 0 && completedToday.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-black/20 dark:border-white/20 rounded-lg">
          <p className="text-4xl mb-4">🎉</p>
          <p className="text-lg font-medium">No tasks for today</p>
          <p className="opacity-70 mt-1">
            Add tasks to &quot;Today&quot; from your ideas to see them here
          </p>
          <Link
            href="/dashboard/tasks"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go to Tasks
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70 flex items-center gap-2">
                To Do ({incompleteTasks.length})
                <span className="font-normal text-xs opacity-50">(drag to reorder)</span>
              </h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={incompleteTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {incompleteTasks.map((task) => (
                      <SortableTodayTask
                        key={task.id}
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        onRemoveFromToday={removeFromToday}
                        onToggleNowFocus={toggleNowFocus}
                        isEditing={editingTaskId === task.id}
                        editValue={editValue}
                        onStartEdit={startEdit}
                        onEditChange={setEditValue}
                        onSaveEdit={saveEdit}
                        onCancelEdit={cancelEdit}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed Today */}
          {completedToday.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70">
                Completed Today ({completedToday.length})
              </h3>
              <div className="space-y-1">
                {completedToday.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border border-black/10 dark:border-white/15 rounded-lg bg-black/5 dark:bg-white/5 flex items-start gap-4 opacity-60"
                  >
                    <button
                      onClick={() => toggleTaskComplete(task)}
                      className="mt-0.5 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm"
                    >
                      ✓
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEdit();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          onBlur={saveEdit}
                          autoFocus
                          className="w-full font-medium bg-transparent border-b-2 border-blue-500 outline-none py-0.5"
                        />
                      ) : (
                        <div 
                          className="font-medium line-through cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition"
                          onClick={() => startEdit(task)}
                          title="Click to edit"
                        >
                          {task.name}
                        </div>
                      )}
                      {task.idea_title && (
                        <div className="text-xs opacity-70 mt-1">
                          📁 {task.idea_title}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
