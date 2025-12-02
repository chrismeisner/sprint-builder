import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import GridSampleClient from "../GridSampleClient";

type GridSamplePageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const parseString = (value: string | string[] | undefined, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const parseMode = (value: string | string[] | undefined): "auto" | "manual" =>
  value === "manual" ? "manual" : "auto";

const parseNumber = (value: string | string[] | undefined, fallback: number) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default async function GridSamplePage({ searchParams }: GridSamplePageProps) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <GridSampleClient
      cardCount={parseNumber(searchParams.cardCount, 6)}
      mode={parseMode(searchParams.mode)}
      gapClass={parseString(searchParams.gapClass, "gap-6")}
      paddingClass={parseString(searchParams.paddingClass, "px-6 lg:px-8")}
      widthClass={parseString(searchParams.widthClass, "w-full max-w-4xl mx-auto")}
      autoTemplateClass={parseString(searchParams.autoTemplateClass, "grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]")}
      autoLabel={parseString(searchParams.autoLabel, "16rem (256px)")}
      manualSpanClass={parseString(searchParams.manualSpanClass, "col-span-12 md:col-span-6")}
      manualLabel={parseString(searchParams.manualLabel, "md:col-span-6")}
    />
  );
}


