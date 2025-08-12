const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, 'math_council.db'));

// Create tables
function initializeDatabase() {
  // Enable foreign key constraints
  db.exec('PRAGMA foreign_keys = ON');
  
  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Participants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      personality TEXT NOT NULL,
      specialty TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully with cascade delete constraints');
}

// Initialize database first
initializeDatabase();

// Session operations
const sessionOps = {
  create: db.prepare(`
    INSERT INTO sessions (problem, difficulty) 
    VALUES (?, ?)
  `),
  
  getById: db.prepare(`
    SELECT * FROM sessions WHERE id = ?
  `),
  
  getAll: db.prepare(`
    SELECT * FROM sessions ORDER BY created_at DESC
  `),
  
  delete: db.prepare(`
    DELETE FROM sessions WHERE id = ?
  `)
};

// Participant operations
const participantOps = {
  create: db.prepare(`
    INSERT INTO participants (session_id, name, personality, specialty) 
    VALUES (?, ?, ?, ?)
  `),
  
  getBySessionId: db.prepare(`
    SELECT * FROM participants WHERE session_id = ? AND is_active = 1
  `),
  
  deactivate: db.prepare(`
    UPDATE participants SET is_active = 0 WHERE id = ?
  `),
  
  getById: db.prepare(`
    SELECT * FROM participants WHERE id = ?
  `),
  
  deleteBySessionId: db.prepare(`
    DELETE FROM participants WHERE session_id = ?
  `)
};

// Message operations
const messageOps = {
  create: db.prepare(`
    INSERT INTO messages (session_id, participant_id, content) 
    VALUES (?, ?, ?)
  `),
  
  getBySessionId: db.prepare(`
    SELECT m.*, p.name, p.personality, p.specialty 
    FROM messages m 
    JOIN participants p ON m.participant_id = p.id 
    WHERE m.session_id = ? 
    ORDER BY m.created_at ASC
  `),
  
  getLastMessage: db.prepare(`
    SELECT m.*, p.name, p.personality, p.specialty 
    FROM messages m 
    JOIN participants p ON m.participant_id = p.id 
    WHERE m.session_id = ? 
    ORDER BY m.created_at DESC 
    LIMIT 1
  `),
  
  getCountBySessionId: db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE session_id = ?
  `),
  
  deleteBySessionId: db.prepare(`
    DELETE FROM messages WHERE session_id = ?
  `)
};

module.exports = {
  db,
  sessionOps,
  participantOps,
  messageOps
};
