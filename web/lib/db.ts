import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database
const initDb = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, skipping database initialization');
    return;
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Create menus table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        type VARCHAR(20) NOT NULL,
        category VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        is_featured INTEGER DEFAULT 0,
        price INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add sort_order column if not exists (for migration)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menus' AND column_name = 'sort_order') THEN
          ALTER TABLE menus ADD COLUMN sort_order INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Initialize/Migrate admin password
    const { rows } = await client.query('SELECT value FROM settings WHERE key = $1', ['admin_password']);
    if (rows.length === 0) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin888';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await client.query('INSERT INTO settings (key, value) VALUES ($1, $2)', ['admin_password', hashedPassword]);
    } else {
      // Check if current password is not hashed (basic check for bcrypt prefix)
      const currentVal = rows[0].value;
      if (!currentVal.startsWith('$2')) {
         console.log('Migrating plain text password to hash...');
         const hashedPassword = await bcrypt.hash(currentVal, 10);
         await client.query('UPDATE settings SET value = $1 WHERE key = $2', [hashedPassword, 'admin_password']);
      }
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (e) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Database initialization failed:', e);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Run initialization
initDb().catch(e => console.error('Failed to run DB init:', e));

export default pool;
