import request from 'supertest';
import app from '../app';

describe('Auth Endpoints', () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('debe fallar con email duplicado', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email ya registrado');
    });

    it('debe fallar con email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'invalid-email' });

      expect(res.status).toBe(400);
    });

    it('debe fallar con contraseña corta', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'new@example.com', password: '123' });

      expect(res.status).toBe(400);
    });

    it('debe fallar con nombre corto', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'new@example.com', name: 'A' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginUser = {
      email: `login${Date.now()}@example.com`,
      name: 'Login User',
      password: 'password123',
    };

    beforeAll(async () => {
      await request(app).post('/api/auth/register').send(loginUser);
    });

    it('debe hacer login correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginUser.email, password: loginUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(loginUser.email);
    });

    it('debe fallar con contraseña incorrecta', async () => {
      const failUser = {
        email: `fail${Date.now()}@example.com`,
        name: 'Fail User',
        password: 'correctpass123',
      };
      await request(app).post('/api/auth/register').send(failUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: failUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('debe fallar con email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `noexiste${Date.now()}@example.com`, password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });
  });
});

