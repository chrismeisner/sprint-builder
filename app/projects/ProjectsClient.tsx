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
  status: ProjectStatus;
  projectType: ProjectType;
  emoji: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  accountId?: string | null;
  isOwner?: boolean | null;
};

// Valid project status values (admin-only single select)
const PROJECT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

type ProjectStatus = typeof PROJECT_STATUSES[number]['value'];

// Valid project type values (admin-only single select)
const PROJECT_TYPES = [
  { value: 'client', label: 'Client' },
  { value: 'internal', label: 'Internal' },
] as const;

type ProjectType = typeof PROJECT_TYPES[number]['value'];

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
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [typeUpdating, setTypeUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('active');
  const [sortKey, setSortKey] = useState<'name' | 'type' | 'status' | 'created' | 'updated' | 'members'>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (localStorage.getItem('projects-view-mode') as 'table' | 'grid') ?? 'grid';
  });

  const handleSetViewMode = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('projects-view-mode', mode);
  };
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

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      setStatusUpdating(projectId);
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update status");
      }

      await fetchProfile();
      showToast("Project status updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleTypeChange = async (projectId: string, newType: ProjectType) => {
    try {
      setTypeUpdating(projectId);
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, projectType: newType }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update project type");
      }

      await fetchProfile();
      showToast("Project type updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update project type", "error");
    } finally {
      setTypeUpdating(null);
    }
  };

  const getTypeBadgeClasses = (type: ProjectType) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    switch (type) {
      case 'client':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`;
      case 'internal':
        return `${baseClasses} bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
    }
  };

  const getStatusBadgeClasses = (status: ProjectStatus) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
      case 'on_hold':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
    }
  };

  const getStatusAccentClasses = (status: ProjectStatus) => {
    switch (status) {
      case 'active':    return 'bg-green-500';
      case 'on_hold':   return 'bg-yellow-400';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-gray-400';
      default:          return 'bg-gray-300';
    }
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortProjects = (list: Project[]) => {
    const statusOrder: Record<ProjectStatus, number> = { active: 0, on_hold: 1, completed: 2, cancelled: 3 };
    const typeOrder: Record<string, number> = { client: 0, internal: 1 };
    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'type':
          cmp = (typeOrder[a.projectType] ?? 9) - (typeOrder[b.projectType] ?? 9);
          break;
        case 'status':
          cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
          break;
        case 'created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'members':
          cmp = (data?.projectMembers?.[a.id]?.length ?? 0) - (data?.projectMembers?.[b.id]?.length ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) {
      return <span className="ml-1 opacity-30">↕</span>;
    }
    return <span className="ml-1 opacity-80">{sortDir === 'asc' ? '↑' : '↓'}</span>;
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

      {/* Projects Table / Grid */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/15 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className={`${sectionTitleClass} text-text-primary`}>All Projects</h2>
              <p className={helperTextClass}>
                Track the initiatives you&apos;re running sprints for.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Sort dropdown — shown in grid mode */}
              {viewMode === 'grid' && data.projects.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={`${sortKey}-${sortDir}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      const dir = val.endsWith('-asc') ? 'asc' : 'desc';
                      const k = val.slice(0, val.lastIndexOf('-')) as typeof sortKey;
                      setSortKey(k);
                      setSortDir(dir);
                    }}
                    className={`${bodySmClass} px-2 py-1.5 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer`}
                  >
                    <option value="updated-desc">Last modified (newest)</option>
                    <option value="updated-asc">Last modified (oldest)</option>
                    <option value="created-desc">Created (newest)</option>
                    <option value="created-asc">Created (oldest)</option>
                    <option value="name-asc">Name A→Z</option>
                    <option value="name-desc">Name Z→A</option>
                    <option value="status-asc">Status</option>
                    <option value="type-asc">Type</option>
                    <option value="members-desc">Most members</option>
                  </select>
                </div>
              )}
              {/* View toggle */}
              <div className="flex items-center rounded-md border border-black/15 dark:border-white/15 overflow-hidden">
                <button
                  onClick={() => handleSetViewMode('table')}
                  title="Table view"
                  className={`px-2.5 py-1.5 transition ${viewMode === 'table' ? 'bg-black dark:bg-white text-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleSetViewMode('grid')}
                  title="Grid view"
                  className={`px-2.5 py-1.5 transition border-l border-black/15 dark:border-white/15 ${viewMode === 'grid' ? 'bg-black dark:bg-white text-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Status filter pills */}
          {data.projects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`${bodySmClass} px-3 py-1 rounded-full border transition ${
                  statusFilter === 'all'
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                All
                <span className="ml-1.5 opacity-60">{data.projects.length}</span>
              </button>
              {PROJECT_STATUSES.map((s) => {
                const count = data.projects.filter((p) => (p.status || 'active') === s.value).length;
                if (count === 0) return null;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
                    className={`${bodySmClass} px-3 py-1 rounded-full border transition ${
                      statusFilter === s.value
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {data.projects.length === 0 ? (
          <div className="p-6 text-center">
            <p className={`${helperTextClass}`}>
              No projects yet. Add your first project to keep related sprints together.
            </p>
          </div>
        ) : (() => {
          const filtered = statusFilter === 'all'
            ? data.projects
            : data.projects.filter((p) => (p.status || 'active') === statusFilter);
          const filteredProjects = sortProjects(filtered);
          if (filteredProjects.length === 0) return (
            <div className="p-6 text-center">
              <p className={helperTextClass}>
                No {PROJECT_STATUSES.find((s) => s.value === statusFilter)?.label.toLowerCase()} projects.
              </p>
            </div>
          );
          if (viewMode === 'grid') return (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const status = project.status || 'active';
                const type = project.projectType || 'client';
                const memberCount = data.projectMembers?.[project.id]?.length ?? 0;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex flex-col rounded-lg border border-black/10 dark:border-white/15 overflow-hidden hover:shadow-md hover:border-black/20 dark:hover:border-white/25 transition"
                  >
                    {/* Cover area */}
                    {project.emoji ? (
                      <div className={`flex items-center justify-center h-20 text-5xl select-none ${
                        status === 'active'    ? 'bg-green-50 dark:bg-green-950/30' :
                        status === 'on_hold'   ? 'bg-yellow-50 dark:bg-yellow-950/30' :
                        status === 'completed' ? 'bg-blue-50 dark:bg-blue-950/30' :
                                                 'bg-neutral-100 dark:bg-white/5'
                      }`}>
                        {project.emoji}
                      </div>
                    ) : (
                      <div className={`h-1.5 w-full ${getStatusAccentClasses(status)}`} />
                    )}
                    <div className="flex flex-col flex-1 p-4 gap-3">
                      {/* Name + badges */}
                      <div className="flex flex-col gap-1.5">
                        <span className={`${bodyClass} font-semibold leading-snug`}>
                          {project.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={getStatusBadgeClasses(status)}>
                            {PROJECT_STATUSES.find(s => s.value === status)?.label}
                          </span>
                          <span className={getTypeBadgeClasses(type)}>
                            {PROJECT_TYPES.find(t => t.value === type)?.label}
                          </span>
                        </div>
                      </div>
                      {/* Meta row */}
                      <div className={`flex items-center gap-3 ${monoMetaClass}`}>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                        <span>·</span>
                        <span>{project.isOwner ? 'Owner' : 'Shared'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          );
          return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                <tr>
                  <th className="w-1 p-0" />
                  {(
                    [
                      { key: 'name',    label: 'Project'       },
                      { key: 'type',    label: 'Type'          },
                      { key: 'status',  label: 'Status'        },
                      { key: 'created', label: 'Created'       },
                      { key: 'updated', label: 'Last Modified' },
                    ] as { key: typeof sortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <th key={key} className={`px-4 py-3 ${tableHeadingClass}`}>
                      <button
                        onClick={() => handleSort(key)}
                        className="inline-flex items-center gap-0.5 hover:opacity-100 opacity-70 transition select-none"
                      >
                        {label}
                        <SortIcon col={key} />
                      </button>
                    </th>
                  ))}
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>Access</th>
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>
                    <button
                      onClick={() => handleSort('members')}
                      className="inline-flex items-center gap-0.5 hover:opacity-100 opacity-70 transition select-none"
                    >
                      Members
                      <SortIcon col="members" />
                    </button>
                  </th>
                  <th className={`px-4 py-3 ${tableHeadingClass}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/15">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="w-1 p-0">
                      <div className={`w-1 h-full min-h-[3rem] ${getStatusAccentClasses(project.status || 'active')}`} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/projects/${project.id}`} className="flex flex-col">
                        <div className={`${bodyClass} font-medium hover:underline`}>{project.name}</div>
                        <div className={monoMetaClass}>{project.id.slice(0, 8)}...</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {data.profile.isAdmin ? (
                        <select
                          value={project.projectType || 'client'}
                          onChange={(e) => handleTypeChange(project.id, e.target.value as ProjectType)}
                          disabled={typeUpdating === project.id}
                          className={`${bodySmClass} px-2 py-1 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 cursor-pointer`}
                        >
                          {PROJECT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={getTypeBadgeClasses(project.projectType || 'client')}>
                          {PROJECT_TYPES.find(t => t.value === (project.projectType || 'client'))?.label || 'Client'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {data.profile.isAdmin ? (
                        <select
                          value={project.status || 'active'}
                          onChange={(e) => handleStatusChange(project.id, e.target.value as ProjectStatus)}
                          disabled={statusUpdating === project.id}
                          className={`${bodySmClass} px-2 py-1 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 cursor-pointer`}
                        >
                          {PROJECT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={getStatusBadgeClasses(project.status || 'active')}>
                          {PROJECT_STATUSES.find(s => s.value === (project.status || 'active'))?.label || 'Active'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={helperTextClass}>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={helperTextClass}>
                        {new Date(project.updatedAt).toLocaleDateString()}
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
          );
        })()}

      </div>
    </div>
  );
}
