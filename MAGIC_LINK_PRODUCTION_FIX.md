# Magic Link Production Fix

## Problem
Magic links sent via email in production were pointing to `localhost` instead of the production domain. This happened because the application was relying on request headers to determine the base URL, which can be unreliable in production environments with load balancers, proxies, or other infrastructure.

## Solution
Updated the URL generation logic to **prioritize the `BASE_URL` environment variable** over request headers. This ensures consistent, reliable URLs in production environments.

## Files Modified

### 1. `/app/api/auth/magic-link/route.ts`
**Changed:** Magic link URL generation now checks for `BASE_URL` environment variable first.

**Before:**
```typescript
const url = new URL(request.url);
const origin = `${url.protocol}//${url.host}`;
const magicLink = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}`;
```

**After:**
```typescript
// Use BASE_URL from env if set, otherwise fall back to request origin
let origin: string;
if (process.env.BASE_URL) {
  origin = process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
} else {
  const url = new URL(request.url);
  origin = `${url.protocol}//${url.host}`;
}

const magicLink = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}`;
```

### 2. `/app/api/documents/[id]/sprint/route.ts`
**Changed:** The `getBaseUrl()` helper function now prioritizes `BASE_URL` environment variable.

**Before:**
```typescript
function getBaseUrl(request: Request): string {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Fallback to environment variable or localhost
  return process.env.BASE_URL || "http://localhost:3000";
}
```

**After:**
```typescript
function getBaseUrl(request: Request): string {
  // Prioritize BASE_URL environment variable (most reliable in production)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
  }
  
  // Fallback to request headers (useful in development)
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // Final fallback
  return "http://localhost:3000";
}
```

## Required Configuration

### Production Environment
You **MUST** set the `BASE_URL` environment variable in your production environment:

```bash
BASE_URL=https://yourdomain.com
```

**Important:**
- Use your actual production domain
- Include the protocol (`https://`)
- Do NOT include a trailing slash
- Examples:
  - ✅ `https://sprint.example.com`
  - ✅ `https://www.example.com`
  - ❌ `https://example.com/` (no trailing slash)
  - ❌ `example.com` (must include protocol)

### Heroku Configuration
If deploying to Heroku, set the environment variable using:

```bash
heroku config:set BASE_URL=https://yourdomain.com -a your-app-name
```

### Vercel Configuration
If deploying to Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `BASE_URL` with your production domain value

### Other Platforms
Consult your platform's documentation for setting environment variables. The key name is `BASE_URL`.

## Local Development
For local development, you can:
- **Option 1:** Leave `BASE_URL` unset - it will auto-detect from request headers (works fine in development)
- **Option 2:** Set it explicitly in `.env.local`:
  ```bash
  BASE_URL=http://localhost:3000
  ```

## Testing
After deploying with `BASE_URL` set:

1. **Test Magic Link:**
   - Go to your production login page
   - Enter your email address
   - Check the email you receive
   - The magic link should point to your production domain (e.g., `https://yourdomain.com/api/auth/callback?token=...`)

2. **Test Sprint Notification:**
   - Submit a project intake form in production
   - Check the notification email
   - The sprint plan link should point to your production domain (e.g., `https://yourdomain.com/sprints/...`)

## What This Fixes

✅ Magic link emails now contain correct production URLs  
✅ Sprint notification emails now contain correct production URLs  
✅ All email-based links will use the production domain  
✅ More reliable behavior with load balancers and proxies  
✅ Explicit configuration makes deployment more predictable  

## Affected Features
- **Magic Link Authentication:** Login emails sent via `/api/auth/magic-link`
- **Sprint Draft Notifications:** Sprint plan emails sent when a project is processed
- Any future features that send emails with links to the application

## Why This Approach is Better

1. **Explicit over implicit:** Environment variable makes the configuration clear and intentional
2. **Production reliability:** Doesn't rely on headers that might be stripped or modified by infrastructure
3. **Debugging:** Easy to verify what domain is being used
4. **Security:** Prevents potential issues with header spoofing
5. **Flexibility:** Can easily change domains without code changes

## Backward Compatibility

The changes are **backward compatible**:
- If `BASE_URL` is not set, the system falls back to the previous behavior (using request headers)
- Local development continues to work without any configuration changes
- No database migrations or other breaking changes required

