import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'grubpeek.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner'
    category TEXT,
    name TEXT NOT NULL,
    is_featured INTEGER DEFAULT 0, -- 0 or 1
    price INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Initialize default admin password if not exists
const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
if (!stmt.get('admin_password')) {
  const defaultPassword = process.env.ADMIN_PASSWORD || 'admin888';
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('admin_password', defaultPassword);
}

export default db;
