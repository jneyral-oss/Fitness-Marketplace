const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Usamos una base de datos en memoria para desarrollo en github.dev
// Esto evita todos los problemas de archivos y permisos.
const db = new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos en memoria:', err.message);
    throw err;
  }
  console.log('Conectado a la base de datos en memoria.');
});

// Crear tablas si no existen
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

  // Para desarrollo, podemos precargar algunos datos de ejemplo
  db.run(`
    INSERT INTO plans (titulo, descripcion, precio, aprobado, url_vista_previa, coach_id, coach_nombre, coach_bio) 
    VALUES 
      ('Plan de Inicio para Principiantes', 'Perfecto para empezar. Enfocado en movimientos básicos y consistencia.', 0.00, 1, 'https://ejemplo.com/vista_previa1.pdf', null, null, null),
      ('Ganar Músculo Nivel Intermedio', 'Para quienes ya tienen algo de experiencia. Ideal para superar mesetas de estancamiento.', 25.99, 1, 'https://ejemplo.com/vista_previa2.pdf', null, null),
      ('Plan de Definición Avanzada', 'Para usuarios avanzados que buscan un desafío extra. Enfocado en hipertrofia y fuerza.', 49.99, 1, 'https://ejemplo.com/vista_previa3.pdf', null, null)
  `);
  `);

  console.log('Base de datos en memoria inicializada con datos de ejemplo.');
});

module.exports = db;
