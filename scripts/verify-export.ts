/**
 * Read-only harness for lib/export-markdown.ts.
 * Usage: DATABASE_URL=... npx tsx scripts/verify-export.ts <projectId> <sprintId> <cycleId> <outDir>
 * Pass "-" to skip any of the three ids. Issues SELECTs only — never calls
 * ensureSchema, never writes.
 */
import { writeFileSync } from "fs";
import {
  renderProjectMarkdown,
  renderRefinementCycleMarkdown,
  renderSprintMarkdown,
} from "../lib/export-markdown";

async function main() {
  const [rawProject, rawSprint, rawCycle, outDir] = process.argv.slice(2);
  const skip = (v: string | undefined) => (!v || v === "-" ? undefined : v);
  const projectId = skip(rawProject);
  const sprintId = skip(rawSprint);
  const cycleId = skip(rawCycle);

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

  if (cycleId) {
    const res = await renderRefinementCycleMarkdown(cycleId);
    if (!res) throw new Error(`No refinement cycle ${cycleId}`);
    writeFileSync(`${outDir}/${res.filename}`, res.markdown);
    console.log(`cycle   → ${res.filename} (${res.markdown.length} chars, ${res.markdown.split("\n").length} lines)`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
