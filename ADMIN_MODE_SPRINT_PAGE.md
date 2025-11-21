# Admin Mode for Sprint Draft Pages

## Overview

Sprint draft detail pages now have an "Admin Mode" that displays additional controls and information when viewed by an admin user. This provides studio admins with enhanced visibility and management capabilities without cluttering the client view.

## Features

### 1. **Admin Mode Banner**

**Sticky header** that appears at the top of sprint pages when logged in as admin:

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 Admin Mode | Viewing as administrator • Extended...      │
│                                          [Change Status: ▼]  │
└─────────────────────────────────────────────────────────────┘
```

**Design:**
- Gradient background (purple → blue)
- White text with icon
- Sticky positioning (stays visible while scrolling)
- Full-width with negative margins to extend to page edges
- Shadow for depth

**Information shown:**
- Admin Mode badge (👤)
- "Viewing as administrator" message
- Current sprint status
- Status change dropdown

### 2. **Status Changer Dropdown**

Admin-only control to change sprint status directly from the page:

**Features:**
- Dropdown with all 6 statuses
- Confirmation dialog before changing
- Success/error feedback
- Auto-reload page after change
- Loading spinner during update

**Statuses available:**
- Draft
- Studio Review
- Pending Client
- In Progress
- Completed
- Cancelled

**Workflow:**
1. Admin selects new status from dropdown
2. Confirmation dialog: "Change sprint status from 'X' to 'Y'?"
3. POST request to API endpoint
4. Success message shown
5. Page reloads to reflect changes

### 3. **Visual Differentiation**

**Non-admin view:**
- Clean client-facing interface
- No admin banner
- Standard sprint information

**Admin view:**
- Purple/blue banner at top
- Status change controls
- Same sprint information (extended functionality coming)

## Technical Implementation

### Files Created

| File | Purpose |
|------|---------|
| `app/sprints/[id]/AdminStatusChanger.tsx` | Client component for status dropdown |
| `app/api/admin/sprint-drafts/[id]/status/route.ts` | API endpoint to update status |

### Files Modified

| File | Changes |
|------|---------|
| `app/sprints/[id]/page.tsx` | Added admin mode banner & status changer |

### Admin Detection

```typescript
const isAdmin = currentUser?.isAdmin === true;
```

Banner only renders if `isAdmin` is true.

### API Endpoint

**PATCH** `/api/admin/sprint-drafts/[id]/status`

**Request:**
```json
{
  "status": "studio_review"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated from 'draft' to 'studio_review'",
  "sprint": {
    "id": "sprint-...",
    "status": "studio_review",
    "updatedAt": "2025-11-21T..."
  }
}
```

**Validation:**
- Requires admin authentication
- Validates status is one of 6 valid values
- Updates `updated_at` timestamp
- Returns error if sprint not found

### Status Flow

```
draft
  ↓ (client reviews)
studio_review
  ↓ (studio adjusts & creates workshop)
pending_client
  ↓ (client confirms)
in_progress
  ↓ (work happens)
completed / cancelled
```

## Use Cases

### 1. Quick Status Updates
Admin can change sprint status without:
- Opening database
- Using admin dashboard
- Complex forms
- Just a dropdown on the sprint page

### 2. Client Review
While reviewing a sprint with a client, admin can:
- View sprint in "client mode" (scroll past banner)
- Quickly update status during call
- No need to switch contexts

### 3. Sprint Monitoring
Admin can:
- See at a glance they're in admin mode
- Know which sprint they're viewing
- Change status based on progress

## Future Enhancements

### Phase 2
- [ ] **Inline editing** of sprint title
- [ ] **Add/remove deliverables** (admin bypass of draft-only rule)
- [ ] **Assign sprint owner** (reassign to different account)
- [ ] **Add internal notes** (visible only to admins)
- [ ] **View audit log** (history of changes)

### Phase 3
- [ ] **Send notifications** (email client about status change)
- [ ] **Bulk actions** (change status for multiple sprints)
- [ ] **Templates** (save sprint as template)
- [ ] **Clone sprint** (duplicate for similar project)

## Security

**Access Control:**
- ✅ Banner only visible to admins
- ✅ Status change API requires admin auth
- ✅ Non-admins cannot see or use controls
- ✅ Server-side validation on all changes

**Audit Trail:**
- ✅ Updates `updated_at` timestamp
- ✅ Old status shown in success message
- ⏳ Full audit log (future enhancement)

## User Experience

### For Admins
- **Clear indication** when in admin mode
- **Quick access** to common actions
- **No context switching** needed
- **Visual feedback** for all changes

### For Clients
- **No clutter** - admin controls hidden
- **Clean interface** - focused on sprint content
- **No confusion** - banner not shown to non-admins

## Styling

**Banner:**
- Background: `bg-gradient-to-r from-purple-600 to-blue-600`
- Text: White with varying opacity
- Positioning: `sticky top-0 z-50`
- Padding: Extends full width with negative margins

**Dropdown:**
- Background: `bg-white/10` with backdrop blur
- Border: `border-white/20`
- Text: White on banner, black in options
- Focus ring: White with 30% opacity

**Success/Error Messages:**
- Success: Green background with 20% opacity
- Error: Red background with 20% opacity
- Compact: Small text, rounded corners

## Testing

### 1. As Non-Admin
- Navigate to sprint page
- Verify NO banner appears
- Verify normal client view

### 2. As Admin
- Login as admin user
- Navigate to sprint page
- Verify banner appears at top
- Verify current status shown
- Test status change:
  - Select new status
  - Confirm dialog
  - Wait for success message
  - Verify page reloads
  - Verify status changed

### 3. Status Change Flow
- Change from `draft` → `studio_review` ✓
- Change from `studio_review` → `pending_client` ✓
- Change from `pending_client` → `in_progress` ✓
- Change from `in_progress` → `completed` ✓

### 4. Error Handling
- Try changing status without admin auth (should fail)
- Try invalid status value (should fail)
- Try on non-existent sprint (should fail)

## Responsive Design

**Desktop:**
- Full banner with all text visible
- Dropdown on right side
- Comfortable spacing

**Mobile:**
- Banner compresses
- "Viewing as administrator" text hidden on small screens
- Dropdown moves below admin badge if needed
- Maintains functionality

## Example Usage

**Scenario:** Studio admin reviewing sprint with client

1. Admin opens sprint: `http://localhost:3000/sprints/sprint-abc123`
2. Sees purple/blue banner at top
3. Scrolls down to review sprint with client
4. After review, scrolls back to top
5. Changes status from "draft" to "studio_review"
6. Confirms change
7. Sees success message
8. Page reloads with new status

**Benefit:** Admin never left the sprint page. No context switching required.

---

**Status**: ✅ Complete and ready to use
**Deployment**: Changes are live, log in as admin to see banner

