"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Package = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  projectId: string;
  projectName?: string;
};

export default function AddSprintFromPackage({ projectId, projectName }: Props) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        setPackagesError(null);
        const res = await fetch("/api/sprint-packages");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch packages");
        }
        const data = (await res.json().catch(() => ({}))) as { packages?: Package[] };
        setPackages(data.packages ?? []);
      } catch (err) {
        setPackagesError(err instanceof Error ? err.message : "Failed to fetch packages");
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleCreate = async () => {
    if (!selectedPackageId) {
      setError("Select a package to continue");
      return;
    }

    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    const title = selectedPkg?.name || `${projectName ?? "Project"} sprint`;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/sprint-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status: "draft",
          sprintPackageId: selectedPackageId,
          projectId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create sprint");
      }

      setSelectedPackageId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sprint");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
      <div className="flex-1 min-w-[220px]">
        <label className="block text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">
          Select from packages
        </label>
        <select
          value={selectedPackageId}
          onChange={(e) => {
            setSelectedPackageId(e.target.value);
            setError(null);
          }}
          className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          disabled={packagesLoading || saving}
        >
          <option value="">{packagesLoading ? "Loading packages..." : "Choose a package"}</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </select>
        {packagesError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{packagesError}</p>
        )}
      </div>
      <button
        onClick={handleCreate}
        disabled={packagesLoading || saving || !selectedPackageId}
        className="px-4 py-2 text-sm rounded-md bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/15 hover:opacity-90 disabled:opacity-50 transition"
      >
        {saving ? "Adding..." : "Add"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
