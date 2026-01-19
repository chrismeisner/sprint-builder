import { getCurrentUser } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import RandomImageDisplay from "./RandomImageDisplay";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  // Get all images from the scraps folder
  const scrapsDir = path.join(process.cwd(), "public", "scraps");
  const files = await fs.readdir(scrapsDir);
  
  // Filter for image files
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
  });

  return (
    <main className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 4rem - 120px)' }}>
      <div className="flex flex-col items-center gap-3 text-center">
        <RandomImageDisplay images={imageFiles} />
      </div>
    </main>
  );
}
