/**
 * Read-only harness for lib/export-markdown.ts.
 * Usage: DATABASE_URL=... npx tsx scripts/verify-export.ts <projectId> <sprintId>
 * Issues SELECTs only — never calls ensureSchema, never writes.
 */
import { writeFileSync } from "fs";
import { renderProjectMarkdown, renderSprintMarkdown } from "../lib/export-markdown";

async function main() {
  const [projectId, sprintId, outDir] = process.argv.slice(2);

  if (projectId) {
    const res = await renderProjectMarkdown(projectId);
    if (!res) throw new Error(`No project ${projectId}`);
    writeFileSync(`${outDir}/${res.filename}`, res.markdown);
    console.log(`project → ${res.filename} (${res.markdown.length} chars, ${res.markdown.split("\n").length} lines)`);
  }

  if (sprintId) {
    const res = await renderSprintMarkdown(sprintId);
    if (!res) throw new Error(`No sprint ${sprintId}`);
    writeFileSync(`${outDir}/${res.filename}`, res.markdown);
    console.log(`sprint  → ${res.filename} (${res.markdown.length} chars, ${res.markdown.split("\n").length} lines)`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
