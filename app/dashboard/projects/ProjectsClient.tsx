"use client";

import { useState } from "react";
import Link from "next/link";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography as="h1" scale="h2">
          Past Projects
        </Typography>
        <Button as={Link} href="/dashboard/projects/new" variant="primary">
          + New Project
        </Button>
      </div>

      <div className="space-y-1">
        <Typography as="p" scale="body-sm" className="text-black/70 dark:text-white/70">
          Manage your portfolio of past work to show potential clients.
        </Typography>
        <div className="flex items-center gap-4">
          <Typography
            as={Link}
            href="/work"
            target="_blank"
            scale="body-sm"
            className="underline hover:opacity-80"
          >
            View public portfolio →
          </Typography>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-8 text-center">
          <Typography as="p" scale="body-sm" className="text-black/70 dark:text-white/70">
            No projects yet. Create your first one.
          </Typography>
        </div>
      ) : (
        <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-black/5 dark:bg-white/5 text-left">
              <tr>
                <th className="px-4 py-3">
                  <Typography as="span" scale="subtitle-sm">
                    Title
                  </Typography>
                </th>
                <th className="px-4 py-3">
                  <Typography as="span" scale="subtitle-sm">
                    Year
                  </Typography>
                </th>
                <th className="px-4 py-3">
                  <Typography as="span" scale="subtitle-sm">
                    Type
                  </Typography>
                </th>
                <th className="px-4 py-3">
                  <Typography as="span" scale="subtitle-sm">
                    Status
                  </Typography>
                </th>
                <th className="px-4 py-3">
                  <Typography as="span" scale="subtitle-sm">
                    Actions
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Typography as="div" scale="body-md">
                        {project.title}
                      </Typography>
                      <Typography as="div" scale="body-sm" className="text-black/60 dark:text-white/60">
                        {project.slug}
                      </Typography>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Typography as="span" scale="body-sm">
                      {project.year || "—"}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    {project.involvement_type ? (
                      <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5">
                        <Typography as="span" scale="subtitle-sm">
                          {project.involvement_type}
                        </Typography>
                      </span>
                    ) : (
                      <Typography as="span" scale="body-sm">
                        —
                      </Typography>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePublished(project.id, project.published)}
                        disabled={loading === project.id}
                        className={`px-2 py-1 rounded ${
                          project.published
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        } disabled:opacity-50`}
                      >
                        <Typography as="span" scale="subtitle-sm">
                          {project.published ? "Published" : "Draft"}
                        </Typography>
                      </button>
                      {project.featured && (
                        <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          <Typography as="span" scale="subtitle-sm">
                            ⭐ Featured
                          </Typography>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Typography
                        as={Link}
                        href={`/dashboard/projects/${project.id}/edit`}
                        scale="body-sm"
                        className="underline hover:opacity-70"
                      >
                        Edit
                      </Typography>
                      <button
                        onClick={() => toggleFeatured(project.id, project.featured)}
                        disabled={loading === project.id}
                        className="underline hover:opacity-70 disabled:opacity-50"
                      >
                        <Typography as="span" scale="body-sm">
                          {project.featured ? "Unfeature" : "Feature"}
                        </Typography>
                      </button>
                      <Typography
                        as={Link}
                        href={`/work/${project.slug}`}
                        target="_blank"
                        scale="body-sm"
                        className="underline hover:opacity-70"
                      >
                        View
                      </Typography>
                      <button
                        onClick={() => deleteProject(project.id, project.title)}
                        disabled={loading === project.id}
                        className="text-red-600 dark:text-red-400 underline hover:opacity-70 disabled:opacity-50"
                      >
                        <Typography as="span" scale="body-sm">
                          Delete
                        </Typography>
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

