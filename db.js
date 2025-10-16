const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./donleon.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    short_description TEXT,
    image_url TEXT
  )`);


  db.run('ALTER TABLE products ADD COLUMN price REAL', (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
      console.error('Price column alter error:', err.message);
    }
  });
});

module.exports = db;
