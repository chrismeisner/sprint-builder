# Complete System Flow - Form Intake to Sprint Delivery

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR APP FLOW                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Typeform   │  User fills out intake survey
│    Survey    │  (project details, budget, goals)
└──────┬───────┘
       │ webhook
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  POST /api/documents                                             │
│  • Verifies webhook signature (optional)                         │
│  • Extracts email from JSON                                      │
│  • Stores complete Typeform JSON                                 │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  documents TABLE                                                  │
│  {                                                                │
│    id: "doc-123"                                                  │
│    filename: "intake-2024-11-18"                                  │
│    email: "user@example.com"                                      │
│    content: { /* Full Typeform JSON */ }                         │
│  }                                                                │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓ admin triggers
┌──────────────────────────────────────────────────────────────────┐
│  POST /api/documents/[id]/sprint                                 │
│  • Loads document from DB                                        │
│  • Loads deliverables catalog                                    │
│  • Loads AI prompts (system + user)                              │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  OpenAI GPT-4o / GPT-4o-mini                                     │
│                                                                   │
│  INPUT:                                                           │
│  • System Prompt (role definition)                               │
│  • User Prompt (JSON structure guidance)                         │
│  • Deliverables Catalog (50 active items)                        │
│  • Client Intake JSON (Typeform data)                            │
│                                                                   │
│  AI ANALYZES:                                                     │
│  • Client goals & constraints                                    │
│  • Budget & timeline                                             │
│  • Project complexity                                            │
│                                                                   │
│  AI SELECTS:                                                      │
│  • 1-3 deliverables from catalog                                 │
│  • Creates 2-week sprint plan                                    │
│  • Generates backlog (5-12 items)                                │
│  • Plans day-by-day timeline                                     │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓ returns JSON
┌──────────────────────────────────────────────────────────────────┐
│  AI RESPONSE                                                      │
│  {                                                                │
│    sprintTitle: "MVP Mobile App Sprint",                         │
│    deliverables: [                                               │
│      {                                                            │
│        deliverableId: "proto-level2-001",                        │
│        name: "Prototype - Level 2",                              │
│        reason: "Client needs interactive demo"                   │
│      }                                                            │
│    ],                                                             │
│    goals: [...],                                                 │
│    backlog: [...],                                               │
│    timeline: [...]                                               │
│  }                                                                │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓ process & calculate
┌──────────────────────────────────────────────────────────────────┐
│  DATABASE PROCESSING                                             │
│                                                                   │
│  1. Store AI Response                                            │
│     → ai_responses table                                         │
│                                                                   │
│  2. Create Sprint Draft                                          │
│     → sprint_drafts table                                        │
│     {                                                             │
│       id: "sprint-456",                                          │
│       document_id: "doc-123",                                    │
│       draft: { /* full JSON */ },                                │
│       status: "draft",                                           │
│       title: "MVP Mobile App Sprint"                             │
│     }                                                             │
│                                                                   │
│  3. Link Deliverables                                            │
│     For each deliverable in AI response:                         │
│     → Lookup in deliverables table                               │
│     → Get fixed_hours, fixed_price, points                       │
│     → Create sprint_deliverables record                          │
│     → Accumulate totals                                          │
│                                                                   │
│  4. Update Sprint Totals                                         │
│     → total_estimate_points: 13                                  │
│     → total_fixed_hours: 40                                      │
│     → total_fixed_price: 6000                                    │
│     → deliverable_count: 1                                       │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓ sprint created
┌──────────────────────────────────────────────────────────────────┐
│  ✉️  EMAIL NOTIFICATION                                          │
│                                                                   │
│  1. Extract Email                                                │
│     → extractEmailFromDocument(content)                          │
│     → Checks form_response.answers[]                             │
│     → Returns: "user@example.com"                                │
│                                                                   │
│  2. Generate Sprint URL                                          │
│     → getBaseUrl(request)                                        │
│     → Returns: "https://yourdomain.com"                          │
│     → Sprint URL: "/sprints/sprint-456"                          │
│                                                                   │
│  3. Generate Email Content                                       │
│     → generateSprintDraftEmail()                                 │
│     → Subject: "Your Sprint Plan is Ready: ..."                  │
│     → HTML: Beautiful responsive email                           │
│     → Text: Plain text fallback                                  │
│                                                                   │
│  4. Send via Mailgun                                             │
│     → POST to Mailgun API                                        │
│     → Returns: { success: true, messageId: "..." }               │
│     → Logs success/failure                                       │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  📧 USER INBOX                                                   │
│                                                                   │
│  From: no-reply@yourdomain.com                                   │
│  To: user@example.com                                            │
│  Subject: Your Sprint Plan is Ready: MVP Mobile App Sprint       │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │  🎉 Your Sprint Plan is Ready!                     │         │
│  │                                                     │         │
│  │  Hi there,                                         │         │
│  │                                                     │         │
│  │  Great news - we've analyzed your project          │         │
│  │  requirements and created a custom 2-week          │         │
│  │  sprint plan tailored to your needs.               │         │
│  │                                                     │         │
│  │  ┌─────────────────────────────────────────┐      │         │
│  │  │  MVP Mobile App Sprint                   │      │         │
│  │  └─────────────────────────────────────────┘      │         │
│  │                                                     │         │
│  │  ┌─────────────────────────────────────────┐      │         │
│  │  │  View Your Sprint Plan →                 │      │         │
│  │  └─────────────────────────────────────────┘      │         │
│  │                                                     │         │
│  │  What's included:                                  │         │
│  │  ✓ Selected deliverables with fixed pricing       │         │
│  │  ✓ Detailed backlog with story points              │         │
│  │  ✓ Day-by-day timeline for 2 weeks                 │         │
│  │  ✓ Clear goals and acceptance criteria             │         │
│  └────────────────────────────────────────────────────┘         │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ↓ clicks link
┌──────────────────────────────────────────────────────────────────┐
│  /sprints/[id] PAGE                                              │
│                                                                   │
│  Displays:                                                        │
│  • Sprint title & status badge                                   │
│  • Sprint Totals Card:                                           │
│    - Total Points: 13                                            │
│    - Fixed Hours: 40h                                            │
│    - Fixed Price: $6,000                                         │
│  • Selected Deliverables:                                        │
│    - Name, scope, reason for selection                           │
│  • Sprint Goals (2-4 measurable goals)                           │
│  • Backlog Items:                                                │
│    - ID, title, description, points                              │
│    - Owner, acceptance criteria                                  │
│  • Day-by-Day Timeline:                                          │
│    - 10 working days                                             │
│    - Daily focus & specific tasks                                │
│  • Assumptions & Risks                                           │
│  • Notes & Recommendations                                       │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Summary

