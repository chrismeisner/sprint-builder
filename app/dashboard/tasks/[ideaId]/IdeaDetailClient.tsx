"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Countdown from "../components/Countdown";
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

type Idea = {
  id: string;
  title: string;
  summary: string | null;
  milestone_id: string | null;
  milestone_name: string | null;
  milestone_target_date: string | null;
  project_id: string | null;
  project_name: string | null;
  sort_order: number;
  task_count: number;
  completed_task_count: number;
  created_at: string;
  updated_at: string;
};

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

type Milestone = {
  id: string;
  name: string;
  target_date: string | null;
  notes: string | null;
  completed: boolean;
  task_count: number;
};

type Project = {
  id: string;
  name: string;
  account_name: string | null;
  account_email: string | null;
};

type Props = {
  ideaId: string;
};

// Sortable Task Item Component
type SortableTaskItemProps = {
  task: Task;
  subtasks: Task[];
  isEditing: boolean;
  isEditingNote: boolean;
  editingTaskId: string | null;
  editingTaskName: string;
  editingNoteText: string;
  addingSubtaskTo: string | null;
  newSubtaskName: string;
  onToggleComplete: (task: Task) => void;
  onToggleFocus: (task: Task) => void;
  onToggleNowFocus: (task: Task) => void;
  onSetMilestoneModal: (task: Task) => void;
  onSetAddingSubtask: (taskId: string | null) => void;
  onDelete: (task: Task) => void;
  onEditTaskName: (task: Task) => void;
  onUpdateTaskName: (task: Task) => void;
  onCancelEditTask: () => void;
  onEditingTaskNameChange: (value: string) => void;
  onEditNote: (task: Task) => void;
  onUpdateNote: (task: Task) => void;
  onCancelEditNote: () => void;
  onEditingNoteTextChange: (value: string) => void;
  onNewSubtaskNameChange: (value: string) => void;
  onCreateSubtask: (parentId: string) => void;
};

