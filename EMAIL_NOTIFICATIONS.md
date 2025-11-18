# Email Notification System

## Overview

The app automatically sends email notifications to users when their sprint drafts are created. This provides a seamless experience where clients submit a Typeform, receive a custom sprint plan via AI, and get notified via email with a direct link to view their plan.

## User Flow

```
1. User fills out Typeform survey
   ↓
2. Typeform webhook sends JSON to /api/documents
   ↓
3. Document stored in database
   ↓
4. Admin/System triggers sprint generation for document
   ↓
5. AI analyzes intake form + deliverables catalog
   ↓
6. Sprint draft created with selected deliverables
   ↓
7. ✉️ Email sent to user with sprint link
   ↓
8. User clicks link and views their custom sprint plan
```

## Technical Implementation

### Email Service (`lib/email.ts`)

**`sendEmail(params)`**
- Sends emails via Mailgun API
- Parameters: `to`, `subject`, `text`, `html`
- Returns: `{ success: boolean, messageId?: string, error?: string }`
- Gracefully handles missing Mailgun configuration (logs warning, doesn't fail)

**`generateSprintDraftEmail(params)`**
- Generates email content for sprint notifications
- Parameters: `sprintTitle`, `sprintUrl`, `recipientEmail`
- Returns: `{ subject, text, html }`
- Professional HTML email template with:
  - Sprint title prominently displayed
  - Call-to-action button to view sprint
  - List of what's included
  - Responsive design
  - Plain text fallback

### Sprint Creation (`app/api/documents/[id]/sprint/route.ts`)

After creating the sprint draft, the system:

1. **Extracts email** from Typeform document using `extractEmailFromDocument()`
   - Checks Typeform `form_response.answers[]` for email fields
   - Falls back to hidden fields and root-level email properties
   - Returns `null` if no email found (notification skipped)

2. **Generates sprint URL** using `getBaseUrl()`
   - Detects from request headers (`host`, `x-forwarded-proto`)
   - Falls back to `BASE_URL` environment variable
   - Defaults to `http://localhost:3000` in dev

3. **Sends notification email**
   - Calls `sendEmail()` with generated content
   - Logs success or failure
   - **Never fails sprint creation** - email errors are caught and logged

## Configuration

### Required Environment Variables

For email notifications to work, set these in `.env.local`:

```bash
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=no-reply@mg.yourdomain.com
```

### Optional Environment Variables

```bash
# Set in production for correct email links
BASE_URL=https://yourdomain.com
```

If `BASE_URL` is not set, the system auto-detects it from request headers.

### Mailgun Setup

1. Sign up at [mailgun.com](https://www.mailgun.com)
2. Verify your sending domain
3. Get your API key from the dashboard
4. Add environment variables to `.env.local`

**Free Tier**: Mailgun offers 5,000 free emails per month for the first 3 months.

## Email Template

### Email Subject
```
Your Sprint Plan is Ready: [Sprint Title]
```

### Email Content

**Plain Text Version:**
- Greeting
- Sprint title
- Direct link to sprint
- What's included (bullets)
- Call to action
- Professional signature

**HTML Version:**
- Clean, professional design
- Black and white color scheme (matches app)
- Prominent CTA button
- Feature list with checkmarks
- Responsive (mobile-friendly)
- Footer with additional info

### Preview

<img width="600" alt="Email preview" src="...">

*(Email includes direct link: `https://yourdomain.com/sprints/[sprint-id]`)*

## Error Handling

### Graceful Degradation

The system is designed to **never fail sprint creation** due to email issues:

✅ **Mailgun not configured** → Logs warning, continues
✅ **No email in Typeform** → Logs warning, continues
✅ **Mailgun API error** → Logs error, continues
✅ **Network timeout** → Logs error, continues

### Logging

All email operations are logged for debugging:

```javascript
// Success
console.log("[SprintAPI] Notification email sent", {
  sprintDraftId,
  to: userEmail,
  messageId: emailResult.messageId,
});

// No email found
console.warn("[SprintAPI] No email found in document, skipping notification", {
  documentId: params.id,
});

// Email failed
console.error("[SprintAPI] Error sending notification email", {
  sprintDraftId,
  error: emailError.message,
});
```

## Testing

### Test Email System

Visit `/dashboard/email-test` to:
- Check Mailgun configuration status
- Send test emails
- Verify credentials

### Test Sprint Notification

1. Create a test Typeform submission with your email
2. Generate a sprint draft
3. Check your inbox for the notification
4. Click the link to verify it works

### Manual Email Trigger (API)

You can manually send emails via API:

```bash
curl -X POST http://localhost:3000/api/admin/email-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email",
    "html": "<p>This is a <strong>test</strong> email</p>"
  }'
```

## Security

### Email Address Validation

- Basic validation: checks for `@` character
- Trims whitespace
- Sanitizes from Typeform data

### No Sensitive Data

- Email content does not include sensitive data
- Sprint link is public-facing (no auth required)
- Consider adding authentication to sprint pages in future

### Spam Prevention

- Emails only sent on sprint creation (not on every Typeform submission)
- Rate limited by Mailgun's built-in rate limits
- Uses verified sending domain

## Customization

### Customize Email Template

Edit `lib/email.ts` → `generateSprintDraftEmail()`:

```typescript
export function generateSprintDraftEmail(params: {
  sprintTitle: string;
  sprintUrl: string;
  recipientEmail: string;
}): { subject: string; text: string; html: string } {
  // Modify subject, text, and html here
}
```

### Add Company Branding

Update the HTML template with:
- Your logo
- Brand colors
- Custom footer
- Social media links

### Multi-Language Support

Add language detection and translations:

```typescript
const language = detectLanguage(params.recipientEmail);
const translations = getTranslations(language);
```

## Future Enhancements

1. **Email Templates in Database**
   - Store templates in `app_settings` table
   - Admin UI to edit templates
   - Version control for templates

2. **Email Status Tracking**
   - Store email events in database
   - Track opens, clicks, bounces
   - Use Mailgun webhooks

3. **Reminder Emails**
   - Send follow-up if client hasn't viewed sprint
   - Schedule reminders (3 days, 7 days)

4. **Sprint Updates**
   - Email when sprint status changes
   - Notify on deliverable completion
   - Weekly progress updates

5. **Email Preferences**
   - Allow users to unsubscribe
   - Preference center (choose which emails to receive)

6. **Email Analytics**
   - Track open rates, click rates
   - A/B test subject lines
   - Optimize send times

## Troubleshooting

### Emails Not Sending

**Check Mailgun Configuration:**
```bash
curl http://localhost:3000/api/admin/email-test
```

**Common Issues:**
- ❌ API key incorrect → Check Mailgun dashboard
- ❌ Domain not verified → Verify domain in Mailgun
- ❌ Sandbox mode → Add authorized recipients or verify domain
- ❌ Rate limit exceeded → Upgrade Mailgun plan

### Emails Going to Spam

**Solutions:**
- ✅ Verify sending domain with SPF/DKIM
- ✅ Use professional "From" address
- ✅ Avoid spam trigger words in subject
- ✅ Include unsubscribe link
- ✅ Maintain good sender reputation

### Wrong Sprint Link

**Check BASE_URL:**
```bash
echo $BASE_URL
```

Should be:
- Production: `https://yourdomain.com`
- Local: `http://localhost:3000` (or auto-detected)

### No Email Address in Typeform

**Solution:** Ensure Typeform includes an email field:
- Field type: "Email"
- Mark as required
- Or use hidden field: `email={{email}}`

## Support

For issues with:
- **Mailgun** → [Mailgun Support](https://help.mailgun.com/)
- **Email template** → Edit `lib/email.ts`
- **Sprint generation** → Check logs and `ai_responses` table

## Summary

✅ **Automatic** - No manual intervention needed
✅ **Professional** - Beautiful HTML emails
✅ **Reliable** - Never fails sprint creation
✅ **Configurable** - Easy to customize templates
✅ **Trackable** - Full logging for debugging

The email notification system completes the user journey, providing a seamless experience from Typeform submission to sprint plan delivery.

