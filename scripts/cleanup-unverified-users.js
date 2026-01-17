/**
 * One-time script to delete all unverified user accounts
 * Run with: node scripts/cleanup-unverified-users.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function cleanupUnverifiedUsers() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔍 Checking for unverified users...\n');

    // First, get a preview of what will be deleted
    const previewResult = await pool.query(`
      SELECT 
        id,
        email,
        is_admin,
        created_at,
        email_verified_at,
        (SELECT COUNT(*) FROM projects WHERE account_id = accounts.id) as owned_projects,
        (SELECT COUNT(*) FROM documents WHERE account_id = accounts.id) as documents
      FROM accounts
      WHERE email_verified_at IS NULL
      ORDER BY created_at DESC
    `);

    const unverifiedUsers = previewResult.rows;

    if (unverifiedUsers.length === 0) {
      console.log('✅ No unverified users found. Database is clean!');
      await pool.end();
      return;
    }

    console.log(`Found ${unverifiedUsers.length} unverified user(s):\n`);
    
    // Show preview
    unverifiedUsers.slice(0, 10).forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   Admin: ${user.is_admin ? 'Yes ⚠️' : 'No'}`);
      console.log(`   Owned projects: ${user.owned_projects}`);
      console.log(`   Documents: ${user.documents}`);
      console.log('');
    });

    if (unverifiedUsers.length > 10) {
      console.log(`... and ${unverifiedUsers.length - 10} more\n`);
    }

    // Check for admin accounts
    const adminCount = unverifiedUsers.filter(u => u.is_admin).length;
    if (adminCount > 0) {
      console.log(`⚠️  WARNING: ${adminCount} unverified account(s) have admin privileges!`);
      console.log('   These will also be deleted.\n');
    }

    // Confirm deletion
    console.log('⚠️  This will permanently delete these accounts and their associated data.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Deleting unverified users...\n');

    // First, set documents.account_id to NULL for unverified users
    await pool.query(`
      UPDATE documents
      SET account_id = NULL
      WHERE account_id IN (
        SELECT id FROM accounts WHERE email_verified_at IS NULL
      )
    `);

    // Delete unverified accounts
    // The database schema handles cascading deletes for other related data
    const deleteResult = await pool.query(`
      DELETE FROM accounts
      WHERE email_verified_at IS NULL
      RETURNING id, email
    `);

    console.log(`✅ Successfully deleted ${deleteResult.rowCount} unverified account(s)\n`);
    
    if (deleteResult.rowCount > 0 && deleteResult.rowCount <= 20) {
      console.log('Deleted accounts:');
      deleteResult.rows.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email}`);
      });
    }

    // Show final stats
    const remainingResult = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN email_verified_at IS NOT NULL THEN 1 END) as verified
      FROM accounts
    `);
    
    const stats = remainingResult.rows[0];
    console.log(`\n📊 Database status:`);
    console.log(`   Total accounts: ${stats.total}`);
    console.log(`   Verified accounts: ${stats.verified}`);
    console.log(`   Unverified accounts: ${stats.total - stats.verified}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupUnverifiedUsers();
