"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Typography from "@/components/ui/Typography";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Member = { email: string; addedByAccount: string | null; createdAt: string };

type Props = {
  projectId: string;
  projectName: string;
  isOwner: boolean;
};

export default function ProjectActions({ projectId, projectName, isOwner }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberRemovingEmail, setMemberRemovingEmail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const bodySmClass = getTypographyClassName("body-sm");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/project-members?projectId=${projectId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch members");
      }
      const json = await res.json();
      setMembers((json.members || []) as Member[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMember = async () => {
    const email = memberEmailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    try {
      setMemberSaving(true);
      setError(null);
      const res = await fetch("/api/project-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add member");
      }
      setMemberEmailInput("");
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setMemberSaving(false);
    }
  };

  const removeMember = async (email: string) => {
    try {
      setMemberRemovingEmail(email);
      setError(null);
      const res = await fetch(`/api/project-members?projectId=${projectId}&email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to remove member");
      }
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setMemberRemovingEmail(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!isOwner) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/projects?id=${projectId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project");
      }
      router.push("/profile");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProject}
        title="Delete project?"
        message={`Are you sure you want to delete "${projectName}"? This action cannot be undone.`}
        confirmText="Delete project"
        cancelText="Cancel"
        variant="danger"
      />

      <div className="flex items-center justify-between">
        <Typography as="h3" scale="h4">
          Project access
        </Typography>
        <Typography as="span" scale="mono-sm" className="opacity-70">
          {projectName}
        </Typography>
      </div>

      {error && (
        <div className={`${bodySmClass} text-red-700 dark:text-red-300 bg-red-600/10 dark:bg-red-900/30 border border-red-600/20 dark:border-red-900/30 rounded-md px-3 py-2`}>
          {error}
        </div>
      )}

      <div className="space-y-2">
        <p className={bodySmClass}>People with access</p>
        {loading ? (
          <p className={bodySmClass}>Loading members…</p>
        ) : members.length === 0 ? (
          <p className={bodySmClass}>No members yet. Add the first email below.</p>
        ) : (
          <div className="divide-y divide-black/10 dark:divide-white/15 rounded-md border border-black/10 dark:border-white/15">
            {members.map((m) => (
              <div key={`${m.email}-${m.createdAt}`} className="flex items-center justify-between px-3 py-2">
                <div className="flex flex-col">
                  <span className={bodySmClass}>{m.email}</span>
                  <span className={`${bodySmClass} opacity-70`}>
                    Added {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => removeMember(m.email)}
                  disabled={memberRemovingEmail === m.email || !isOwner}
                  className={`${bodySmClass} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                >
                  {memberRemovingEmail === m.email ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className={bodySmClass}>Add member by email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={memberEmailInput}
            onChange={(e) => setMemberEmailInput(e.target.value)}
            className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            placeholder="user@example.com"
            disabled={!isOwner || memberSaving}
          />
          <button
            onClick={addMember}
            disabled={!isOwner || memberSaving}
            className={`${getTypographyClassName("button-sm")} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
          >
            {memberSaving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-black/10 dark:border-white/15 flex justify-end">
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={!isOwner || deleting}
          className={`${getTypographyClassName("button-sm")} inline-flex items-center rounded-md border border-red-200 text-red-700 dark:border-red-800 dark:text-red-300 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition`}
        >
          {deleting ? "Deleting..." : "Delete project"}
        </button>
      </div>
    </div>
  );
}

