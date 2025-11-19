# Admin User Setup

This document explains how to set up admin users in the application.

## Database Schema

The `accounts` table now includes an `is_admin` boolean field:

```sql
CREATE TABLE accounts (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Setting Up Your First Admin User

### Method 1: Direct Database Access

To manually grant admin access to a user, connect to your PostgreSQL database and run:

```sql
-- Grant admin access by email
UPDATE accounts 
SET is_admin = true 
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, is_admin FROM accounts WHERE email = 'your-email@example.com';
```

### Method 2: Using psql command line

```bash
# Connect to your database
psql $DATABASE_URL

# Run the update command
UPDATE accounts SET is_admin = true WHERE email = 'your-email@example.com';
```

### Method 3: Using Heroku CLI (if hosted on Heroku)

```bash
heroku pg:psql -a your-app-name
UPDATE accounts SET is_admin = true WHERE email = 'your-email@example.com';
```

## Admin Features

Once a user has `is_admin = true`, they gain access to:

1. **User Management Dashboard** (`/dashboard/users`)
   - View all registered users
   - See user statistics (document count, join date)
   - Grant or revoke admin access for other users

2. **Admin-Only API Endpoints**
   - `GET /api/admin/users` - List all users with pagination
   - `PATCH /api/admin/users?userId=xxx` - Update user admin status

## Security Notes

- Admin status is checked server-side in all protected routes
- The `requireAdmin()` helper function throws an error if the user is not an admin
- Session tokens include the user's admin status for efficient checks
- Always verify admin status before performing sensitive operations

## Finding User IDs

To find a user's ID by email:

```sql
SELECT id, email, is_admin, created_at 
FROM accounts 
WHERE email = 'user@example.com';
```

To list all admin users:

```sql
SELECT id, email, created_at 
FROM accounts 
WHERE is_admin = true 
ORDER BY created_at DESC;
```

## Revoking Admin Access

To remove admin access from a user:

```sql
UPDATE accounts 
SET is_admin = false 
WHERE email = 'user@example.com';
```

Or use the User Management Dashboard UI at `/dashboard/users` (requires admin access).

