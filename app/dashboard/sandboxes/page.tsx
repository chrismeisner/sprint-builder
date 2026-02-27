import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPool, ensureSchema } from "@/lib/db";
import Typography from "@/components/ui/Typography";
import { CopyLinkButton } from "./CopyLinkButton";

const SANDBOXES_DIR = path.join(process.cwd(), "sandboxes-data");
const APP_SANDBOXES_DIR = path.join(process.cwd(), "app", "sandboxes");
const BUILD_DIRS = ["out", "dist", "build"];

type SandboxFolder = {
  folderName: string;
  displayName: string;
  launchUrl: string;
  buildDir: string | null; // "route", "root", "out", "dist", "build", or null
  fileCount: number;
  registeredProjectName: string | null;
};

function scanFolders(): Omit<SandboxFolder, "registeredProjectName">[] {
  if (!fs.existsSync(SANDBOXES_DIR)) return [];

  return fs
    .readdirSync(SANDBOXES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const folderName = e.name;
      const folderPath = path.join(SANDBOXES_DIR, folderName);
      const files = fs.readdirSync(folderPath);
      const fileCount = files.length;

      const displayName = folderName
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      // Check if this sandbox lives as a native Next.js route in app/sandboxes/
      const appRoutePath = path.join(APP_SANDBOXES_DIR, folderName);
      if (fs.existsSync(appRoutePath)) {
        return {
          folderName,
          displayName,
          launchUrl: `/sandboxes/${folderName}/`,
          buildDir: "route",
          fileCount,
        };
      }

      // Otherwise look for a static index.html in the folder or a build dir
      let buildDir: string | null = null;
      if (files.includes("index.html")) {
        buildDir = "root";
      } else {
        for (const dir of BUILD_DIRS) {
          const p = path.join(folderPath, dir, "index.html");
          if (fs.existsSync(p)) {
            buildDir = dir;
            break;
          }
        }
      }

      return {
        folderName,
        displayName,
        launchUrl: `/api/sandbox-files/${folderName}/`,
        buildDir,
        fileCount,
      };
    });
}

export default async function SandboxIndexPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/dashboard");

  const folders = scanFolders();

  // Look up registration status for all folders in one query
  await ensureSchema();
  const pool = getPool();
  const folderNames = folders.map((f) => f.folderName);
  const regResult = folderNames.length
    ? await pool.query(
        `SELECT s.folder_name, p.name AS project_name
         FROM sandboxes s
         LEFT JOIN projects p ON s.project_id = p.id
         WHERE s.folder_name = ANY($1)`,
        [folderNames]
      )
    : { rows: [] };

  const regMap = new Map<string, string>(
    regResult.rows.map((r: { folder_name: string; project_name: string | null }) => [
      r.folder_name,
      r.project_name ?? "Unlinked",
    ])
  );

  const sandboxes: SandboxFolder[] = folders.map((f) => ({
    ...f,
    registeredProjectName: regMap.get(f.folderName) ?? null,
  }));

  const readyCount = sandboxes.filter((s) => s.buildDir !== null).length;
  const unregisteredCount = sandboxes.filter((s) => s.registeredProjectName === null).length;

  return (
    <div className="container max-w-5xl py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Typography as="h1" scale="h2">
          🧪 Sandbox Index
        </Typography>
        <Typography as="p" scale="body-sm" className="text-black/70 dark:text-white/70">
          All folders in <code>sandboxes-data/</code> — launch and test prototypes before linking them to a project.
        </Typography>
        <div className="flex items-center gap-4">
          <span className="text-sm text-black/50 dark:text-white/50">
            {sandboxes.length} folder{sandboxes.length !== 1 ? "s" : ""}
          </span>
          <span className="text-sm text-black/50 dark:text-white/50">·</span>
          <span className="text-sm text-black/50 dark:text-white/50">
            {readyCount} ready to launch
          </span>
          {unregisteredCount > 0 && (
            <>
              <span className="text-sm text-black/50 dark:text-white/50">·</span>
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {unregisteredCount} unregistered
              </span>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border border-stroke-muted bg-surface-card">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stroke-muted bg-surface-strong/60 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-semibold">Folder</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Built from</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sandboxes.map((s) => (
              <tr
                key={s.folderName}
                className="border-b border-stroke-muted/70 last:border-b-0"
              >
                {/* Folder */}
                <td className="px-4 py-3">
                  <div className="font-medium">{s.displayName}</div>
                  <div className="font-mono text-[11px] text-black/40 dark:text-white/40">
                    {s.folderName}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {s.buildDir === "route" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                      <span className="size-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                      Live route
                    </span>
                  ) : s.buildDir !== null ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      <span className="size-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-black/50 dark:text-white/40">
                      <span className="size-1.5 rounded-full bg-neutral-400" />
                      No index
                    </span>
                  )}
                </td>

                {/* Build dir */}
                <td className="px-4 py-3">
                  {s.buildDir === null ? (
                    <span className="text-black/30 dark:text-white/30">—</span>
                  ) : s.buildDir === "route" ? (
                    <span className="font-mono text-xs text-black/50 dark:text-white/40">app/sandboxes/</span>
                  ) : s.buildDir === "root" ? (
                    <span className="font-mono text-xs text-black/50 dark:text-white/40">/</span>
                  ) : (
                    <span className="font-mono text-xs text-black/60 dark:text-white/50">
                      /{s.buildDir}/
                    </span>
                  )}
                </td>

                {/* Project */}
                <td className="px-4 py-3">
                  {s.registeredProjectName ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {s.registeredProjectName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Unregistered
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  {s.buildDir !== null ? (
                    <div className="flex items-center justify-end gap-2">
                      <CopyLinkButton url={s.launchUrl} />
                      <a
                        href={s.launchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stroke-muted bg-surface-strong/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong"
                      >
                        Launch ↗
                      </a>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs text-black/30 dark:text-white/30">—</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <Typography as="p" scale="body-sm" className="text-black/40 dark:text-white/40">
        To link a sandbox to a project, go to the project page and use &ldquo;Add App Link&rdquo; → &ldquo;Link Folder&rdquo;.
      </Typography>
    </div>
  );
}
