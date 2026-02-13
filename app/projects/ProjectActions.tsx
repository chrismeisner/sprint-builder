"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Typography from "@/components/ui/Typography";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Member = { email: string; role: string; addedByAccount: string | null; createdAt: string };

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
  const [roleUpdatingEmail, setRoleUpdatingEmail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

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
      setAddMemberSuccess(null);
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
      setAddMemberSuccess(email);
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
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setMemberRemovingEmail(null);
    }
  };

  const updateRole = async (email: string, newRole: string) => {
    try {
      setRoleUpdatingEmail(email);
      setError(null);
      const res = await fetch("/api/project-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email, role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update role");
      }
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setRoleUpdatingEmail(null);
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
              <div key={`${m.email}-${m.createdAt}`} className="flex items-center justify-between px-3 py-2 gap-2">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`${bodySmClass} truncate`}>{m.email}</span>
                    {m.role === "lead" && (
                      <span className={`${bodySmClass} shrink-0 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-0.5 text-[11px] font-medium`}>
                        Lead
                      </span>
                    )}
                  </div>
                  <span className={`${bodySmClass} opacity-70`}>
                    Added {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOwner && (
                    <select
                      value={m.role || "member"}
                      onChange={(e) => updateRole(m.email, e.target.value)}
                      disabled={roleUpdatingEmail === m.email}
                      className={`${bodySmClass} rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 transition cursor-pointer`}
                    >
                      <option value="member">Member</option>
                      <option value="lead">Lead</option>
                    </select>
                  )}
                  <button
                    onClick={() => {
                      setMemberToRemove(m.email);
                      setShowRemoveMemberModal(true);
                      setError(null);
                    }}
                    disabled={memberRemovingEmail === m.email || !isOwner}
                    className={`${bodySmClass} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          onClick={() => {
            setShowAddMemberModal(true);
            setError(null);
            setAddMemberSuccess(null);
            setMemberEmailInput("");
          }}
          disabled={!isOwner}
          className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50 transition shadow-sm`}
        >
          Add member
        </button>
      </div>

      {/* Add member modal */}
      {showAddMemberModal && (
        <dialog
          open
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMemberModal(false);
              setAddMemberSuccess(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          style={{ margin: 0, maxWidth: "100vw", maxHeight: "100vh", width: "100vw", height: "100vh", border: "none", background: "transparent" }}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-black/10 dark:border-white/10 p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Typography as="h2" scale="h3" className="text-black dark:text-white">
                Add member
              </Typography>
              <button
                onClick={() => { setShowAddMemberModal(false); setAddMemberSuccess(null); }}
                className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition p-1"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p className={`${bodySmClass} text-black/70 dark:text-white/70`}>
              Enter an email address to invite someone to <strong>{projectName}</strong>. They&apos;ll receive an email with instructions on how to access the project.
            </p>

            {addMemberSuccess && (
              <div className={`${bodySmClass} text-green-700 dark:text-green-300 bg-green-600/10 dark:bg-green-900/30 border border-green-600/20 dark:border-green-900/30 rounded-md px-3 py-2`}>
                <strong>{addMemberSuccess}</strong> has been added and notified via email.
              </div>
            )}

            {error && (
              <div className={`${bodySmClass} text-red-700 dark:text-red-300 bg-red-600/10 dark:bg-red-900/30 border border-red-600/20 dark:border-red-900/30 rounded-md px-3 py-2`}>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={`${bodySmClass} block mb-1.5`}>Email address</label>
                <input
                  type="email"
                  value={memberEmailInput}
                  onChange={(e) => { setMemberEmailInput(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="user@example.com"
                  disabled={memberSaving}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button
                  onClick={() => { setShowAddMemberModal(false); setAddMemberSuccess(null); }}
                  className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/15 dark:border-white/20 bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                >
                  {addMemberSuccess ? "Done" : "Cancel"}
                </button>
                <button
                  onClick={addMember}
                  disabled={memberSaving || !memberEmailInput.trim()}
                  className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50 transition-colors shadow-sm`}
                >
                  {memberSaving ? "Adding..." : "Add member"}
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* Remove member confirmation modal */}
      <ConfirmModal
        isOpen={showRemoveMemberModal}
        onClose={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }}
        onConfirm={() => {
          if (memberToRemove) {
            removeMember(memberToRemove);
          }
        }}
        title="Remove member?"
        message={memberToRemove ? `Are you sure you want to remove ${memberToRemove} from "${projectName}"? They will lose access to the project.` : "Are you sure you want to remove this member?"}
        confirmText={memberRemovingEmail ? "Removing..." : "Remove member"}
        cancelText="Cancel"
        variant="danger"
      />

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

