import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { getPool, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

// Allowed files that can be written to (for security)
const WRITABLE_FILES = ["changelog.json", "journey-statuses.json"];

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

    await ensureSchema();
    const pool = getPool();

    // First check if sandbox is public
    const sandboxCheck = await pool.query(`
      SELECT s.id, s.is_public, s.project_id
      FROM sandboxes s
      WHERE s.folder_name = $1
      LIMIT 1
    `, [folderName]);

    const sandboxRecord = sandboxCheck.rows[0] as { id: string; is_public: boolean; project_id: string } | undefined;
    const isPublic = sandboxRecord?.is_public === true;

    // If sandbox is public, allow access without authentication
    if (isPublic) {
      // Public sandbox - no auth required, skip to serving the file
    } else {
      // Private sandbox - require authentication
      const user = await getCurrentUser();
      if (!user) {
        return loginRedirect(request);
      }

      // Check if user has access
      let hasAccess = false;

      if (user.isAdmin) {
        // Admins can access any sandbox (registered or not)
        hasAccess = true;
      } else if (sandboxRecord) {
        // Check if sandbox is linked to a project the user has access to
        const accessCheck = await pool.query(`
          SELECT s.id 
          FROM sandboxes s
          JOIN projects p ON s.project_id = p.id
          WHERE s.id = $1
            AND (
              p.account_id = $2
              OR EXISTS (
                SELECT 1 FROM project_members pm 
                WHERE pm.project_id = p.id 
                  AND lower(pm.email) = lower($3)
              )
            )
          LIMIT 1
        `, [sandboxRecord.id, user.accountId, user.email]);

        hasAccess = (accessCheck.rowCount ?? 0) > 0;
      }

      if (!hasAccess) {
        // Redirect to profile with error message
        const profileUrl = new URL("/profile", request.url);
        profileUrl.searchParams.set("error", "sandbox_access_denied");
        return NextResponse.redirect(profileUrl);
      }
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
    let content = fs.readFileSync(normalizedPath);
    const mimeType = getMimeType(normalizedPath);

    // For CSS files, rewrite relative font URLs to absolute URLs
    if (mimeType === "text/css") {
      const cssContent = content.toString("utf-8");
      // Build the base URL for this CSS file
      const baseUrl = `/api/sandbox-files/${folderName}/${pathParts.slice(1, -1).join("/")}`;
      const fixedBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
      
      // Replace relative font URLs with absolute URLs
      const modifiedCss = cssContent.replace(
        /url\(['"]?([^'")\s]+\.(woff2?|ttf|otf|eot))['"]?\)/gi,
        (match, fontPath) => {
          // If already absolute, don't modify
          if (fontPath.startsWith("http") || fontPath.startsWith("/")) {
            return match;
          }
          // Convert relative to absolute
          const absolutePath = `${fixedBase}${fontPath}`;
          return `url('${absolutePath}')`;
        }
      );
      content = Buffer.from(modifiedCss, "utf-8");
    }

    // Set appropriate headers
    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      // Don't cache sandbox files to allow live updates during development
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      // Include Last-Modified so browsers know when the file actually changed
      "Last-Modified": stat.mtime.toUTCString(),
      // ETag based on mtime + size so the browser can validate freshness
      "ETag": `"${stat.mtimeMs.toString(36)}-${stat.size.toString(36)}"`,
    };

    // Add CORS headers for font files
    if (mimeType.startsWith("font/")) {
      headers["Access-Control-Allow-Origin"] = "*";
    }

    // Allow HTML files to be framed (for the viewer)
    if (mimeType === "text/html") {
      headers["X-Frame-Options"] = "SAMEORIGIN";

      // Check if this is an individual journey page (user-journey-*.html but NOT user-journeys.html)
      const journeyPageMatch = filePath.match(/^(user-journey-[^/]+\.html)$/);
      const isJourneyDetailPage = journeyPageMatch && filePath !== "user-journeys.html";

      if (isJourneyDetailPage) {
        // Server-side draft protection: block non-admin access to draft journeys
        const statusFilePath = path.join(sandboxesDir, folderName, "journey-statuses.json");
        let journeyStatus = "draft"; // Default to draft if no status file
        try {
          if (fs.existsSync(statusFilePath)) {
            const statusData = JSON.parse(fs.readFileSync(statusFilePath, "utf-8"));
            journeyStatus = statusData?.statuses?.[filePath] || "draft";
          }
        } catch {
          // If status file is unreadable, default to draft (safe fallback)
        }

        const user = await getCurrentUser();
        const isAdmin = user?.isAdmin || false;

        if (journeyStatus === "draft" && !isAdmin) {
          // Non-admin trying to access a draft journey — redirect to listing
          const listingUrl = new URL(
            `/api/sandbox-files/${folderName}/user-journeys.html`,
            request.url
          );
          return NextResponse.redirect(listingUrl);
        }
      }
      
      // Inject user admin status for admin-only controls
      const needsAdminInjection =
        filePath.includes("style-tiles.html") ||
        filePath.includes("colors.html") ||
        filePath.includes("fonts.html") ||
        filePath.includes("user-journey");

      if (needsAdminInjection) {
        const user = await getCurrentUser();
        const isAdmin = user?.isAdmin || false;
        const userInfoScript = `<script>window.__USER_IS_ADMIN__ = ${isAdmin};</script>`;
        const htmlContent = content.toString("utf-8");
        const modifiedHtml = htmlContent.replace("</head>", `${userInfoScript}\n  </head>`);
        content = Buffer.from(modifiedHtml, "utf-8");
      }
    }

    return new NextResponse(content, { headers });
  } catch (error) {
    console.error("Error serving sandbox file:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}

// PUT /api/sandbox-files/[folder]/[filename]
// Updates a writable sandbox file (e.g., changelog.json)
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathParts = params.path;
    
    if (!pathParts || pathParts.length < 2) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // First part is the sandbox folder name
    const folderName = pathParts[0];
    // Rest is the file path within the sandbox
    const filePath = pathParts.slice(1).join("/");
    const fileName = filePath.split("/").pop() || "";

    // Security: Only allow specific files to be written
    if (!WRITABLE_FILES.includes(fileName)) {
      return NextResponse.json(
        { error: "This file cannot be modified" },
        { status: 403 }
      );
    }

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const pool = getPool();

    // Check if user has write access (admin or project member with access)
    let hasAccess = false;

    if (user.isAdmin) {
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build the full file path
    const sandboxesDir = path.join(process.cwd(), "sandboxes-data");
    const fullPath = path.join(sandboxesDir, folderName, filePath);

    // Security: Ensure the path is within the sandboxes directory
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(sandboxesDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Get the request body
    const body = await request.json();

    // Validate JSON structure for changelog.json
    if (fileName === "changelog.json") {
      if (!body.entries || !Array.isArray(body.entries)) {
        return NextResponse.json(
          { error: "Invalid changelog format: entries array required" },
          { status: 400 }
        );
      }

      // Validate each entry
      for (const entry of body.entries) {
        if (!entry.version || !entry.date || !entry.title || !Array.isArray(entry.changes)) {
          return NextResponse.json(
            { error: "Invalid entry format: version, date, title, and changes required" },
            { status: 400 }
          );
        }
      }
    }

    // Write the file
    const content = JSON.stringify(body, null, 2);
    fs.writeFileSync(normalizedPath, content, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating sandbox file:", error);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}
