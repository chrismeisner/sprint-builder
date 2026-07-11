import { redirect } from "next/navigation";

// Retired: the update-cycle intake is consolidated into the unified scoping
// flow at /scope (choose "a focused refinement" — creates a refinement_cycle
// proposal hill). The old form (./UpdatesIntakeClient) and its /api/documents
// POST are kept as reversible dead code. No data was removed.
export default function UpdatesIntakePage() {
  redirect("/scope");
}
