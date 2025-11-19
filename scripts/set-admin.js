#!/usr/bin/env node

// Script to set a user as admin
// Usage: node scripts/set-admin.js chris@chrismeisner.com

const { Pool } = require('pg');

const email = process.argv[2] || 'chris@chrismeisner.com';

async function setAdmin() {
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
    console.log(`Setting ${email} as admin...`);
    
    // First check if user exists
    const checkResult = await pool.query(
      'SELECT id, email, is_admin FROM accounts WHERE email = $1',
      [email]
    );

    if (checkResult.rowCount === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    const user = checkResult.rows[0];
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current admin status: ${user.is_admin}`);

    if (user.is_admin) {
      console.log('✅ User is already an admin!');
      process.exit(0);
    }

    // Update to admin
    const updateResult = await pool.query(
      'UPDATE accounts SET is_admin = true WHERE email = $1 RETURNING id, email, is_admin',
      [email]
    );

    const updatedUser = updateResult.rows[0];
    console.log('✅ Successfully updated user to admin!');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Admin: ${updatedUser.is_admin}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setAdmin();

