import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { getPool, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

// Helper to create login redirect URL
function loginRedirect(request: NextRequest): NextResponse {
  const currentPath = request.nextUrl.pathname;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", currentPath);
  return NextResponse.redirect(loginUrl);
}

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// GET /api/sandbox-files/[folder]/[...rest]
// Serves sandbox files after checking authentication and project access
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathParts = params.path;
    
    if (!pathParts || pathParts.length === 0) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // First part is the sandbox folder name
    const folderName = pathParts[0];
    // Rest is the file path within the sandbox
    const filePath = pathParts.slice(1).join("/") || "index.html";

    // Check authentication - redirect to login if not authenticated
    const user = await getCurrentUser();
    if (!user) {
      return loginRedirect(request);
    }

    await ensureSchema();
    const pool = getPool();

    // Check if sandbox is registered and user has access
    let hasAccess = false;

    if (user.isAdmin) {
      // Admins can access any sandbox (registered or not)
      hasAccess = true;
    } else {
      // Check if sandbox is registered and linked to a project the user has access to
      const accessCheck = await pool.query(`
        SELECT s.id 
        FROM sandboxes s
        JOIN projects p ON s.project_id = p.id
        WHERE s.folder_name = $1
          AND (
            p.account_id = $2
            OR EXISTS (
              SELECT 1 FROM project_members pm 
              WHERE pm.project_id = p.id 
                AND lower(pm.email) = lower($3)
            )
          )
        LIMIT 1
      `, [folderName, user.accountId, user.email]);

      hasAccess = (accessCheck.rowCount ?? 0) > 0;
    }

    if (!hasAccess) {
      // Redirect to profile with error message
      const profileUrl = new URL("/profile", request.url);
      profileUrl.searchParams.set("error", "sandbox_access_denied");
      return NextResponse.redirect(profileUrl);
    }

    // Build the full file path
    const sandboxesDir = path.join(process.cwd(), "sandboxes-data");
    const fullPath = path.join(sandboxesDir, folderName, filePath);

    // Security: Ensure the path is within the sandboxes directory (prevent path traversal)
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(sandboxesDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if it's a file (not a directory)
    const stat = fs.statSync(normalizedPath);
    if (stat.isDirectory()) {
      // If directory, try to serve index.html
      const indexPath = path.join(normalizedPath, "index.html");
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath);
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/html",
            "X-Frame-Options": "SAMEORIGIN",
          },
        });
      }
      return NextResponse.json({ error: "Directory listing not allowed" }, { status: 403 });
    }

    // Read and serve the file
    const content = fs.readFileSync(normalizedPath);
    const mimeType = getMimeType(normalizedPath);

    // Set appropriate headers
    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600", // Cache for 1 hour, but only for authenticated users
    };

    // Allow HTML files to be framed (for the viewer)
    if (mimeType === "text/html") {
      headers["X-Frame-Options"] = "SAMEORIGIN";
    }

    return new NextResponse(content, { headers });
  } catch (error) {
    console.error("Error serving sandbox file:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
