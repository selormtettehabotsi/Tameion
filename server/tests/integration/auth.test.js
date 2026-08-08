process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const SKIP = !process.env.DATABASE_URL;
const describeDb = SKIP ? describe.skip : describe;

describeDb('Auth API (integration)', () => {
  const request = require('supertest');
  const { createApp } = require('../../src/app');
  const { cleanTables, seedMember, seedStaff, TEST_PASSWORD, pool } = require('../helpers/db');

  const app = createApp({ enableRateLimit: false, enableCsrf: false });

  beforeEach(async () => {
    await cleanTables();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/health', () => {
    it('returns 200 with success', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 when credentials missing', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for unknown user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'NOBODY', password: 'whatever' });
      expect(res.status).toBe(401);
    });

    it('returns 401 for wrong password', async () => {
      await seedMember();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'STU001', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('logs in a verified member successfully', async () => {
      await seedMember({ email_verified: true });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'STU001', password: TEST_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ role: 'student', isStaff: false });
      expect(res.body.data.csrfToken).toBeDefined();
    });

    it('logs in a staff member successfully', async () => {
      await seedStaff();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'STAFF001', password: TEST_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ role: 'librarian', isStaff: true });
    });

    it('returns 403 for suspended member', async () => {
      await seedMember({ account_status: 'suspended' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'STU001', password: TEST_PASSWORD });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when not logged in', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns session user after login', async () => {
      await seedMember({ email_verified: true });
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ identifier: 'STU001', password: TEST_PASSWORD });
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('student');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('destroys session', async () => {
      await seedMember({ email_verified: true });
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ identifier: 'STU001', password: TEST_PASSWORD });
      const logout = await agent.post('/api/auth/logout');
      expect(logout.status).toBe(200);
      const me = await agent.get('/api/auth/me');
      expect(me.status).toBe(401);
    });
  });
  describe('POST /api/auth/register', () => {
    it('returns 400 for invalid payload', async () => {
      const res = await request(app).post('/api/auth/register').send({ knust_id: '' });
      expect(res.status).toBe(400);
    });

    it('registers a new member', async () => {
      const res = await request(app).post('/api/auth/register').send({
        knust_id: 'STU999',
        full_name: 'New User',
        email: 'new@test.com',
        user_type: 'student',
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.knust_id).toBe('STU999');
    });

    it('returns 409 for duplicate knust_id', async () => {
      await seedMember();
      const res = await request(app).post('/api/auth/register').send({
        knust_id: 'STU001',
        full_name: 'Dup User',
        email: 'dup@test.com',
        user_type: 'student',
        password: 'password123',
      });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('returns 400 when token missing', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalidtoken' });
      expect(res.status).toBe(400);
    });

    it('verifies email with valid token', async () => {
      const token = 'a'.repeat(64);
      await pool.query(
        `INSERT INTO members (knust_id, full_name, email, user_type, password_hash, email_token, email_token_expires)
         VALUES ('VER001', 'Verify User', 'verify@test.com', 'student', 'hash', $1, NOW() + INTERVAL '1 hour')`,
        [token]
      );
      const res = await request(app).post('/api/auth/verify-email').send({ token });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