function SortableTaskItem({
  task,
  subtasks,
  isEditing,
  isEditingNote,
  editingTaskId,
  editingTaskName,
  editingNoteText,
  addingSubtaskTo,
  newSubtaskName,
  onToggleComplete,
  onToggleFocus,
  onToggleNowFocus,
  onSetMilestoneModal,
  onSetAddingSubtask,
  onDelete,
  onEditTaskName,
  onUpdateTaskName,
  onCancelEditTask,
  onEditingTaskNameChange,
  onEditNote,
  onUpdateNote,
  onCancelEditNote,
  onEditingNoteTextChange,
  onNewSubtaskNameChange,
  onCreateSubtask,
}: SortableTaskItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-black/10 dark:border-white/15 rounded-lg overflow-hidden bg-white dark:bg-black"
    >
      {/* Task Row */}
      <div
        className={`p-3 flex items-start gap-3 ${
          task.completed ? "bg-black/5 dark:bg-white/5 opacity-60" : ""
        }`}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition touch-none"
          title="Drag to reorder"
        >
          ⋮⋮
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-black/30 dark:border-white/30 hover:border-green-500"
          }`}
        >
          {task.completed && "✓"}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingTaskName}
              onChange={(e) => onEditingTaskNameChange(e.target.value)}
              onBlur={() => onUpdateTaskName(task)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onUpdateTaskName(task);
                if (e.key === "Escape") onCancelEditTask();
              }}
              autoFocus
              className="w-full px-2 py-1 border border-blue-500 rounded bg-white dark:bg-black focus:outline-none"
            />
          ) : (
            <div
              onClick={() => onEditTaskName(task)}
              className={`cursor-text ${task.completed ? "line-through" : ""}`}
            >
              {task.name}
            </div>
          )}

          {/* Note */}
          {isEditingNote ? (
            <textarea
              value={editingNoteText}
              onChange={(e) => onEditingNoteTextChange(e.target.value)}
              onBlur={() => onUpdateNote(task)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancelEditNote();
              }}
              autoFocus
              rows={2}
              className="w-full mt-2 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-black focus:outline-none resize-none"
              placeholder="Add a note..."
            />
          ) : task.note ? (
            <div
              onClick={() => onEditNote(task)}
              className="mt-1 text-sm opacity-70 cursor-text"
            >
              {task.note}
            </div>
          ) : (
            <button
              onClick={() => onEditNote(task)}
              className="mt-1 text-xs opacity-40 hover:opacity-70 transition"
            >
              + Add note
            </button>
          )}

          {/* Milestone badge */}
          {task.milestone_name && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              🎯 {task.milestone_name}
              {task.milestone_target_date && (
                <span className="opacity-70">
                  · {new Date(task.milestone_target_date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onToggleNowFocus(task)}
            className={`px-2 py-1 rounded-md text-sm font-medium transition flex items-center gap-1 ${
              task.focus === "now"
                ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
            }`}
            title={task.focus === "now" ? "Remove focus" : "Focus now"}
          >
            🔥
            <span className="text-xs">{task.focus === "now" ? "Focus" : ""}</span>
          </button>
          <button
            onClick={() => onToggleFocus(task)}
            className={`px-2 py-1 rounded-md text-sm font-medium transition flex items-center gap-1 ${
              task.focus === "today"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
            }`}
            title={task.focus === "today" ? "Remove from Today" : "Add to Today"}
          >
            ☀️
            <span className="text-xs">{task.focus === "today" ? "Today" : ""}</span>
          </button>
          <button
            onClick={() => onSetMilestoneModal(task)}
            className={`px-2 py-1 rounded-md text-sm font-medium transition flex items-center gap-1 ${
              task.milestone_id
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
            }`}
            title="Set milestone"
          >
            🎯
            <span className="text-xs">{task.milestone_id ? "Set" : ""}</span>
          </button>
          <button
            onClick={() => onSetAddingSubtask(addingSubtaskTo === task.id ? null : task.id)}
            className={`px-2 py-1 rounded-md text-sm font-medium transition flex items-center gap-1 ${
              addingSubtaskTo === task.id
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70"
            }`}
            title="Add subtask"
          >
            ➕
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this task?")) onDelete(task);
            }}
            className="px-2 py-1 rounded-md text-sm font-medium transition bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {(subtasks.length > 0 || addingSubtaskTo === task.id) && (
        <div className="border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className={`pl-12 pr-3 py-2 flex items-center gap-3 border-b border-black/5 dark:border-white/5 last:border-b-0 ${
                sub.completed ? "opacity-50" : ""
              }`}
            >
              <button
                onClick={() => onToggleComplete(sub)}
                className={`w-4 h-4 rounded border flex items-center justify-center text-xs transition ${
                  sub.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-black/30 dark:border-white/30 hover:border-green-500"
                }`}
              >
                {sub.completed && "✓"}
              </button>
              {editingTaskId === sub.id ? (
                <input
                  type="text"
                  value={editingTaskName}
                  onChange={(e) => onEditingTaskNameChange(e.target.value)}
                  onBlur={() => onUpdateTaskName(sub)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onUpdateTaskName(sub);
                    }
                    if (e.key === "Escape") {
                      onCancelEditTask();
                    }
                  }}
                  className="flex-1 px-2 py-0.5 text-sm border border-blue-500 rounded bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => onEditTaskName(sub)}
                  className={`flex-1 text-sm cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-1 rounded ${sub.completed ? "line-through" : ""}`}
                  title="Click to edit"
                >
                  {sub.name}
                </span>
              )}
              <button
                onClick={() => onToggleFocus(sub)}
                className={`px-1.5 py-0.5 rounded text-xs transition ${
                  sub.focus === "today"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
                }`}
                title={sub.focus === "today" ? "Remove from Today" : "Add to Today"}
              >
                ☀️
              </button>
            </div>
          ))}
          {addingSubtaskTo === task.id && (
            <div className="pl-12 pr-3 py-2 flex gap-2">
              <input
                type="text"
                value={newSubtaskName}
                onChange={(e) => onNewSubtaskNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateSubtask(task.id);
                  if (e.key === "Escape") {
                    onSetAddingSubtask(null);
                    onNewSubtaskNameChange("");
                  }
                }}
                placeholder="Subtask name..."
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-black/10 dark:border-white/15 rounded bg-white dark:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => onCreateSubtask(task.id)}
                disabled={!newSubtaskName.trim()}
                className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IdeaDetailClient({ ideaId }: Props) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New task form
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPosition, setNewTaskPosition] = useState<"top" | "bottom">("bottom");
  const [creatingTask, setCreatingTask] = useState(false);

  // Inline editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Subtask creation
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");

  // Milestone modal for tasks
  const [milestoneModalTask, setMilestoneModalTask] = useState<Task | null>(null);

  // Milestone modal for idea
  const [showIdeaMilestoneModal, setShowIdeaMilestoneModal] = useState(false);

  // Project modal for idea
  const [showIdeaProjectModal, setShowIdeaProjectModal] = useState(false);

  // Idea editing
  const [editingIdeaTitle, setEditingIdeaTitle] = useState(false);
  const [editingIdeaSummary, setEditingIdeaSummary] = useState(false);
  const [ideaTitleValue, setIdeaTitleValue] = useState("");
  const [ideaSummaryValue, setIdeaSummaryValue] = useState("");

  // Refs
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [ideasRes, tasksRes, milestonesRes, projectsRes] = await Promise.all([
        fetch("/api/admin/tasks/ideas"),
        fetch(`/api/admin/tasks/tasks?ideaId=${ideaId}`),
        fetch("/api/admin/tasks/milestones"),
        fetch("/api/admin/tasks/projects"),
      ]);

      if (!ideasRes.ok || !tasksRes.ok || !milestonesRes.ok || !projectsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const ideasData = await ideasRes.json();
      const tasksData = await tasksRes.json();
      const milestonesData = await milestonesRes.json();
      const projectsData = await projectsRes.json();

      const foundIdea = ideasData.ideas.find((i: Idea) => i.id === ideaId);
      if (!foundIdea) {
        throw new Error("Idea not found");
      }

      setIdea(foundIdea);
      setTasks(tasksData.tasks);
      setMilestones(milestonesData.milestones);
      setProjects(projectsData.projects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ideaId]);

  // Sorted tasks helpers
  const getTopLevelTasks = () => {
    return tasks
      .filter((t) => !t.parent_task_id)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.sort_order - b.sort_order;
      });
  };

  const getSubtasks = (parentId: string) => {
    return tasks
      .filter((t) => t.parent_task_id === parentId)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.sub_sort_order - b.sub_sort_order;
      });
  };

  // Task CRUD
  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      setCreatingTask(true);
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTaskName,
          idea_id: ideaId,
          position: newTaskPosition,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      setNewTaskName("");
      await fetchData();
      newTaskInputRef.current?.focus();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  const createSubtask = async (parentId: string) => {
    if (!newSubtaskName.trim()) return;

    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubtaskName,
          idea_id: ideaId,
          parent_task_id: parentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create subtask");
      }

      setNewSubtaskName("");
      setAddingSubtaskTo(null);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create subtask");
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

      if (!res.ok) throw new Error("Failed to update");

      // Also clear "now" focus when completing
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { 
                ...t, 
                completed: !t.completed, 
                completed_at: !t.completed ? new Date().toISOString() : null,
                focus: (!t.completed && t.focus === "now") ? "" : t.focus
              }
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
        body: JSON.stringify({ id: task.id, focus: newFocus }),
      });

      if (!res.ok) throw new Error("Failed to update");

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
        body: JSON.stringify({ id: task.id, focus: newFocus }),
      });

      if (!res.ok) throw new Error("Failed to update");

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

  const updateTaskName = async (task: Task) => {
    const name = editingTaskName.trim();
    if (!name) {
      setEditingTaskId(null);
      return;
    }

    // Delete if name is "xxx"
    if (name.toLowerCase() === "xxx") {
      await deleteTask(task);
      setEditingTaskId(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, name }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, name } : t))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setEditingTaskId(null);
      setEditingTaskName("");
    }
  };

  const updateTaskNote = async (task: Task) => {
    const note = editingNoteText.trim();
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, note: note || null }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, note: note || null } : t))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setEditingNoteId(null);
      setEditingNoteText("");
    }
  };

  const deleteTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/admin/tasks/tasks?id=${task.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setTasks((prev) => prev.filter((t) => t.id !== task.id && t.parent_task_id !== task.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const assignMilestone = async (task: Task, milestoneId: string | null) => {
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, milestone_id: milestoneId }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const milestone = milestones.find((m) => m.id === milestoneId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                milestone_id: milestoneId,
                milestone_name: milestone?.name || null,
                milestone_target_date: milestone?.target_date || null,
              }
            : t
        )
      );
      setMilestoneModalTask(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign milestone");
    }
  };

  // Assign project to idea
  const assignIdeaProject = async (projectId: string | null) => {
    if (!idea) return;

    try {
      const res = await fetch("/api/admin/tasks/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, project_id: projectId }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const project = projects.find((p) => p.id === projectId);
      setIdea((prev) =>
        prev
          ? {
              ...prev,
              project_id: projectId,
              project_name: project?.name || null,
            }
          : prev
      );
      setShowIdeaProjectModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign project");
    }
  };

  // Assign milestone to idea
  const assignIdeaMilestone = async (milestoneId: string | null) => {
    if (!idea) return;

    try {
      const res = await fetch("/api/admin/tasks/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, milestone_id: milestoneId }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const milestone = milestones.find((m) => m.id === milestoneId);
      setIdea((prev) =>
        prev
          ? {
              ...prev,
              milestone_id: milestoneId,
              milestone_name: milestone?.name || null,
              milestone_target_date: milestone?.target_date || null,
            }
          : prev
      );
      setShowIdeaMilestoneModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign milestone");
    }
  };

  // Idea update functions
  const updateIdeaTitle = async () => {
    if (!idea) return;
    const title = ideaTitleValue.trim();
    if (!title) {
      setEditingIdeaTitle(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/tasks/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, title }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setIdea((prev) => (prev ? { ...prev, title } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update title");
    } finally {
      setEditingIdeaTitle(false);
    }
  };

  const updateIdeaSummary = async () => {
    if (!idea) return;
    const summary = ideaSummaryValue.trim() || null;

    try {
      const res = await fetch("/api/admin/tasks/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, summary }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setIdea((prev) => (prev ? { ...prev, summary } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update summary");
    } finally {
      setEditingIdeaSummary(false);
    }
  };

  // Progress calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

    const oldIndex = topLevelTasks.findIndex((t) => t.id === active.id);
    const newIndex = topLevelTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const reorderedTasks = arrayMove(topLevelTasks, oldIndex, newIndex);
    
    // Update tasks state with new sort orders
    const updatedTasks = tasks.map((task) => {
      const reorderedIndex = reorderedTasks.findIndex((t) => t.id === task.id);
      if (reorderedIndex !== -1 && !task.parent_task_id) {
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
      await fetchData();
    }
  };

  // Get top level tasks (used by drag and drop)
  const topLevelTasks = getTopLevelTasks();

  if (loading) {
    return (
      <div className="p-6">
        <p className="opacity-70">Loading...</p>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="p-6">
        <Link href="/dashboard/tasks" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Tasks
        </Link>
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mt-4">
          <p className="text-red-600 dark:text-red-400">{error || "Idea not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Milestone Modal for Tasks */}
      {milestoneModalTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Assign Milestone to Task</h3>
            <p className="text-sm opacity-70 mb-4">
              Task: {milestoneModalTask.name}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => assignMilestone(milestoneModalTask, null)}
                className={`w-full text-left p-3 rounded border ${
                  !milestoneModalTask.milestone_id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                } transition`}
              >
                <span className="opacity-70">No milestone</span>
              </button>
              {milestones.map((m) => (
                <button
                  key={m.id}
                  onClick={() => assignMilestone(milestoneModalTask, m.id)}
                  className={`w-full text-left p-3 rounded border ${
                    milestoneModalTask.milestone_id === m.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                  } transition`}
                >
                  <div className="font-medium">{m.name}</div>
                  {m.target_date && (
                    <div className="text-sm opacity-70">
                      {new Date(m.target_date).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setMilestoneModalTask(null)}
                className="px-4 py-2 border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Modal for Idea */}
      {showIdeaMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Link Idea to Milestone</h3>
            <p className="text-sm opacity-70 mb-4">
              Idea: {idea.title}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => assignIdeaMilestone(null)}
                className={`w-full text-left p-3 rounded border ${
                  !idea.milestone_id
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                } transition`}
              >
                <span className="opacity-70">No milestone</span>
              </button>
              {milestones.map((m) => (
                <button
                  key={m.id}
                  onClick={() => assignIdeaMilestone(m.id)}
                  className={`w-full text-left p-3 rounded border ${
                    idea.milestone_id === m.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                  } transition`}
                >
                  <div className="font-medium">{m.name}</div>
                  {m.target_date && (
                    <div className="text-sm opacity-70">
                      {new Date(m.target_date).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowIdeaMilestoneModal(false)}
                className="px-4 py-2 border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal for Idea */}
      {showIdeaProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Link Idea to Project</h3>
            <p className="text-sm opacity-70 mb-4">
              Idea: {idea.title}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => assignIdeaProject(null)}
                className={`w-full text-left p-3 rounded border ${
                  !idea.project_id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                } transition`}
              >
                <span className="opacity-70">No project</span>
              </button>
              {projects.length === 0 ? (
                <p className="text-sm opacity-50 py-4 text-center">No client projects found</p>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => assignIdeaProject(p.id)}
                    className={`w-full text-left p-3 rounded border ${
                      idea.project_id === p.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                    } transition`}
                  >
                    <div className="font-medium">{p.name}</div>
                    {p.account_name && (
                      <div className="text-sm opacity-70">
                        👤 {p.account_name}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowIdeaProjectModal(false)}
                className="px-4 py-2 border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <Link href="/dashboard/tasks" className="text-blue-600 hover:underline text-sm">
          ← Back to Tasks
        </Link>
        
        {/* Editable Title */}
        {editingIdeaTitle ? (
          <input
            type="text"
            value={ideaTitleValue}
            onChange={(e) => setIdeaTitleValue(e.target.value)}
            onBlur={updateIdeaTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateIdeaTitle();
              if (e.key === "Escape") setEditingIdeaTitle(false);
            }}
            autoFocus
            className="w-full text-2xl font-bold mt-2 px-2 py-1 border border-blue-500 rounded bg-white dark:bg-black focus:outline-none"
          />
        ) : (
          <h1
            onClick={() => {
              setIdeaTitleValue(idea.title);
              setEditingIdeaTitle(true);
            }}
            className="text-2xl font-bold mt-2 cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 -mx-2 rounded transition"
          >
            {idea.title}
          </h1>
        )}

        {/* Editable Summary */}
        {editingIdeaSummary ? (
          <textarea
            value={ideaSummaryValue}
            onChange={(e) => setIdeaSummaryValue(e.target.value)}
            onBlur={updateIdeaSummary}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingIdeaSummary(false);
            }}
            autoFocus
            rows={2}
            className="w-full opacity-70 mt-1 px-2 py-1 border border-blue-500 rounded bg-white dark:bg-black focus:outline-none resize-none"
            placeholder="Add a summary..."
          />
        ) : (
          <p
            onClick={() => {
              setIdeaSummaryValue(idea.summary || "");
              setEditingIdeaSummary(true);
            }}
            className="opacity-70 mt-1 cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 -mx-2 rounded transition min-h-[2rem]"
          >
            {idea.summary || <span className="opacity-50 italic">Click to add summary...</span>}
          </p>
        )}

        {/* Idea Links: Milestone & Project */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Milestone Link */}
          <button
            onClick={() => setShowIdeaMilestoneModal(true)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border transition ${
              idea.milestone_id
                ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
                : "border-black/10 dark:border-white/15 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <span>🎯</span>
            {idea.milestone_name ? (
              <span>
                {idea.milestone_name}
                {idea.milestone_target_date && (
                  <span className="ml-2 opacity-70 text-sm">
                    · {new Date(idea.milestone_target_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-sm">Link to milestone...</span>
            )}
          </button>

          {/* Project Link */}
          <button
            onClick={() => setShowIdeaProjectModal(true)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border transition ${
              idea.project_id
                ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                : "border-black/10 dark:border-white/15 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <span>📁</span>
            {idea.project_name ? (
              <span>{idea.project_name}</span>
            ) : (
              <span className="text-sm">Link to project...</span>
            )}
          </button>
        </div>

        {/* Countdown Timer for Milestone */}
        {idea.milestone_id && idea.milestone_target_date && new Date(idea.milestone_target_date) > new Date() && (
          <div className="mt-4 p-4 border border-purple-500/30 bg-purple-500/5 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  <Countdown 
                    targetDate={idea.milestone_target_date}
                    completedText="Milestone reached!"
                  />
                </div>
                <p className="text-xs opacity-60 mt-0.5">
                  Until {idea.milestone_name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium">
          {completedTasks}/{totalTasks} ({progress}%)
        </span>
      </div>

      {/* New Task Form */}
      <form onSubmit={createTask} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            ref={newTaskInputRef}
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New task..."
            className="flex-1 px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={creatingTask}
          />
          <button
            type="submit"
            disabled={creatingTask || !newTaskName.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {creatingTask ? "..." : "Add"}
          </button>
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={newTaskPosition === "top"}
              onChange={() => setNewTaskPosition("top")}
              className="accent-blue-500"
            />
            Top of list
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={newTaskPosition === "bottom"}
              onChange={() => setNewTaskPosition("bottom")}
              className="accent-blue-500"
            />
            Bottom of list
          </label>
        </div>
      </form>

      {/* Tasks List */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          Tasks
          <span className="text-xs font-normal opacity-50">(drag to reorder)</span>
        </h3>
        {topLevelTasks.length === 0 ? (
          <p className="text-sm opacity-50 py-4">No tasks yet. Add one above!</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={topLevelTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {topLevelTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    subtasks={getSubtasks(task.id)}
                    isEditing={editingTaskId === task.id}
                    isEditingNote={editingNoteId === task.id}
                    editingTaskId={editingTaskId}
                    editingTaskName={editingTaskName}
                    editingNoteText={editingNoteText}
                    addingSubtaskTo={addingSubtaskTo}
                    newSubtaskName={newSubtaskName}
                    onToggleComplete={toggleTaskComplete}
                    onToggleFocus={toggleTaskFocus}
                    onToggleNowFocus={toggleNowFocus}
                    onSetMilestoneModal={setMilestoneModalTask}
                    onSetAddingSubtask={setAddingSubtaskTo}
                    onDelete={deleteTask}
                    onEditTaskName={(task) => {
                      setEditingTaskId(task.id);
                      setEditingTaskName(task.name);
                    }}
                    onUpdateTaskName={updateTaskName}
                    onCancelEditTask={() => {
                      setEditingTaskId(null);
                      setEditingTaskName("");
                    }}
                    onEditingTaskNameChange={setEditingTaskName}
                    onEditNote={(task) => {
                      setEditingNoteId(task.id);
                      setEditingNoteText(task.note || "");
                    }}
                    onUpdateNote={updateTaskNote}
                    onCancelEditNote={() => {
                      setEditingNoteId(null);
                      setEditingNoteText("");
                    }}
                    onEditingNoteTextChange={setEditingNoteText}
                    onNewSubtaskNameChange={setNewSubtaskName}
                    onCreateSubtask={createSubtask}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
