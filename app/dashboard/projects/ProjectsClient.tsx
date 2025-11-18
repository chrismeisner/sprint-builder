"use client";

import { useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  involvement_type: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

type Props = {
  initialProjects: Project[];
};

export default function ProjectsClient({ initialProjects }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState<string | null>(null);

  async function togglePublished(id: string, currentValue: boolean) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
      
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, published: !currentValue } : p))
      );
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(null);
    }
  }

  async function toggleFeatured(id: string, currentValue: boolean) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
      
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, featured: !currentValue } : p))
      );
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(null);
    }
  }

  async function deleteProject(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(null);
    }
  }

  async function seedWink() {
    setLoading("seed");
    try {
      const res = await fetch("/api/admin/projects/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed");
      
      alert(data.message);
      // Refresh projects
      const listRes = await fetch("/api/admin/projects");
      const listData = await listRes.json();
      setProjects(listData.projects);
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Past Projects</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={seedWink}
            disabled={loading === "seed"}
            className="rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            {loading === "seed" ? "Seeding..." : "Seed Wink Example"}
          </button>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + New Project
          </Link>
        </div>
      </div>

      <div className="text-sm opacity-70 space-y-1">
        <p>Manage your portfolio of past work to show potential clients.</p>
        <div className="flex items-center gap-4">
          <Link href="/work" className="underline hover:opacity-80" target="_blank">
            View public portfolio →
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-8 text-center">
          <p className="text-sm opacity-70">No projects yet. Create your first one or seed the Wink example.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-xs opacity-60 font-mono">{project.slug}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{project.year || "—"}</td>
                  <td className="px-4 py-3">
                    {project.involvement_type ? (
                      <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5 text-xs">
                        {project.involvement_type}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePublished(project.id, project.published)}
                        disabled={loading === project.id}
                        className={`text-xs px-2 py-1 rounded ${
                          project.published
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        } disabled:opacity-50`}
                      >
                        {project.published ? "Published" : "Draft"}
                      </button>
                      {project.featured && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="text-xs underline hover:opacity-70"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleFeatured(project.id, project.featured)}
                        disabled={loading === project.id}
                        className="text-xs underline hover:opacity-70 disabled:opacity-50"
                      >
                        {project.featured ? "Unfeature" : "Feature"}
                      </button>
                      <Link
                        href={`/work/${project.slug}`}
                        target="_blank"
                        className="text-xs underline hover:opacity-70"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => deleteProject(project.id, project.title)}
                        disabled={loading === project.id}
                        className="text-xs text-red-600 dark:text-red-400 underline hover:opacity-70 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

