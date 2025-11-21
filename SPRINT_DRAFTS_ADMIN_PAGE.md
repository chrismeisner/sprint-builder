# Sprint Drafts Admin Page

## Overview

New admin-only page to manage and monitor all sprint drafts in the system. Provides comprehensive visibility into sprint creation sources, status, and ownership.

## Access

**URL**: `/dashboard/sprint-drafts`

**Requirements**: Admin authentication (`is_admin = true`)

**Navigation**: Added to admin section of Dashboard page

## Features

### 1. Comprehensive Sprint List
Shows all sprint drafts with key information:
- Sprint title and ID
- Owner (name + email)
- Source (Package vs Typeform)
- Status
- Deliverables count
- Pricing information
- Workshop status
- Created/updated dates

### 2. Source Tracking

**Package Template** (`source: "package"`)
- Sprint was created from a pre-defined sprint package
- Shows which package was used
- Badge: 📦 Package Name

**Typeform Submission** (`source: "typeform"`)
- Sprint was created from client intake form
- Custom AI-generated based on form responses
- Badge: 📝 Typeform

### 3. Status Dashboard

7 status cards showing sprint distribution:
- **Total Sprints** - All sprints in system
- **Draft** - Initial state, user can edit
- **Studio Review** - Studio is reviewing/adjusting
- **Pending Client** - Workshop generated, awaiting client confirmation
- **In Progress** - Active sprint execution
- **Completed** - Sprint finished
- **Pkg/Form** - Split between sources

### 4. Advanced Filtering

**Search**
- By sprint title
- By email address
- By account name
- By sprint ID

**Status Filter**
- All Statuses
- Draft
- Studio Review
- Pending Client
- In Progress
- Completed
- Cancelled

**Source Filter**
- All Sources
- Package Template
- Typeform Submission

### 5. Data Columns

| Column | Description |
|--------|-------------|
| Sprint | Title + ID (monospace) |
| Owner | Account name + Email |
| Source | Badge showing origin |
| Status | Color-coded status badge |
| Deliverables | Count + total points |
| Price | Dollar amount + hours |
| Workshop | ✓ if generated, — if not |
| Created | Date + time |
| Actions | "View" button → sprint page |

### 6. Status Color Coding

- **Draft**: Gray
- **Studio Review**: Blue
- **Pending Client**: Yellow
- **In Progress**: Green
- **Completed**: Purple
- **Cancelled**: Red

## Technical Implementation

### Database Query
```sql
SELECT 
  sd.id,
  sd.status,
  sd.title,
  sd.deliverable_count,
  sd.total_fixed_price,
  sd.total_fixed_hours,
  sd.total_estimate_points,
  sd.sprint_package_id,
  sd.workshop_generated_at,
  sd.created_at,
  sd.updated_at,
  d.email,
  a.name as account_name,
  a.id as account_id,
  sp.name as package_name
FROM sprint_drafts sd
LEFT JOIN documents d ON sd.document_id = d.id
LEFT JOIN accounts a ON d.account_id = a.id
LEFT JOIN sprint_packages sp ON sd.sprint_package_id = sp.id
ORDER BY sd.created_at DESC
```

### Source Determination
```typescript
source: row.sprint_package_id ? "package" : "typeform"
```

If `sprint_package_id` is set → Package Template
If `sprint_package_id` is NULL → Typeform Submission

### Files Created

| File | Purpose |
|------|---------|
| `app/dashboard/sprint-drafts/page.tsx` | Server component, fetches data |
| `app/dashboard/sprint-drafts/SprintDraftsClient.tsx` | Client component, filtering & UI |
| `app/dashboard/page.tsx` | Updated with navigation link |

## Use Cases

### 1. Monitor Sprint Pipeline
Admin can see:
- How many sprints are in each stage
- Which sprints need studio attention
- Which clients are waiting for workshop generation

### 2. Track Sprint Sources
See which acquisition channel is performing:
- How many sprints from packages vs custom forms
- Which packages are most popular
- Conversion rates by source

### 3. Client Management
Quickly find:
- All sprints for a specific client (search by email)
- Abandoned drafts (old drafts not progressing)
- High-value sprints (filter by price)

### 4. Quality Control
Identify issues:
- Sprints stuck in draft (needs follow-up)
- Sprints without workshops (needs generation)
- Pricing anomalies (extremely high/low)

### 5. Reporting & Analytics
Export data for:
- Monthly sprint creation rates
- Average sprint value by source
- Completion rates by package type
- Client retention metrics

## Future Enhancements

### Phase 2
- [ ] Bulk actions (delete, change status, assign owner)
- [ ] Export to CSV
- [ ] Date range filtering
- [ ] Sort by any column
- [ ] Pagination (for 100+ sprints)

### Phase 3
- [ ] Analytics dashboard with charts
- [ ] Email notifications for status changes
- [ ] Inline editing (change status without leaving page)
- [ ] Notes/comments per sprint
- [ ] Sprint templates (save draft as template)

## Access Control

**Public**: ❌ Not accessible
**Logged in user**: ❌ Not accessible
**Admin user**: ✅ Full access

Redirect to home page if not admin:
```typescript
if (!user?.isAdmin) {
  redirect("/");
}
```

## Navigation

Admin users will see these links on Dashboard page:
- Sprint Drafts (Admin)
- User Management
- Workshop Cleanup (Admin)

Non-admin users will NOT see these links.

## Example Views

### High-Level Overview
```
Total: 47 sprints
Draft: 12 | Studio Review: 8 | Pending Client: 5
In Progress: 15 | Completed: 7
Packages: 32 | Typeform: 15
```

### Individual Sprint Row
```
MVP Launch Sprint                     John Doe                📦 MVP Launch Sprint    
sprint-2b404b1...                     john@example.com        
                                                               Draft    3 delivs    $6,900    ✓    11/21/2025    [View]
                                                                        25 pts      47h              9:16 AM
```

## Benefits

### For Studio Admin
- ✅ Single view of all sprint activity
- ✅ Quickly identify bottlenecks
- ✅ Monitor revenue pipeline
- ✅ Track client engagement

### For Operations
- ✅ Source attribution for marketing
- ✅ Package performance metrics
- ✅ Client lifecycle tracking
- ✅ Capacity planning data

### For Client Success
- ✅ Find client sprints instantly
- ✅ Check sprint progress
- ✅ Identify at-risk clients
- ✅ Proactive follow-up

## Testing

1. **Access as non-admin**
   - Visit `/dashboard/sprint-drafts`
   - Should redirect to home

2. **Access as admin**
   - Login as admin user
   - Visit `/dashboard`
   - See "Sprint Drafts (Admin)" link
   - Click link → see sprint drafts table

3. **Test filtering**
   - Search for client email
   - Filter by status
   - Filter by source
   - Combine filters

4. **Test actions**
   - Click "View" on a sprint
   - Should navigate to sprint detail page
   - Data should match table

## Performance

**Current**: Loads all sprints at once (fine for <1000 sprints)

**Future**: Add pagination for larger datasets
- 50 sprints per page
- Server-side filtering
- Indexed queries

## Security

- ✅ Admin-only access enforced server-side
- ✅ No sensitive data exposed to non-admins
- ✅ Read-only view (no destructive actions yet)
- ✅ Links to sprint details respect ownership

---

**Status**: ✅ Complete and ready to use
**Deployment**: Restart server, log in as admin, visit `/dashboard/sprint-drafts`

