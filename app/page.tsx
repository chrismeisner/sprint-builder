import Typography from "@/components/ui/Typography";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Typography as="h3" scale="h3" className="text-center">
        Have a nice day
      </Typography>
    </main>
  );
}
