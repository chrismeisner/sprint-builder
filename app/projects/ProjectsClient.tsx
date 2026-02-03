"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { SHOW_FIRST_PROJECT_MODAL } from "@/lib/feature-flags";
import { useToast } from "@/lib/toast-context";
import WelcomeModal from "@/components/ui/WelcomeModal";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  createdAt: string;
};

type Project = {
  id: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  accountId?: string | null;
  isOwner?: boolean | null;
};

type ProfileData = {
  profile: Profile;
  projects: Project[];
  projectMembers?: Record<string, Array<{ email: string; addedByAccount: string | null; createdAt: string }>>;
  stats: {
    totalDocuments: number;
    totalSprints: number;
    totalProjects: number;
  };
};

export default function ProjectsClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [memberModalProjectId, setMemberModalProjectId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [memberModalProjectName, setMemberModalProjectName] = useState<string>("");
  const [memberModalMembers, setMemberModalMembers] = useState<Array<{ email: string; addedByAccount: string | null; createdAt: string }>>([]);
  const [memberModalLoading, setMemberModalLoading] = useState(false);
  const [memberModalError, setMemberModalError] = useState<string | null>(null);
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberRemovingEmail, setMemberRemovingEmail] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const pageTitleClass = getTypographyClassName("h2");
  const pageSubtitleClass = getTypographyClassName("subtitle-sm");
  const sectionTitleClass = getTypographyClassName("h3");
  const helperTextClass = `${getTypographyClassName("body-sm")} opacity-70`;
  const bodyClass = getTypographyClassName("body-md");
  const bodySmClass = getTypographyClassName("body-sm");
  const monoMetaClass = `${getTypographyClassName("mono-sm")} opacity-70`;
  const tableHeadingClass = `${getTypographyClassName("mono-sm")} uppercase tracking-wide text-text-secondary text-left`;

  const projectById = useMemo(() => {
    const map: Record<string, Project> = {};
    data?.projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [data?.projects]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      
      const profileData: ProfileData = await res.json();
      setData(profileData);
      setError(null);
      setProjectError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Show welcome modal if user doesn't have first and last name set
    if (data && !data.profile.firstName && !data.profile.lastName) {
      setShowWelcomeModal(true);
    }
  }, [data]);

  useEffect(() => {
    if (!SHOW_FIRST_PROJECT_MODAL) return;
    if (data && data.projects.length === 0) {
      setShowProjectModal(true);
    }
  }, [data]);

  useEffect(() => {
    // Show toast when arriving from the magic link email
    if (searchParams.get("from") === "magic-email") {
      showToast("Logged in via magic link", "success");
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("from");
      router.replace(url.pathname + (url.search ? url.search : ""), { scroll: false });
    }
  }, [searchParams, router, showToast]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setProjectError("Project name is required");
      return;
    }

    try {
      setProjectSaving(true);
      setProjectError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create project");
      }

      setProjectName("");
      await fetchProfile();
      setShowProjectModal(false);
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setProjectSaving(false);
    }
  };

  const handleWelcomeComplete = async (firstName: string, lastName: string) => {
    try {
      setWelcomeSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`, // Also set the combined name for backward compatibility
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update profile");
      }

      await fetchProfile();
      setShowWelcomeModal(false);
      showToast(`Welcome, ${firstName}!`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save name", "error");
    } finally {
      setWelcomeSaving(false);
    }
  };

  const fetchProjectMembers = async (projectId: string) => {
    try {
      setMemberModalLoading(true);
      setMemberModalError(null);
      const res = await fetch(`/api/project-members?projectId=${projectId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch members");
      }
      const json = await res.json();
      const members = (json.members || []) as Array<{ email: string; addedByAccount: string | null; createdAt: string }>;
      setMemberModalMembers(members);
    } catch (err) {
      setMemberModalError(err instanceof Error ? err.message : "Failed to fetch members");
      setMemberModalMembers([]);
    } finally {
      setMemberModalLoading(false);
    }
  };

  const closeMemberModal = () => {
    setMemberModalProjectId(null);
    setMemberModalMembers([]);
    setMemberEmailInput("");
    setMemberModalError(null);
  };

  const addMember = async () => {
    if (!memberModalProjectId) return;
    const email = memberEmailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setMemberModalError("Enter a valid email");
      return;
    }
    try {
      setMemberSaving(true);
      setMemberModalError(null);
      const res = await fetch("/api/project-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: memberModalProjectId, email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add member");
      }
      setMemberEmailInput("");
      await fetchProjectMembers(memberModalProjectId);
      await fetchProfile();
    } catch (err) {
      setMemberModalError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setMemberSaving(false);
    }
  };

  const removeMember = async (email: string) => {
    if (!memberModalProjectId) return;
    try {
      setMemberRemovingEmail(email);
      setMemberModalError(null);
      const res = await fetch(`/api/project-members?projectId=${memberModalProjectId}&email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to remove member");
      }
      await fetchProjectMembers(memberModalProjectId);
      await fetchProfile();
    } catch (err) {
      setMemberModalError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setMemberRemovingEmail(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className={`${bodyClass} opacity-70`}>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-600/10 dark:bg-red-400/10 border border-red-600/20 dark:border-red-400/20 rounded-lg p-4">
          <p className={`${bodySmClass} font-semibold text-red-700 dark:text-red-300`}>Error</p>
          <p className={`${bodySmClass} text-red-600 dark:text-red-400`}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container min-h-screen max-w-6xl space-y-8 py-6">
      <WelcomeModal
        isOpen={showWelcomeModal}
        onComplete={handleWelcomeComplete}
        saving={welcomeSaving}
      />

      {showProjectModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-black border border-black/10 dark:border-white/15 shadow-xl">
            <div className="flex items-start justify-between p-4 border-b border-black/10 dark:border-white/15">
              <div>
                <p className={`${getTypographyClassName("mono-sm")} uppercase tracking-wide opacity-70`}>Start your first project</p>
                <h2 className={`${getTypographyClassName("h4")} mt-1`}>Create a project</h2>
              </div>
              <button
                onClick={() => setShowProjectModal(false)}
                className={`rounded-md p-1 ${bodySmClass} opacity-70 hover:opacity-100 transition`}
                aria-label="Close project modal"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <label className={`${getTypographyClassName("body-sm")} text-text-secondary`}>Project name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Apollo launch"
                  className={`w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 ${bodySmClass} focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                  disabled={projectSaving}
                  autoFocus
                />
                {projectError && (
                  <p className={`${bodySmClass} text-red-600 dark:text-red-400`}>{projectError}</p>
                )}
              </div>
            </div>
            <div className="px-5 pb-5 flex items-center gap-2">
              <button
                onClick={handleCreateProject}
                disabled={projectSaving}
                className={`${getTypographyClassName("button-md")} px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
              >
                {projectSaving ? "Creating..." : "Create project"}
              </button>
              <button
                onClick={() => setShowProjectModal(false)}
                disabled={projectSaving}
                className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {memberModalProjectId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-lg bg-white dark:bg-black border border-black/10 dark:border-white/15 shadow-xl">
            <div className="flex items-start justify-between p-4 border-b border-black/10 dark:border-white/15">
              <div>
                <p className={`${getTypographyClassName("mono-sm")} uppercase tracking-wide opacity-70`}>Project access</p>
                <h2 className={`${getTypographyClassName("h4")} mt-1`}>{memberModalProjectName}</h2>
              </div>
              <button
                onClick={closeMemberModal}
                className={`rounded-md p-1 ${bodySmClass} opacity-70 hover:opacity-100 transition`}
                aria-label="Close access modal"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {memberModalError && (
                <div className={`${bodySmClass} text-red-700 dark:text-red-300 bg-red-600/10 dark:bg-red-900/30 border border-red-600/20 dark:border-red-900/30 rounded-md px-3 py-2`}>
                  {memberModalError}
                </div>
              )}
              <div className="space-y-2">
                <p className={helperTextClass}>People with access</p>
                {memberModalLoading ? (
                  <p className={helperTextClass}>Loading members…</p>
                ) : memberModalMembers.length === 0 ? (
                  <p className={helperTextClass}>No members yet. Add the first email below.</p>
                ) : (
                  <div className="divide-y divide-black/10 dark:divide-white/15 rounded-md border border-black/10 dark:border-white/15">
                    {memberModalMembers.map((m) => (
                      <div key={`${m.email}-${m.createdAt}`} className="flex items-center justify-between px-3 py-2">
                        <div className="flex flex-col">
                          <span className={bodyClass}>{m.email}</span>
                          <span className={helperTextClass}>
                            Added {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => removeMember(m.email)}
                          disabled={memberRemovingEmail === m.email || !projectById[memberModalProjectId]?.isOwner}
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
                <p className={helperTextClass}>Add a new email</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    value={memberEmailInput}
                    onChange={(e) => setMemberEmailInput(e.target.value)}
                    className={`flex-1 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 ${bodySmClass} focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                    placeholder="user@example.com"
                    disabled={memberSaving || !projectById[memberModalProjectId]?.isOwner}
                  />
                  <button
                    onClick={addMember}
                    disabled={memberSaving || !projectById[memberModalProjectId]?.isOwner}
                    className={`${getTypographyClassName("button-md")} px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
                  >
                    {memberSaving ? "Adding..." : "Add"}
                  </button>
                </div>
                {!projectById[memberModalProjectId]?.isOwner && (
                  <p className={`${helperTextClass} italic`}>Only owners can add or remove members.</p>
                )}
              </div>
            </div>
            <div className="px-5 pb-4 flex justify-end">
              <button
                onClick={closeMemberModal}
                className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`${pageTitleClass} text-text-primary`}>Projects</h1>
          <p className={`${pageSubtitleClass} text-text-secondary`}>
            View and manage your projects
          </p>
        </div>
        {data.profile.isAdmin && (
          <button
            onClick={() => {
              setProjectName("");
              setProjectError(null);
              setShowProjectModal(true);
            }}
            className={`${getTypographyClassName("button-sm")} inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 hover:opacity-90 transition w-full lg:w-auto`}
          >
            New project
          </button>
        )}
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/15 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className={`${sectionTitleClass} text-text-primary`}>All Projects</h2>
              <p className={helperTextClass}>
                Track the initiatives you&apos;re running sprints for.
              </p>
            </div>
          </div>
        </div>
        {data.projects.length === 0 ? (
          <div className="p-6 text-center">
            <p className={`${helperTextClass}`}>
              No projects yet. Add your first project to keep related sprints together.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                <tr>
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>
                    Project
                  </th>
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>
                    Created
                  </th>
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>
                    Access
                  </th>
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>
                    Members
                  </th>
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/15">
                {data.projects.map((project) => (
                  <tr key={project.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${project.id}`} className="flex flex-col">
                        <div className={`${bodyClass} font-medium hover:underline`}>{project.name}</div>
                        <div className={monoMetaClass}>{project.id.slice(0, 8)}...</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={helperTextClass}>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={helperTextClass}>
                        {project.isOwner ? "Owner" : "Shared"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={helperTextClass}>
                        {data.projectMembers?.[project.id]?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className={`${getTypographyClassName("button-sm")} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition inline-block`}
                      >
                        Open project
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
