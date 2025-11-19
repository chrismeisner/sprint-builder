# Profile System Documentation

## Overview

The Profile System allows logged-in users to view and manage their personal information, intake forms, and sprint drafts.

## Features

### 1. Profile Information
- **Email**: Display user's email address
- **Name**: Editable name field (optional)
- **Account Type**: Shows if user is Admin or regular User
- **Member Since**: Account creation date

### 2. My Intake Forms
- Table view of all intake forms submitted by the user
- Shows:
  - Filename
  - Submission date
  - Direct link to view form details
- Matched by email address or account ID

### 3. My Sprint Drafts
- Table view of all sprint drafts created from user's intake forms
- Shows:
  - Sprint title
  - Status (draft, in_progress, completed, cancelled)
  - Number of deliverables
  - Total price
  - Creation date
  - Direct link to view sprint details

### 4. Statistics
- Total number of intake forms
- Total number of sprint drafts

## Database Changes

### Accounts Table
Added `name` column:
```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS name text;
```

**Schema:**
| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| id | text | - | NO |
| email | text | - | NO |
| created_at | timestamptz | now() | NO |
| is_admin | boolean | false | NO |
| **name** | **text** | **null** | **YES** |

## API Endpoints

### GET `/api/profile`
Get current user's profile with their documents and sprints.

**Authentication:** Required (cookie-based session)

**Response:**
```json
{
  "profile": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "documents": [
    {
      "id": "doc-id",
      "filename": "intake-form.json",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "sprints": [
    {
      "id": "sprint-id",
      "title": "Website Redesign Sprint",
      "status": "in_progress",
      "deliverable_count": 3,
      "total_fixed_price": 5000,
      "total_fixed_hours": 40,
      "created_at": "2024-01-02T00:00:00Z",
      "updated_at": "2024-01-03T00:00:00Z",
      "document_id": "doc-id",
      "document_filename": "intake-form.json"
    }
  ],
  "stats": {
    "totalDocuments": 1,
    "totalSprints": 1
  }
}
```

### PATCH `/api/profile`
Update current user's profile information.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## Pages

### `/profile`
Profile page displaying user information and their sprints.

**Access:** Logged-in users only (redirects to `/login` if not authenticated)

**Features:**
- View and edit profile information
- See account statistics
- Browse all intake forms
- Browse all sprint drafts
- Quick links to view detailed information

## Navigation

The profile page is accessible through:
1. **User Menu Dropdown** (top right when logged in)
   - "My Profile" link
   - "My Sprints" link (existing page, also shows sprints)

## Data Relationships

```
accounts (user)
    ↓
documents (intake forms)
    ↓
sprint_drafts (sprints)
```

Documents are matched to users by:
- `documents.email` = `accounts.email`
- OR `documents.account_id` = `accounts.id`

Sprint drafts are found through:
- `sprint_drafts.document_id` → `documents.id` → matched to user

## Security

- ✅ All API endpoints require authentication
- ✅ Users can only view their own data
- ✅ Profile updates only affect the authenticated user's data
- ✅ No ability to view or modify other users' profiles
- ✅ Admin status cannot be changed through the profile API

## File Structure

```
app/
├── api/
│   └── profile/
│       └── route.ts          # Profile API endpoints
└── profile/
    ├── page.tsx              # Profile page (server component)
    └── ProfileClient.tsx     # Profile UI (client component)

lib/
└── db.ts                     # Updated with name column

app/
└── UserMenu.tsx              # Updated with profile links
```

## Usage Example

### Accessing the Profile Page
1. Log in to the application
2. Click on your email in the top-right corner
3. Select "My Profile" from the dropdown
4. View and edit your profile information

### Editing Your Name
1. Navigate to `/profile`
2. Click "Edit" next to the name field
3. Enter your name
4. Click "Save"

### Viewing Your Sprints
1. Navigate to `/profile`
2. Scroll to "My Sprint Drafts" section
3. Click "View Sprint" on any sprint to see details

## Testing

Test the profile system:

```bash
# Check database schema
curl http://localhost:3000/api/admin/db/schema | jq '.accounts_schema'

# Get profile (requires authentication)
curl http://localhost:3000/api/profile

# Update profile name (requires authentication)
curl -X PATCH http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'
```

## Future Enhancements

Potential additions:
- Profile picture/avatar upload
- Email notification preferences
- Two-factor authentication settings
- API key management
- Activity log/history
- Timezone preferences
- Language preferences

