-- Script to make a user an admin
-- Replace 'your-email@example.com' with the actual email address

-- First, let's see all existing accounts
SELECT id, email, is_admin, created_at FROM accounts ORDER BY created_at;

-- To make a user an admin, run:
-- UPDATE accounts SET is_admin = true WHERE email = 'your-email@example.com';

-- To verify the change:
-- SELECT id, email, is_admin FROM accounts WHERE is_admin = true;

-- Example commands for common scenarios:

-- Make the first/only user an admin:
-- UPDATE accounts SET is_admin = true WHERE id = (SELECT id FROM accounts ORDER BY created_at LIMIT 1);

-- Make a specific user an admin by email:
-- UPDATE accounts SET is_admin = true WHERE email = 'chris@example.com';

-- Remove admin access:
-- UPDATE accounts SET is_admin = false WHERE email = 'user@example.com';

-- View all admin users:
-- SELECT id, email, created_at FROM accounts WHERE is_admin = true ORDER BY created_at;

