process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const SKIP = !process.env.DATABASE_URL;
const describeDb = SKIP ? describe.skip : describe;

/**
 * CSRF behaviour, ported from scripts/smoke.sh so CI enforces it.
 *
 * The rest of the suite builds the app with enableCsrf: false; this file is the
 * one place that turns protection on, so the double-submit flow and the four
 * exempt auth paths are actually exercised.
 */
describeDb('CSRF protection (integration)', () => {
  const request = require('supertest');
  const { createApp } = require('../../src/app');
  const { cleanTables, seedMember, seedBook, TEST_PASSWORD, pool } = require('../helpers/db');

  const app = createApp({ enableRateLimit: false, enableCsrf: true });

  const ISBN = '978-0131103627';

  /** Log in and return the agent plus the token the client would store. */
  async function loginPatron() {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ identifier: 'STU001', password: TEST_PASSWORD });
    return { agent, token: res.body.data.csrfToken, loginStatus: res.status };
  }

  beforeEach(async () => {
    await cleanTables();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('exempt auth paths accept requests with no token', () => {
    // The key assertion is "not 403" — each should fail or succeed on its own
    // merits rather than being blocked by CSRF.
    it('POST /api/auth/login returns 401 on bad credentials, not 403', async () => {
      const res = await request(app).post('/api/auth/login').send({ identifier: 'nobody', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/login succeeds for a valid patron', async () => {
      await seedMember();
      const res = await request(app).post('/api/auth/login').send({ identifier: 'STU001', password: TEST_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.data.csrfToken).toEqual(expect.any(String));
    });

    it('POST /api/auth/forgot-password returns 200', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/reset-password returns 400 for a bad token, not 403', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({ token: 'bad', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/verify-email returns 400 for a bad token, not 403', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({ token: 'bad' });
      expect(res.status).toBe(400);
    });
  });

  describe('register is deliberately NOT exempt', () => {
    const payload = {
      knust_id: 'STU-NEW',
      full_name: 'New Patron',
      email: 'new@st.knust.edu.gh',
      user_type: 'student',
      password: 'password123',
    };

    it('rejects registration with no CSRF token', async () => {
      const res = await request(app).post('/api/auth/register').send(payload);
      expect(res.status).toBe(403);
    });

    it('accepts registration when a token is fetched first, as the client does', async () => {
      const agent = request.agent(app);

      // GET /auth/csrf-token returns the token as data.token (not data.csrfToken).
      const tokenRes = await agent.get('/api/auth/csrf-token');
      expect(tokenRes.status).toBe(200);
      const token = tokenRes.body.data.token;
      expect(token).toEqual(expect.any(String));

      const res = await agent.post('/api/auth/register').set('X-CSRF-Token', token).send(payload);
      expect(res.status).toBe(201);

      const stored = await pool.query('SELECT knust_id FROM members WHERE knust_id = $1', [payload.knust_id]);
      expect(stored.rows).toHaveLength(1);
    });

    it('rejects registration that carries the wrong token', async () => {
      const agent = request.agent(app);
      await agent.get('/api/auth/csrf-token');

      const res = await agent.post('/api/auth/register').set('X-CSRF-Token', 'deadbeef').send(payload);
      expect(res.status).toBe(403);
    });
  });

  describe('protected routers require the token on state-changing verbs', () => {
    beforeEach(async () => {
      await seedMember();
      await seedBook({ isbn: ISBN });
    });

    it('rejects a reservation with no token', async () => {
      const { agent } = await loginPatron();
      const res = await agent.post(`/api/books/${ISBN}/reserve`).send();
      expect(res.status).toBe(403);
    });

    it('rejects a reservation with the wrong token', async () => {
      const { agent } = await loginPatron();
      const res = await agent.post(`/api/books/${ISBN}/reserve`).set('X-CSRF-Token', 'deadbeef').send();
      expect(res.status).toBe(403);
    });

    it('accepts a reservation carrying the token from the login response', async () => {
      const { agent, token } = await loginPatron();
      const res = await agent.post(`/api/books/${ISBN}/reserve`).set('X-CSRF-Token', token).send();
      expect(res.status).toBe(201);
    });

    it('stores nothing when the token is missing', async () => {
      const { agent } = await loginPatron();
      await agent.post(`/api/books/${ISBN}/reserve`).send();

      const rows = await pool.query('SELECT id FROM reservations');
      expect(rows.rows).toHaveLength(0);
    });

    it('does not require a token for GET requests', async () => {
      const { agent } = await loginPatron();
      for (const path of ['/api/auth/me', '/api/patron/dashboard', '/api/patron/loans', '/api/books']) {
        const res = await agent.get(path);
        expect(res.status).toBe(200);
      }
    });

    it('issues a fresh token on login rather than reusing the anonymous one', async () => {
      const agent = request.agent(app);
      const anon = (await agent.get('/api/auth/csrf-token')).body.data.token;
      const login = await agent.post('/api/auth/login').send({ identifier: 'STU001', password: TEST_PASSWORD });

      expect(login.status).toBe(200);
      expect(login.body.data.csrfToken).toEqual(expect.any(String));
      expect(login.body.data.csrfToken).not.toBe(anon);
    });

    it('surfaces the same token from /auth/me that login issued', async () => {
      const { agent, token } = await loginPatron();
      const me = await agent.get('/api/auth/me');
      expect(me.status).toBe(200);
      expect(me.body.data.csrfToken).toBe(token);
    });
  });
});
