import { redirect } from "next/navigation";

// Retired: the public new-client intake form is consolidated into the unified
// scoping flow at /scope, which creates a scope-phase "proposal hill" (see
// docs/hill-model.md). The old form component (./IntakeClient) and its POST to
// /api/documents are kept in place as reversible dead code — restore this page
// to re-enable it. No data was removed.
export default function IntakePage() {
  redirect("/scope");
}
