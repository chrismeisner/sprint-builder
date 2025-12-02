import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import HowItWorksWriterClient from "./HowItWorksWriterClient";

export const dynamic = "force-dynamic";

export default async function HowItWorksWriterPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="container max-w-6xl py-10">
      <HowItWorksWriterClient />
    </div>
  );
}


