import sqlite3 from "sqlite3";

const sq = new sqlite3.Database(":memory:");

sq.run(`
  CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT
  )
`);

sq.run(`
  CREATE TABLE pending_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

export default sq;
