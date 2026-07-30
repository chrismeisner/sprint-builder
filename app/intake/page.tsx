import type { Metadata } from "next";
import IntakeClient from "./IntakeClient";
import { typography } from "../components/typography";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get Started — Chris Meisner",
  description:
    "Tell me about your project and what you need help with. I'll get back to you within 24 hours.",
};

export default function IntakePage() {
  return (
    <main className="container max-w-2xl py-16">
      <div className="mb-4">
        <h1 className={`${typography.headingSection} text-balance`}>
          New Client Intake
        </h1>
      </div>
      <IntakeClient />
    </main>
  );
}
