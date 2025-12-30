import { promises as fs } from "fs";
import path from "path";

const PAGE_FILE_REGEX = /^page\.(tsx|ts|jsx|js|mdx)$/;

export type AppPageInfo = {
  route: string;
  filePath: string;
  updatedAt: string;
};

function buildRouteFromSegments(segments: string[]): string {
  const filtered = segments.filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  const route = filtered.join("/");
  return route ? `/${route}` : "/";
}

async function walkAppDir(
  dir: string,
  segments: string[],
  results: AppPageInfo[],
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Skip API routes; they are not pages.
      if (entry.name === "api") continue;
      await walkAppDir(path.join(dir, entry.name), [...segments, entry.name], results);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!PAGE_FILE_REGEX.test(entry.name)) continue;

    const filePath = path.join(dir, entry.name);
    const stat = await fs.stat(filePath);
    const route = buildRouteFromSegments(segments);
    const relativeFilePath = path
      .relative(process.cwd(), filePath)
      .split(path.sep)
      .join("/");

    results.push({
      route,
      filePath: relativeFilePath,
      updatedAt: stat.mtime.toISOString(),
    });
  }
}

export async function listAppPages(): Promise<AppPageInfo[]> {
  const appDir = path.join(process.cwd(), "app");
  const results: AppPageInfo[] = [];
  await walkAppDir(appDir, [], results);
  return results.sort((a, b) => a.route.localeCompare(b.route));
}

