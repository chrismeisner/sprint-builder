#!/usr/bin/env node
/**
 * Migration: Make sandboxes.project_id nullable
 * This allows sandboxes to be unlinked from projects
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('Running migration: Make sandboxes.project_id nullable...');
    
    await pool.query(`
      ALTER TABLE sandboxes 
      ALTER COLUMN project_id DROP NOT NULL
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('   sandboxes.project_id is now nullable');
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log('⚠️  Column constraint already removed or table does not exist');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
