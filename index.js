 const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi.json');

dotenv.config();

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'dev_secret';
const app = express();
app.use(cors());

// Configuración de CORS explícita para github.dev y consola local
// (los orígenes vacíos permiten llamadas desde herramientas como curl)
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('https://psychic-dollop-v69qv5r75xvv26p4q-5173.app.github.dev')) return callback(null, true);
    if (origin.startsWith('https://psychic-dollop-v69qv5r75xvv26p4q-3000.app.github.dev')) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Servir frontend estático si existe (facilita ver la demo desde la misma app)
const reactDist = path.join(__dirname, 'frontend-react', 'dist');
let frontendPath = path.join(__dirname, 'frontend');
if (fs.existsSync(reactDist)) frontendPath = reactDist;

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  // Si la ruta no es /api ni /docs, enviar index.html para soportar SPA/demo
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/docs') || req.path === '/health') return next();
    return res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const plansFile = path.join(dataDir, 'plans.json');
const trainingsFile = path.join(dataDir, 'entrenamientos.json');

function readJson(fp){
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}
function writeJson(fp, obj){
  fs.writeFileSync(fp, JSON.stringify(obj, null, 2), 'utf8');
}

// Helpers para DB usando Promises
function dbGet(sql, params=[]) {
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}
function dbAll(sql, params=[]) {

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
function dbRun(sql, params=[]) {

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { if (err) reject(err); else resolve(this); });
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Middleware: verificar JWT y establecer req.user
function verifyToken(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'token requerido' });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'token inválido' });
  }
}

// Middleware: requerir rol(s)
function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user && req.user.role ? req.user.role : 'user';
    if (roles.includes(role)) return next();
    return res.status(403).json({ error: 'no autorizado' });
  };
}

// Endpoint para obtener datos del usuario autenticado
app.get('/api/me', verifyToken, (req, res) => {
  const users = readJson(usersFile);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'usuario no encontrado' });
  const safe = { ...user };
  delete safe.password;
  res.json(safe);
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, nombre, email, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'usuario no encontrado' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'error interno' });
  }
});

app.post('/api/usuarios/login',
app.post(
  '/api/usuarios/login',
  body('email').isEmail().withMessage('email inválido'),
  body('password').isString().isLength({ min: 1 }).withMessage('password requerido'),
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body || {};
  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'credenciales inválidas' });
    const isHashed = typeof user.password === 'string' && user.password.startsWith('$2');
    let ok = false;
    if (isHashed) {
      ok = bcrypt.compareSync(password, user.password);
    } else {
      ok = password === user.password;
      if (ok) {
        const salt = bcrypt.genSaltSync(10);
        const hashed = bcrypt.hashSync(password, salt);
        await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
        user.password = hashed;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body || {};
    try {
      const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) return res.status(401).json({ error: 'credenciales inválidas' });

      const isHashed = typeof user.password === 'string' && user.password.startsWith('$2');
      let ok = false;
      if (isHashed) {
        ok = bcrypt.compareSync(password, user.password);
      } else {
        ok = password === user.password;
        if (ok) {
          const salt = bcrypt.genSaltSync(10);
          const hashed = bcrypt.hashSync(password, salt);
          await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
          user.password = hashed;
        }
      }

      if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, SECRET, { expiresIn: '7d' });
      const userSafe = { ...user };
      delete userSafe.password;
      return res.json({ token, usuario: userSafe });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'error interno' });
    }
    if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, SECRET, { expiresIn: '7d' });
    const userSafe = { ...user };
    delete userSafe.password;
    res.json({ token, usuario: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error interno' });
  }
});
);

app.get('/api/planes', async (req, res) => {
  try {
    const plans = await dbAll('SELECT * FROM plans WHERE aprobado = 1');
    // map coach fields back to `coach` object
    const mapped = plans.map(p => ({
    const mapped = plans.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      descripcion: p.descripcion,
      precio: p.precio,
      aprobado: !!p.aprobado,
      url_vista_previa: p.url_vista_previa,
      coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null
      coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null,
    }));
    res.json(mapped);
    return res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error interno' });
    return res.status(500).json({ error: 'error interno' });
  }
});

