# Authentication & Sprint Access Flow Verification

## Data Model Associations

### Tables and Relationships

```
accounts
  ├── id (PK)
  ├── email (UNIQUE)
  └── created_at

documents
  ├── id (PK)
  ├── content (jsonb)
  ├── email
  ├── account_id (FK -> accounts.id)  ✓ Properly linked
  └── created_at

sprint_drafts
  ├── id (PK)
  ├── document_id (FK -> documents.id)  ✓ Properly linked
  ├── ai_response_id (FK -> ai_responses.id)
  ├── draft (jsonb)
  └── created_at
```

## Authentication Flow

### 1. Account Creation (Automatic)
**Trigger**: Typeform webhook submission

**Process**:
- Typeform submits webhook to `/api/documents` (POST)
- Email is extracted from payload
- Account is created or retrieved:
  ```sql
  INSERT INTO accounts (id, email)
  VALUES (uuid, email)
  ON CONFLICT (email)
  DO UPDATE SET email = EXCLUDED.email
  RETURNING id
  ```
- Document is created with `account_id` and `email`

**Status**: ✓ Verified in `/app/api/documents/route.ts` (lines 102-114)

### 2. Magic Link Request
**Endpoint**: `/api/auth/magic-link` (POST)

**Process**:
1. User enters email on `/login` page
2. Account is created/found by email (same upsert logic)
3. Login token is generated (15-minute expiry)
4. Magic link is sent via Mailgun (or logged in dev mode)

**Status**: ✓ Verified in `/app/api/auth/magic-link/route.ts`

### 3. Magic Link Login
**Endpoint**: `/api/auth/callback` (GET)

**Process**:
1. User clicks magic link with `?token=...`
2. Token is verified (checks signature and expiry)
3. Session token is created (7-day expiry)
4. Session cookie is set (`sb_session`, httpOnly, secure)
5. User is redirected to `/my-sprints`

**Status**: ✓ Verified in `/app/api/auth/callback/route.ts`

### 4. Logout
**Endpoint**: `/api/auth/logout` (POST)

**Process**:
1. User clicks logout in UserMenu dropdown
2. Session cookie is cleared (maxAge: 0)
3. User is redirected to home page

**Status**: ✓ Implemented in `/app/api/auth/logout/route.ts`

## Sprint Access Control

### Public Access
- Sprint detail pages (`/sprints/[id]`) are publicly accessible
- Anyone with the link can view a sprint (useful for sharing)
- Ownership indicator shows if logged-in user owns the sprint

**Status**: ✓ Verified - sprints are shareable

### User-Filtered Access
- `/my-sprints` page shows only user's sprints
- Query filters by `account_id`:
  ```sql
  SELECT sd.*, d.email
  FROM sprint_drafts sd
  JOIN documents d ON sd.document_id = d.id
  WHERE d.account_id = $1
  ORDER BY sd.created_at DESC
  ```

**Status**: ✓ Verified in `/app/my-sprints/page.tsx`

## Email-Sprint Association

### Document → Sprint Chain
1. **Typeform Submission**
   - Email extracted from form
   - Account created/found by email
   - Document created with `account_id` and `email`

2. **Sprint Creation**
   - Sprint draft created from document
   - `document_id` links sprint to document
   - Email accessible via JOIN on documents table

3. **Sprint Viewing**
   - Sprint detail page JOINs with documents
   - Email displayed in sprint metadata
   - Ownership checked via `account_id`

**Status**: ✓ All associations verified and working

## UI Components

### Header Component (`/app/Header.tsx`)
- Server component (async)
- Fetches current user via `getCurrentUser()`
- Shows different UI based on auth state:
  - **Logged in**: UserMenu with email + Logout
  - **Logged out**: "Log in" button

**Status**: ✓ Dynamic header implemented

### Login Page (`/app/login/page.tsx`)
- Modern, centered design
- Magic link request form
- Loading states and feedback
- Instructions about passwordless auth
- Link to submit intake form

**Status**: ✓ Enhanced UX completed

### UserMenu Component (`/app/UserMenu.tsx`)
- Client component with dropdown
- Shows user email
- Logout functionality
- Click-outside to close

**Status**: ✓ Fully functional

## Security Features

1. **HMAC Token Signing**
   - Login and session tokens are HMAC-signed
   - Prevents tampering
   - Timing-safe comparison

2. **Token Expiry**
   - Login tokens: 15 minutes
   - Session tokens: 7 days
   - Checked on every verification

3. **HTTP-Only Cookies**
   - Session stored in httpOnly cookie
   - Not accessible to JavaScript
   - XSS protection

4. **Secure Flag in Production**
   - Cookies marked secure in production
   - HTTPS-only transmission

5. **Email Normalization**
   - Emails trimmed and lowercased
   - Consistent lookups

**Status**: ✓ All security measures in place

## Testing Checklist

- [x] Email extraction from Typeform webhook
- [x] Account creation/retrieval by email
- [x] Document-account association
- [x] Magic link generation
- [x] Magic link verification
- [x] Session cookie creation
- [x] Session verification in protected routes
- [x] Sprint-document-account chain
- [x] Email display in sprint details
- [x] Ownership indicator
- [x] Logout functionality
- [x] Header dynamic state
- [x] Login page UX

## Environment Variables Required

```bash
SESSION_SECRET=your-random-secret-string-at-least-32-chars
MAILGUN_API_KEY=your-mailgun-api-key (optional, logs to console in dev)
MAILGUN_DOMAIN=mg.yourdomain.com (optional)
MAILGUN_FROM_EMAIL=no-reply@mg.yourdomain.com (optional)
```

## Conclusion

✅ **All authentication flows are properly implemented and connected**
✅ **Email-Sprint associations are correctly established**
✅ **Security measures are in place**
✅ **UI provides clear feedback and modern UX**

The system is ready for production use with proper Mailgun configuration.

