"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Sortable Task Item Component
type SortableTaskItemProps = {
  task: Task;
  isEditing: boolean;
  editingTaskName: string;
  onToggleComplete: (task: Task) => void;
  onToggleNowFocus: (task: Task) => void;
  onToggleFocus: (task: Task) => void;
  onStartEdit: (task: Task) => void;
  onUpdateName: (task: Task) => void;
  onCancelEdit: () => void;
  onEditingNameChange: (value: string) => void;
  onShowDetail: (task: Task) => void;
};

function SortableTaskItem({
  task,
  isEditing,
  editingTaskName,
  onToggleComplete,
  onToggleNowFocus,
  onToggleFocus,
  onStartEdit,
  onUpdateName,
  onCancelEdit,
  onEditingNameChange,
  onShowDetail,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: task.completed });

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
      className={`group p-3 flex items-center gap-3 border-b border-black/5 dark:border-white/5 last:border-b-0 ${
        task.completed ? "opacity-50" : ""
      }`}
    >
      {/* Drag Handle */}
      {!task.completed && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 opacity-30 hover:opacity-70 touch-none"
          title="Drag to reorder"
        >
          ⋮⋮
        </button>
      )}
      {task.completed && <span className="w-6" />}
      
      <button
        onClick={() => onToggleComplete(task)}
        className={`w-5 h-5 rounded border flex items-center justify-center transition flex-shrink-0 ${
          task.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-black/30 dark:border-white/30 hover:border-green-500"
        }`}
      >
        {task.completed && "✓"}
      </button>
      
      {isEditing ? (
        <input
          type="text"
          value={editingTaskName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={() => onUpdateName(task)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onUpdateName(task);
            }
            if (e.key === "Escape") {
              onCancelEdit();
            }
          }}
          className="flex-1 px-2 py-0.5 text-sm border border-blue-500 rounded bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <span
          onClick={() => onStartEdit(task)}
          className={`flex-1 cursor-text hover:bg-black/5 dark:hover:bg-white/5 px-1 rounded ${
            task.completed ? "line-through" : ""
          }`}
          title="Click to edit"
        >
          {task.name}
        </span>
      )}
      
      {/* Attachment indicator */}
      {task.attachments && task.attachments.length > 0 && (
        <span
          className="px-1.5 py-0.5 rounded text-xs flex-shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          title={`${task.attachments.length} attachment${task.attachments.length > 1 ? "s" : ""}`}
        >
          📎 {task.attachments.length}
        </span>
      )}
      <button
        onClick={() => onShowDetail(task)}
        className="px-1.5 py-0.5 rounded text-sm flex-shrink-0 transition bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 opacity-0 group-hover:opacity-100"
        title="View details"
      >
        ℹ️
      </button>
      <button
        onClick={() => onToggleNowFocus(task)}
        className={`px-1.5 py-0.5 rounded text-sm flex-shrink-0 transition flex items-center gap-0.5 ${
          task.focus === "now"
            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
            : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
        }`}
        title={task.focus === "now" ? "Remove focus" : "Focus now"}
      >
        🔥
        {task.focus === "now" && <span className="text-xs">Focus</span>}
      </button>
      <button
        onClick={() => onToggleFocus(task)}
        className={`px-1.5 py-0.5 rounded text-sm flex-shrink-0 transition flex items-center gap-0.5 ${
          task.focus === "today"
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
        }`}
        title={task.focus === "today" ? "Remove from Today" : "Add to Today"}
      >
        ☀️
        {task.focus === "today" && <span className="text-xs">Today</span>}
      </button>
    </div>
  );
}

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

  // Inline task editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState("");

  // Task detail modal
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [modalEditName, setModalEditName] = useState("");
  const [modalEditNote, setModalEditNote] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  // Attachment state
  const [modalAttachments, setModalAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Initialize modal edit fields when task changes
  const openTaskDetail = async (task: Task) => {
    setDetailTask(task);
    setModalEditName(task.name);
    setModalEditNote(task.note || "");
    setModalAttachments([]);
    
    // Fetch attachments with signed URLs
    if (task.attachments && task.attachments.length > 0) {
      setLoadingAttachments(true);
      try {
        const res = await fetch(`/api/admin/tasks/attachments?taskId=${task.id}`);
        if (res.ok) {
          const data = await res.json();
          setModalAttachments(data.attachments);
        }
      } catch (err) {
        console.error("Failed to load attachments:", err);
      } finally {
        setLoadingAttachments(false);
      }
    }
  };

  // Handle file upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detailTask || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingAttachment(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", detailTask.id);
      
      const res = await fetch("/api/admin/tasks/attachments", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload");
      }
      
      const data = await res.json();
      setModalAttachments((prev) => [...prev, data.attachment]);
      
      // Update task in list to show attachment count
      setTasks((prev) =>
        prev.map((t) =>
          t.id === detailTask.id
            ? { ...t, attachments: [...(t.attachments || []), data.attachment] }
            : t
        )
      );
      setDetailTask((prev) =>
        prev
          ? { ...prev, attachments: [...(prev.attachments || []), data.attachment] }
          : null
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
      // Reset file input
      e.target.value = "";
    }
  };

  // Handle attachment delete
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!detailTask || !confirm("Delete this attachment?")) return;
    
    try {
      const res = await fetch(
        `/api/admin/tasks/attachments?taskId=${detailTask.id}&attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      
      setModalAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      
      // Update task in list
      setTasks((prev) =>
        prev.map((t) =>
          t.id === detailTask.id
            ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) }
            : t
        )
      );
      setDetailTask((prev) =>
        prev
          ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) }
          : null
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete attachment");
    }
  };

  // Save task from modal
  const saveModalTask = async () => {
    if (!detailTask || modalSaving) return;
    
    setModalSaving(true);
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: detailTask.id,
          name: modalEditName.trim(),
          note: modalEditNote.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      // Update local state
      const updatedTask = { ...detailTask, name: modalEditName.trim(), note: modalEditNote.trim() || null };
      setTasks((prev) =>
        prev.map((t) => (t.id === detailTask.id ? updatedTask : t))
      );
      setDetailTask(updatedTask);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setModalSaving(false);
    }
  };

  // Toggle task completion from modal
  const toggleModalTaskComplete = async () => {
    if (!detailTask) return;
    await toggleTaskComplete(detailTask);
    // Update detailTask to reflect the change
    setDetailTask((prev) => prev ? { 
      ...prev, 
      completed: !prev.completed, 
      completed_at: !prev.completed ? new Date().toISOString() : null,
      focus: (!prev.completed && prev.focus === "now") ? "" : prev.focus
    } : null);
  };

  // Toggle focus from modal
  const toggleModalFocus = async (focusType: "now" | "today") => {
    if (!detailTask) return;
    
    const newFocus = detailTask.focus === focusType ? "" : focusType;
    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: detailTask.id, focus: newFocus }),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Update local state
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === detailTask.id) return { ...t, focus: newFocus };
          if (focusType === "now" && t.focus === "now") return { ...t, focus: "" };
          return t;
        })
      );
      setDetailTask((prev) => prev ? { ...prev, focus: newFocus } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  // Delete task from modal
  const deleteModalTask = async () => {
    if (!detailTask || !confirm("Delete this task?")) return;
    
    try {
      const res = await fetch(`/api/admin/tasks/tasks?id=${detailTask.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setTasks((prev) => prev.filter((t) => t.id !== detailTask.id));
      setDetailTask(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

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

      // Optimistic update - also clear "now" focus when completing
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { 
                ...t, 
                completed: !t.completed, 
                completed_at: !t.completed ? new Date().toISOString() : null,
                // Clear "now" focus when completing a task
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

  // Update task name inline
  const updateTaskName = async (task: Task) => {
    const name = editingTaskName.trim();
    if (!name) {
      setEditingTaskId(null);
      setEditingTaskName("");
      return;
    }

    // Delete task if name is "xxx"
    if (name.toLowerCase() === "xxx") {
      await deleteTask(task);
      setEditingTaskId(null);
      setEditingTaskName("");
      return;
    }

    // No change
    if (name === task.name) {
      setEditingTaskId(null);
      setEditingTaskName("");
      return;
    }

    try {
      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, name } : t))
      );
      setEditingTaskId(null);
      setEditingTaskName("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  // Delete task
  const deleteTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/admin/tasks/tasks?id=${task.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete task");
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

  // Handle drag end for reordering tasks within an idea
  const handleDragEnd = async (ideaId: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const ideaTasks = getTasksForIdea(ideaId).filter((t) => !t.completed);
    const oldIndex = ideaTasks.findIndex((t) => t.id === active.id);
    const newIndex = ideaTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const reorderedTasks = arrayMove(ideaTasks, oldIndex, newIndex);

    // Update tasks state with new sort orders
    const updatedTasks = tasks.map((task) => {
      const reorderedIndex = reorderedTasks.findIndex((t) => t.id === task.id);
      if (reorderedIndex !== -1 && !task.completed && task.idea_id === ideaId) {
        return { ...task, sort_order: reorderedIndex + 1 };
      }
      return task;
    });
    setTasks(updatedTasks);

    // Persist to server
    try {
      const reorderData = reorderedTasks.map((task, index) => ({
        id: task.id,
        sort_order: index + 1,
      }));

      const res = await fetch("/api/admin/tasks/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: reorderData }),
      });

      if (!res.ok) {
        throw new Error("Failed to reorder tasks");
      }
    } catch (err) {
      console.error("Failed to save task order:", err);
      // Revert on error
      fetchData();
    }
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
          <Link
            href="/dashboard/tasks/activity"
            className="px-4 py-2 border border-black/10 dark:border-white/15 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            📋 Activity
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
                <button
                  onClick={() => openTaskDetail(inFocusTask)}
                  className="font-medium mt-0.5 text-left hover:underline"
                >
                  {inFocusTask.name}
                </button>
                {inFocusTask.idea_title && (
                  <Link
                    href={`/dashboard/tasks/${inFocusTask.idea_id}`}
                    className="text-xs opacity-70 hover:opacity-100 transition block"
                  >
                    📁 {inFocusTask.idea_title}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openTaskDetail(inFocusTask)}
                className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
                title="View details"
              >
                ℹ️ Details
              </button>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(idea.id, event)}
                >
                  <SortableContext
                    items={ideaTasks.filter((t) => !t.completed).slice(0, 5).map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div>
                      {ideaTasks.slice(0, 5).map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          isEditing={editingTaskId === task.id}
                          editingTaskName={editingTaskName}
                          onToggleComplete={toggleTaskComplete}
                          onToggleNowFocus={toggleNowFocus}
                          onToggleFocus={toggleTaskFocus}
                          onStartEdit={(t) => {
                            setEditingTaskId(t.id);
                            setEditingTaskName(t.name);
                          }}
                          onUpdateName={updateTaskName}
                          onCancelEdit={() => {
                            setEditingTaskId(null);
                            setEditingTaskName("");
                          }}
                          onEditingNameChange={setEditingTaskName}
                          onShowDetail={openTaskDetail}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {ideaTasks.length > 5 && (
                  <Link
                    href={`/dashboard/tasks/${idea.id}`}
                    className="block p-3 text-sm text-center opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition border-t border-black/5 dark:border-white/5"
                  >
                    +{ideaTasks.length - 5} more tasks
                  </Link>
                )}
                {ideaTasks.length === 0 && (
                  <div className="p-3 text-sm opacity-50 text-center">
                    No tasks yet
                  </div>
                )}

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

      {/* Task Detail Modal */}
      {detailTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailTask(null)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={toggleModalTaskComplete}
                    className={`w-6 h-6 rounded border flex items-center justify-center text-sm transition ${
                      detailTask.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-black/30 dark:border-white/30 hover:border-green-500"
                    }`}
                  >
                    {detailTask.completed && "✓"}
                  </button>
                  <input
                    type="text"
                    value={modalEditName}
                    onChange={(e) => setModalEditName(e.target.value)}
                    onBlur={saveModalTask}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveModalTask();
                      }
                    }}
                    className={`flex-1 text-lg font-semibold bg-transparent border-b border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-blue-500 focus:outline-none transition ${
                      detailTask.completed ? "line-through opacity-60" : ""
                    }`}
                  />
                </div>
                {detailTask.idea_title && (
                  <Link
                    href={`/dashboard/tasks/${detailTask.idea_id}`}
                    className="text-sm opacity-60 hover:opacity-100 transition"
                  >
                    📁 {detailTask.idea_title}
                  </Link>
                )}
              </div>
              <button
                onClick={() => setDetailTask(null)}
                className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleModalFocus("now")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    detailTask.focus === "now"
                      ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                      : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  🔥 {detailTask.focus === "now" ? "In Focus" : "Focus"}
                </button>
                <button
                  onClick={() => toggleModalFocus("today")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    detailTask.focus === "today"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-transparent hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  ☀️ {detailTask.focus === "today" ? "Today" : "Add to Today"}
                </button>
                {detailTask.milestone_name && (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    🎯 {detailTask.milestone_name}
                  </span>
                )}
              </div>

              {/* Note */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-2">Note</h3>
                <textarea
                  value={modalEditNote}
                  onChange={(e) => setModalEditNote(e.target.value)}
                  onBlur={saveModalTask}
                  placeholder="Add a note..."
                  rows={4}
                  className="w-full text-sm bg-black/5 dark:bg-white/5 rounded-lg p-3 border border-transparent hover:border-black/10 dark:hover:border-white/10 focus:border-blue-500 focus:outline-none resize-none transition"
                />
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-2">
                  Attachments
                  {modalAttachments.length > 0 && (
                    <span className="ml-1 text-blue-600 dark:text-blue-400">({modalAttachments.length})</span>
                  )}
                </h3>
                
                {/* Upload button */}
                <label className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg cursor-pointer transition mb-3">
                  <span>📎</span>
                  <span>{uploadingAttachment ? "Uploading..." : "Add attachment"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleAttachmentUpload}
                    disabled={uploadingAttachment}
                    className="hidden"
                  />
                </label>
                
                {/* Attachments list */}
                {loadingAttachments ? (
                  <p className="text-sm opacity-50">Loading attachments...</p>
                ) : modalAttachments.length > 0 ? (
                  <div className="space-y-2">
                    {modalAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-lg"
                      >
                        {/* Thumbnail for images */}
                        {attachment.contentType.startsWith("image/") && attachment.downloadUrl ? (
                          <a
                            href={attachment.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            {/* Using unoptimized for external signed URLs */}
                            <Image
                              src={attachment.downloadUrl}
                              alt={attachment.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded border border-black/10 dark:border-white/10"
                              unoptimized
                            />
                          </a>
                        ) : (
                          <span className="w-12 h-12 flex items-center justify-center text-2xl bg-black/5 dark:bg-white/5 rounded">
                            📄
                          </span>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                          >
                            {attachment.name}
                          </a>
                          <p className="text-xs opacity-50">
                            {formatFileSize(attachment.size)} · {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="p-1.5 text-sm opacity-50 hover:opacity-100 hover:text-red-500 transition"
                          title="Delete attachment"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm opacity-50">No attachments yet. Add screenshots, PDFs, or images.</p>
                )}
              </div>

              {/* Milestone deadline */}
              {detailTask.milestone_target_date && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1">Milestone Deadline</h3>
                  <p className="text-sm">
                    {new Date(detailTask.milestone_target_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1">Created</h3>
                  <p className="opacity-70">{new Date(detailTask.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}</p>
                </div>
                {detailTask.completed_at && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1">Completed</h3>
                    <p className="opacity-70">{new Date(detailTask.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/10 dark:border-white/10 flex justify-between items-center">
              <button
                onClick={deleteModalTask}
                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded transition"
              >
                🗑️ Delete
              </button>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/tasks/${detailTask.idea_id}`}
                  className="px-4 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded transition"
                >
                  Open Idea →
                </Link>
                <button
                  onClick={() => setDetailTask(null)}
                  className="px-4 py-1.5 text-sm bg-black/5 dark:bg-white/10 rounded hover:bg-black/10 dark:hover:bg-white/15 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
