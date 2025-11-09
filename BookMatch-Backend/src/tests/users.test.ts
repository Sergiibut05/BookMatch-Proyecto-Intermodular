import request from 'supertest';
import app from '../app';

describe('Users Endpoints', () => {
  let authToken: string;
  let userId: number;
  
  const testUser = {
    email: `testuser${Date.now()}@example.com`,
    name: 'Test User',
    password: 'password123',
  };

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  describe('GET /api/users', () => {
    it('debe listar usuarios con autenticación', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('No autorizado');
    });

    it('debe fallar con token inválido', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token inválido');
    });
  });

  describe('GET /api/users/me', () => {
    it('debe obtener perfil del usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('debe actualizar perfil propio', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(401);
    });

    it('debe fallar con email inválido', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/users/me/password', () => {
    it('debe cambiar contraseña correctamente', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          currentPassword: 'password123', 
          newPassword: 'newpassword456' 
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Contraseña actualizada correctamente');

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'newpassword456' });

      expect(loginRes.status).toBe(200);
    });

    it('debe fallar con contraseña actual incorrecta', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          currentPassword: 'wrongpassword', 
          newPassword: 'newpassword789' 
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Contraseña actual incorrecta');
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .send({ 
          currentPassword: 'password123', 
          newPassword: 'newpassword456' 
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('debe obtener usuario por ID', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
    });

    it('debe fallar con ID inexistente', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});

