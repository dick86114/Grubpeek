const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../grubpeek.db');
const db = new Database(dbPath);
const rows = db.prepare("SELECT name FROM menus WHERE name LIKE '0%'").all();
console.log('Found ' + rows.length + ' rows starting with 0');
console.log(rows.slice(0, 10));
