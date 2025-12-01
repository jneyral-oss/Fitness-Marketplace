const request = require('supertest');
const app = require('../index');
const db = require('../db');

let adminToken, coachToken, userToken, otherCoachToken;

beforeAll(async () => {
  // Insertar otro coach para prueba de autorización
  await new Promise((resolve, reject) => {
    db.run('INSERT OR REPLACE INTO users (id,nombre,email,password,role) VALUES (?,?,?,?,?)', [300, 'Other Coach', 'other@coach.com', 'coach2pass', 'coach'], (err) => err ? reject(err) : resolve());
  });

  // login admin
  const adminRes = await request(app).post('/api/usuarios/login').send({ email: 'admin@site.com', password: 'adminpass' });
  adminToken = adminRes.body.token;
  const coachRes = await request(app).post('/api/usuarios/login').send({ email: 'mario@coaches.com', password: 'coachpass' });
  coachToken = coachRes.body.token;
  const otherCoachRes = await request(app).post('/api/usuarios/login').send({ email: 'other@coach.com', password: 'coach2pass' });
  otherCoachToken = otherCoachRes.body.token;
  const userRes = await request(app).post('/api/usuarios/login').send({ email: 'ana@email.com', password: '1234' });
  userToken = userRes.body.token;
});

describe('API básica', () => {
  test('GET /api/planes devuelve planes aprobados', async () => {
    const res = await request(app).get('/api/planes');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  let createdPlanId;

  test('Coach puede crear un plan', async () => {
    const res = await request(app)
      .post('/api/planes')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ titulo: 'Plan Test', descripcion: 'desc', precio: 9.99, aprobado: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    createdPlanId = res.body.id;
  });

  test('Usuario normal NO puede crear plan', async () => {
    const res = await request(app)
      .post('/api/planes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ titulo: 'Plan Bad', precio: 5 });
    expect(res.statusCode).toBe(403);
  });

  test('Coach puede editar el plan', async () => {
    const res = await request(app)
      .put(`/api/planes/${createdPlanId}`)
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ titulo: 'Plan Test Editado' });
    expect(res.statusCode).toBe(200);
    expect(res.body.titulo).toBe('Plan Test Editado');
  });

  test('Otro coach NO puede editar plan creado por otro coach', async () => {
    const res = await request(app)
      .put(`/api/planes/${createdPlanId}`)
      .set('Authorization', `Bearer ${otherCoachToken}`)
      .send({ titulo: 'Intento Malicioso' });
    expect(res.statusCode).toBe(403);
  });

});
