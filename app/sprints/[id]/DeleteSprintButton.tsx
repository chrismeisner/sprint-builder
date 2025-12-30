"use client";

import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  sprintId: string;
  visible: boolean;
};

export default function DeleteSprintButton({ sprintId, visible }: Props) {
  if (!visible) return null;

  const handleDelete = async () => {
    if (!confirm("Delete this sprint? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/sprint-drafts?id=${sprintId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Failed to delete sprint");
        return;
      }
      window.location.href = "/dashboard/sprint-builder";
    } catch (_error) {
      alert("Failed to delete sprint");
    }
  };

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={handleDelete}
        className={`inline-flex items-center rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 ${getTypographyClassName("button-sm")}`}
      >
        Delete sprint
      </button>
    </section>
  );
}