app.get('/api/planes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await dbGet('SELECT * FROM plans WHERE id = ?', [id]);
    if (!p) return res.status(404).json({ error: 'plan no encontrado' });

    const plan = {
      id: p.id,
      titulo: p.titulo,
      descripcion: p.descripcion,
      precio: p.precio,
      aprobado: !!p.aprobado,
      url_vista_previa: p.url_vista_previa,
      coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null
      coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null,
    };
    res.json(plan);
    return res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error interno' });
    return res.status(500).json({ error: 'error interno' });
  }
});

// Crear un plan (solo coach/admin)
app.post('/api/planes',
app.post(
  '/api/planes',
  verifyToken,
  requireRole('coach', 'admin'),
  body('titulo').isString().notEmpty().withMessage('titulo requerido'),
  body('descripcion').isString().optional(),
  body('precio').isFloat({ min: 0 }).withMessage('precio inválido'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { titulo, descripcion, precio, aprobado, url_vista_previa } = req.body;
      const coach_id = req.user.id;
      const coach_nombre_row = await dbGet('SELECT nombre FROM users WHERE id = ?', [coach_id]);
      const coach_nombre = coach_nombre_row ? coach_nombre_row.nombre : null;
      const coachId = req.user.id;
      const coachNombreRow = await dbGet('SELECT nombre FROM users WHERE id = ?', [coachId]);
      const coach_nombre = coachNombreRow ? coachNombreRow.nombre : null;
      const coach_bio = null;
      const result = await dbRun(`INSERT INTO plans (titulo, descripcion, precio, aprobado, url_vista_previa, coach_id, coach_nombre, coach_bio) VALUES (?,?,?,?,?,?,?,?)`, [titulo, descripcion || null, precio, aprobado ? 1 : 0, url_vista_previa || null, coach_id, coach_nombre, coach_bio]);

      const result = await dbRun(
        'INSERT INTO plans (titulo, descripcion, precio, aprobado, url_vista_previa, coach_id, coach_nombre, coach_bio) VALUES (?,?,?,?,?,?,?,?)',
        [titulo, descripcion || null, precio, aprobado ? 1 : 0, url_vista_previa || null, coachId, coach_nombre, coach_bio]
      );
      const newId = result.lastID;
      const p = await dbGet('SELECT * FROM plans WHERE id = ?', [newId]);
      res.status(201).json({ id: p.id, titulo: p.titulo, descripcion: p.descripcion, precio: p.precio, aprobado: !!p.aprobado, url_vista_previa: p.url_vista_previa, coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null });
      return res.status(201).json({
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        precio: p.precio,
        aprobado: !!p.aprobado,
        url_vista_previa: p.url_vista_previa,
        coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
      return res.status(500).json({ error: 'error interno' });
    }
  }
);

// Registro de usuario
app.post('/api/usuarios',
app.post(
  '/api/usuarios',
  body('nombre').isString().notEmpty().withMessage('nombre requerido'),
  body('email').isEmail().withMessage('email inválido'),
  body('password').isString().isLength({ min: 6 }).withMessage('password requerido (min 6)'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, email, password } = req.body || {};
    try {
      const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) return res.status(409).json({ error: 'email ya registrado' });

      const salt = bcrypt.genSaltSync(10);
      const hashed = bcrypt.hashSync(password, salt);
      const result = await dbRun('INSERT INTO users (nombre, email, password, role) VALUES (?,?,?,?)', [nombre, email, hashed, 'user']);
      const newId = result.lastID;
      const token = jwt.sign({ id: newId, email, role: 'user' }, SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, usuario: { id: newId, nombre, email, role: 'user' } });
      return res.status(201).json({ token, usuario: { id: newId, nombre, email, role: 'user' } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
      return res.status(500).json({ error: 'error interno' });
    }
  }
);

// Editar un plan (solo coach/admin)
app.put('/api/planes/:id',
app.put(
  '/api/planes/:id',
  verifyToken,
  requireRole('coach', 'admin'),
  body('titulo').isString().optional(),
  body('descripcion').isString().optional(),
  body('precio').isFloat({ min: 0 }).optional(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = Number(req.params.id);
      const existing = await dbGet('SELECT * FROM plans WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'plan no encontrado' });

      // Sólo el coach creador o admin pueden editar
      const roleReq = req.user.role || 'user';
      if (roleReq !== 'admin') {
        if (roleReq !== 'coach' || req.user.id !== existing.coach_id) {
          return res.status(403).json({ error: 'no autorizado para editar este plan' });
        }
      }

      const { titulo, descripcion, precio, aprobado, url_vista_previa } = req.body;
      const updates = {
        titulo: titulo !== undefined ? titulo : existing.titulo,
        descripcion: descripcion !== undefined ? descripcion : existing.descripcion,
        precio: precio !== undefined ? precio : existing.precio,
        aprobado: aprobado !== undefined ? (aprobado ? 1 : 0) : existing.aprobado,
        url_vista_previa: url_vista_previa !== undefined ? url_vista_previa : existing.url_vista_previa
        url_vista_previa: url_vista_previa !== undefined ? url_vista_previa : existing.url_vista_previa,
      };
      await dbRun('UPDATE plans SET titulo = ?, descripcion = ?, precio = ?, aprobado = ?, url_vista_previa = ? WHERE id = ?', [updates.titulo, updates.descripcion, updates.precio, updates.aprobado, updates.url_vista_previa, id]);

      await dbRun(
        'UPDATE plans SET titulo = ?, descripcion = ?, precio = ?, aprobado = ?, url_vista_previa = ? WHERE id = ?',
        [updates.titulo, updates.descripcion, updates.precio, updates.aprobado, updates.url_vista_previa, id]
      );
      const p = await dbGet('SELECT * FROM plans WHERE id = ?', [id]);
      res.json({ id: p.id, titulo: p.titulo, descripcion: p.descripcion, precio: p.precio, aprobado: !!p.aprobado, url_vista_previa: p.url_vista_previa, coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null });
      return res.json({
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        precio: p.precio,
        aprobado: !!p.aprobado,
        url_vista_previa: p.url_vista_previa,
        coach: p.coach_id ? { id: p.coach_id, nombre: p.coach_nombre, bio: p.coach_bio } : null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
      return res.status(500).json({ error: 'error interno' });
    }
  }
);

app.post('/api/usuarios/:id/entrenamientos',
app.post(
  '/api/usuarios/:id/entrenamientos',
  verifyToken,
  body('fecha').isISO8601().withMessage('fecha inválida, usar YYYY-MM-DD'),
  body('id_plan').isInt().withMessage('id_plan debe ser entero'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = Number(req.params.id);
      const role = req.user.role || 'user';
      if (req.user.id !== userId && role !== 'admin' && role !== 'coach') {
        return res.status(403).json({ error: 'no autorizado para registrar entrenamiento para este usuario' });
      }

      const { fecha, id_plan } = req.body || {};
      await dbRun('INSERT INTO entrenamientos (usuario_id, fecha, id_plan) VALUES (?,?,?)', [userId, fecha, id_plan]);
      res.json({ mensaje: 'Entrenamiento registrado' });
      return res.json({ mensaje: 'Entrenamiento registrado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
      return res.status(500).json({ error: 'error interno' });
    }
  }
);

app.get('/', (req, res) => res.send('Fitness Marketplace API (demo)'));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  const server = app.listen(PORT, () => console.log(`Servidor backend corriendo en http://localhost:${PORT}`));
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down');
    server.close(() => process.exit(0));
  });
}

module.exports = app;