```
Typeform JSON
    ↓
documents TABLE (stored)
    ↓
OpenAI API (analyzed)
    ↓
AI Response JSON
    ↓
sprint_drafts TABLE (created)
    ↓
sprint_deliverables TABLE (linked)
    ↓
Totals Calculated (hours, price, points)
    ↓
Email Sent (Mailgun)
    ↓
User Views Sprint (browser)
```

## Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Forms** | Typeform | User intake surveys |
| **Backend** | Next.js API Routes | API endpoints |
| **Database** | PostgreSQL | Data storage |
| **AI** | OpenAI GPT-4o | Sprint generation |
| **Email** | Mailgun | Notifications |
| **Storage** | Google Cloud Storage | Image uploads |
| **Auth** | Custom (session-based) | Admin access |

## Environment Variables

```bash
# Required
DATABASE_URL=postgres://...
OPENAI_API_KEY=sk-...
SESSION_SECRET=random-32-chars

# Optional - Email
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=no-reply@mg.yourdomain.com
BASE_URL=https://yourdomain.com

# Optional - Other
TYPEFORM_WEBHOOK_SECRET=...
GCS_PROJECT_ID=...
GCS_BUCKET_NAME=...
GCS_CREDENTIALS_JSON=...
```

## API Endpoints

```
POST   /api/documents              → Receive Typeform webhook
GET    /api/documents              → List all documents
POST   /api/documents/[id]/sprint  → Generate sprint draft
GET    /api/deliverables           → List deliverables catalog
POST   /api/deliverables           → Create deliverable
PATCH  /api/deliverables/[id]      → Update deliverable
POST   /api/admin/email-test       → Test email sending
```

## Database Schema (Key Tables)

```sql
documents
├── id (uuid)
├── filename (text)
├── email (text)
├── content (jsonb) -- Full Typeform JSON
└── created_at (timestamp)

deliverables
├── id (uuid)
├── name (text)
├── description (text)
├── scope (text)
├── category (text)
├── default_estimate_points (int)
├── fixed_hours (int)
├── fixed_price (int)
└── active (boolean)

sprint_drafts
├── id (uuid)
├── document_id (uuid) → documents.id
├── ai_response_id (uuid) → ai_responses.id
├── draft (jsonb) -- Full sprint JSON
├── status (text) -- 'draft', 'in_progress', 'completed'
├── title (text)
├── total_estimate_points (int)
├── total_fixed_hours (int)
├── total_fixed_price (int)
└── deliverable_count (int)

sprint_deliverables (junction table)
├── id (uuid)
├── sprint_draft_id (uuid) → sprint_drafts.id
├── deliverable_id (uuid) → deliverables.id
├── quantity (int)
├── custom_estimate_points (int, nullable)
├── custom_hours (int, nullable)
└── custom_price (int, nullable)
```

## User Experience Timeline

```
T+0min:  User fills out Typeform (5-10 minutes)
         ↓
T+0min:  Webhook received, document stored instantly
         ↓
T+1min:  Admin triggers sprint generation
         ↓
T+2min:  AI analyzes and generates sprint (30-60 seconds)
         ↓
T+2min:  Sprint draft created in database
         ↓
T+2min:  Email sent to user (<5 seconds)
         ↓
T+3min:  User receives email notification
         ↓
T+3min:  User clicks link, views sprint plan
         ↓
T+5min:  User reviews deliverables, timeline, pricing
         ↓
Future:  Admin discusses plan with user, makes adjustments
```

## Success Criteria

✅ **User submits Typeform** → Document stored
✅ **Admin generates sprint** → AI analyzes intake
✅ **AI selects deliverables** → 1-3 from catalog
✅ **Sprint plan created** → Complete JSON structure
✅ **Totals calculated** → From deliverables catalog
✅ **Email sent** → Professional notification
✅ **User receives link** → Direct to sprint page
✅ **User views plan** → Complete sprint details

## What Makes This Special

🎯 **Productized Services**
- Fixed-price deliverables (not estimates)
- Clear scope for each deliverable
- Tiered complexity levels

🤖 **AI-Powered**
- Intelligent deliverable selection
- Realistic 2-week sprint planning
- Context-aware recommendations

💰 **Transparent Pricing**
- Totals calculated from catalog
- No estimation guesswork
- Client knows exact cost upfront

📧 **Automated Delivery**
- Email notifications
- Direct links to plans
- Professional communication

🔄 **Complete Flow**
- Typeform → AI → Email → View
- Seamless user experience
- No manual steps required

