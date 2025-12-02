import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SamplePreviewClient from "./SamplePreviewClient";

type SamplePageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const fallbackText = "Sample preview";

const toNumber = (value: string | string[] | undefined, fallback: number) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default async function FontSamplePage({ searchParams }: SamplePageProps) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  const text = typeof searchParams.text === "string" && searchParams.text.trim().length > 0 ? searchParams.text : fallbackText;
  const fontClass = typeof searchParams.fontClass === "string" ? searchParams.fontClass : "";
  const label = typeof searchParams.label === "string" ? searchParams.label : "Font sample";
  const fontSize = typeof searchParams.fontSize === "string" && searchParams.fontSize.trim().length > 0 ? searchParams.fontSize : "2.75rem";
  const lineHeight = toNumber(searchParams.lineHeight, 1.1);
  const letterSpacing = toNumber(searchParams.letterSpacing, 0);

  return (
    <SamplePreviewClient
      text={text}
      fontClass={fontClass}
      fontSize={fontSize}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      label={label}
    />
  );
}



