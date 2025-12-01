const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

// crear tablas si no existen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      nombre TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY,
      titulo TEXT,
      descripcion TEXT,
      precio REAL,
      aprobado INTEGER,
      url_vista_previa TEXT,
      coach_id INTEGER,
      coach_nombre TEXT,
      coach_bio TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS entrenamientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      fecha TEXT,
      id_plan INTEGER
    );
  `);
});

module.exports = db;
