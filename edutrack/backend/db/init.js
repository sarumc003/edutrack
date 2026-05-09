// db/init.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'edutrack.db');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('principal','teacher','attender')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      joined_date TEXT,
      color TEXT DEFAULT '#0f1f3d',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classrooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      division TEXT,
      stream TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL REFERENCES teachers(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('P','A','L','H')),
      marked_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, date)
    );

    CREATE TABLE IF NOT EXISTS class_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL REFERENCES teachers(id),
      classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      date TEXT NOT NULL,
      arrive_time TEXT NOT NULL,
      depart_time TEXT,
      subject TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leave_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL REFERENCES teachers(id),
      date TEXT NOT NULL,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('Medical','Casual','Duty','Annual','No Pay')),
      reason TEXT,
      approved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized');
  db.close();
}

module.exports = { getDb, initDb };
