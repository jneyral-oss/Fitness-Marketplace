const fs = require('fs');
const path = require('path');
const db = require('../db');

function readJson(fp){
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

(async function migrate(){
  const users = readJson(path.join(__dirname, '..', 'data', 'users.json'));
  const plans = readJson(path.join(__dirname, '..', 'data', 'plans.json'));
  const trainings = readJson(path.join(__dirname, '..', 'data', 'entrenamientos.json'));

  db.serialize(() => {
    const ustmt = db.prepare(`INSERT OR REPLACE INTO users (id,nombre,email,password,role) VALUES (?,?,?,?,?)`);
    for (const u of users) {
      ustmt.run(u.id, u.nombre, u.email, u.password, u.role || 'user');
    }
    ustmt.finalize();

    const pstmt = db.prepare(`INSERT OR REPLACE INTO plans (id,titulo,descripcion,precio,aprobado,url_vista_previa,coach_id,coach_nombre,coach_bio) VALUES (?,?,?,?,?,?,?,?,?)`);
    for (const p of plans) {
      pstmt.run(p.id, p.titulo, p.descripcion, p.precio, p.aprobado ? 1 : 0, p.url_vista_previa || null, p.coach?.id || null, p.coach?.nombre || null, p.coach?.bio || null);
    }
    pstmt.finalize();

    const tstmt = db.prepare(`INSERT INTO entrenamientos (id,usuario_id,fecha,id_plan) VALUES (?,?,?,?)`);
    for (const t of trainings) {
      // if training has id use it, otherwise DB autoincrement
      tstmt.run(t.id || null, t.usuario_id, t.fecha, t.id_plan);
    }
    tstmt.finalize(() => {
      console.log('Migración completada.');
      db.close();
    });
  });
})();
