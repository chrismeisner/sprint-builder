#!/bin/bash

# Script to verify the admin system is properly set up

echo "=========================================="
echo "Admin System Setup Verification"
echo "=========================================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Server is running"
else
    echo "   ❌ Server is not running. Start it with: npm run dev"
    exit 1
fi
echo ""

# Check database status
echo "2. Checking database status..."
DB_STATUS=$(curl -s http://localhost:3000/api/admin/db/status)
if echo "$DB_STATUS" | grep -q '"ok":true'; then
    echo "   ✅ Database is connected"
    
    # Extract counts
    ACCOUNTS=$(echo "$DB_STATUS" | grep -o '"accounts_total":[0-9]*' | grep -o '[0-9]*')
    ADMINS=$(echo "$DB_STATUS" | grep -o '"accounts_admins":[0-9]*' | grep -o '[0-9]*')
    
    echo "   📊 Accounts: $ACCOUNTS total, $ADMINS admins"
else
    echo "   ❌ Database connection failed"
    exit 1
fi
echo ""

# Check database schema
echo "3. Checking accounts table schema..."
SCHEMA=$(curl -s http://localhost:3000/api/admin/db/schema)
if echo "$SCHEMA" | grep -q '"column_name":"is_admin"'; then
    echo "   ✅ is_admin column exists"
else
    echo "   ❌ is_admin column not found"
    echo "   Run: curl -X POST http://localhost:3000/api/admin/db/ensure"
    exit 1
fi

if echo "$SCHEMA" | grep -q '"indexname":"idx_accounts_is_admin"'; then
    echo "   ✅ is_admin index exists"
else
    echo "   ❌ is_admin index not found"
    exit 1
fi
echo ""

# Check if there are any admins
echo "4. Checking admin status..."
if [ "$ADMINS" -eq 0 ]; then
    echo "   ⚠️  No admin users found"
    echo ""
    echo "   To set up your first admin, run:"
    echo "   psql \$DATABASE_URL -c \"UPDATE accounts SET is_admin = true WHERE email = 'your-email@example.com';\""
    echo ""
elif [ "$ADMINS" -eq 1 ]; then
    echo "   ✅ 1 admin user configured"
else
    echo "   ✅ $ADMINS admin users configured"
fi
echo ""

# Check API endpoints
echo "5. Checking API endpoints..."
USERS_API=$(curl -s http://localhost:3000/api/admin/users 2>&1)
if echo "$USERS_API" | grep -q 'Authentication required'; then
    echo "   ✅ /api/admin/users endpoint is protected (requires auth)"
elif echo "$USERS_API" | grep -q '"users"'; then
    echo "   ✅ /api/admin/users endpoint is accessible (you're logged in as admin)"
else
    echo "   ⚠️  /api/admin/users endpoint response unclear"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
if [ "$ADMINS" -gt 0 ]; then
    echo "✅ Admin system is fully set up!"
    echo ""
    echo "Next steps:"
    echo "  1. Log in with an admin account"
    echo "  2. Visit http://localhost:3000/dashboard"
    echo "  3. Click 'User Management' to manage users"
else
    echo "⚠️  Admin system is installed but needs configuration"
    echo ""
    echo "Next steps:"
    echo "  1. Set up your first admin using the command above"
    echo "  2. Log in with that account"
    echo "  3. Visit http://localhost:3000/dashboard/users"
fi
echo ""

