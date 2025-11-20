# Automatic Sprint Creation

## Overview

Sprint drafts are now created **automatically** when a Typeform webhook is received. This eliminates the need for manually clicking the "Create Sprint" button on the `/documents` page.

## How It Works

### 1. Typeform Webhook Received

When a user submits the Typeform intake form, Typeform sends a webhook to:

```
POST /api/documents
```

### 2. Document Stored

The webhook handler:
- Verifies the Typeform signature (if configured)
- Extracts the email from the form submission
- Creates/updates an account record
- Stores the form submission as a document in the database
- Sends a confirmation email to the submitter

### 3. Sprint Auto-Creation Triggered

**NEW**: After successfully storing the document, the system automatically triggers sprint creation:

```typescript
// Automatically create sprint draft (non-blocking)
createSprintForDocument(id, "gpt-4o-mini").catch((error) => {
  console.error("[Documents] Failed to auto-create sprint draft:", error);
  // Don't throw - we don't want sprint creation failures to break document submission
});
```

### 4. Sprint Draft Generated

The sprint creation process:
1. Loads the document content
2. Fetches active deliverables and sprint packages from the catalog
3. Sends the intake data to OpenAI with the system/user prompts
4. Parses the AI response and validates deliverable/package IDs
5. Stores the sprint draft in the database
6. Links deliverables to the sprint
7. Calculates totals (points, hours, budget)
8. **Automatically sends an email to the user** with a link to view their sprint draft

### 5. User Receives Email

The user receives an email with:
- Subject: "Your Sprint Draft is Ready"
- A link to view their personalized sprint proposal at `/sprints/{id}`

## Technical Implementation

### New Shared Function

Created `/lib/sprint-creation.ts` with the core sprint creation logic:

```typescript
export async function createSprintForDocument(
  documentId: string,
  model: string = "gpt-4o-mini"
): Promise<CreateSprintResult>
```

This function contains all the logic previously in `/api/documents/[id]/sprint/route.ts`, making it reusable for both:
- **Automatic creation** (webhook-triggered)
- **Manual creation** (button-triggered)

### Modified Files

1. **`/lib/sprint-creation.ts`** (NEW)
   - Extracted sprint creation logic into a shared function
   - Handles document loading, AI processing, database storage, and email notification

2. **`/app/api/documents/route.ts`** (MODIFIED)
   - Added import for `createSprintForDocument`
   - Calls the function automatically after storing each webhook submission
   - Non-blocking: doesn't fail the webhook if sprint creation fails

3. **`/app/api/documents/[id]/sprint/route.ts`** (SIMPLIFIED)
   - Now just a thin wrapper around the shared function
   - Extracts the model from request body
   - Calls `createSprintForDocument` and returns the result
   - Eliminates code duplication

## Benefits

### For Users
- **Instant gratification**: Sprint draft ready immediately after form submission
- **No manual steps**: Eliminates the need to click "Create Sprint"
- **Email notification**: User is automatically notified when draft is ready

### For Admins
- **Automation**: No manual intervention required
- **Consistency**: Every submission automatically gets a sprint draft
- **Reliability**: Non-blocking implementation ensures webhook always succeeds

### For Developers
- **DRY principle**: Single source of truth for sprint creation logic
- **Maintainability**: Changes to sprint logic only need to happen in one place
- **Testability**: Shared function is easier to test

## Flow Diagram

```
User submits Typeform
        ↓
Typeform webhook → POST /api/documents
        ↓
Document stored in DB
        ↓
createSprintForDocument() called (async)
        ↓
        ├─→ Load document
        ├─→ Fetch deliverables & packages
        ├─→ Call OpenAI API
        ├─→ Parse & validate response
        ├─→ Store sprint draft
        ├─→ Link deliverables
        ├─→ Calculate totals
        └─→ Send email notification
        ↓
User receives email with sprint link
```

## Configuration

### Required Environment Variables

- `OPENAI_API_KEY` - Required for AI sprint generation
- `MAILGUN_API_KEY` - Required for email notifications
- `MAILGUN_DOMAIN` - Required for email sending
- `BASE_URL` - Used for generating sprint links in emails

### Optional Environment Variables

- `TYPEFORM_WEBHOOK_SECRET` - Recommended for webhook verification
- `OPENAI_PROJECT_ID` - Optional OpenAI project header
- `OPENAI_ORG_ID` - Optional OpenAI organization header

## Monitoring

Look for these log messages to track the automatic sprint creation:

```
[Documents] Triggering automatic sprint creation
[AutoSprint] Start
[AutoSprint] Loaded document
[AutoSprint] Using model
[AutoSprint] Sending OpenAI request
[AutoSprint] OpenAI response
[AutoSprint] Stored AI response
[AutoSprint] Stored sprint draft
[AutoSprint] Email notification queued
[AutoSprint] Complete
```

## Error Handling

- Sprint creation failures **do not** block the webhook response
- Errors are logged but don't affect document storage
- Email failures don't prevent sprint draft creation
- The system is resilient and degrades gracefully

## Backwards Compatibility

The manual "Create Sprint" button still works:
- Users can still manually trigger sprint creation if needed
- Useful for regenerating drafts with different AI models
- The button now uses the same shared function, ensuring consistency

## Testing

To test the automatic sprint creation:

1. Submit a Typeform with a valid email address
2. Check the server logs for `[AutoSprint]` messages
3. Verify the sprint draft appears in the database
4. Check that the user received an email notification
5. Visit the sprint URL to view the generated draft

## Future Enhancements

Potential improvements:
- Add retry logic for failed sprint creations
- Queue sprint creation for better performance
- Support multiple AI models per submission
- Add admin dashboard to monitor automatic creations
- Implement rate limiting for AI API calls

