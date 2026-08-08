process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const SKIP = !process.env.DATABASE_URL;
const describeDb = SKIP ? describe.skip : describe;

describeDb('Books API (integration)', () => {
  const request = require('supertest');
  const { createApp } = require('../../src/app');
  const { cleanTables, seedMember, seedStaff, seedBook, TEST_PASSWORD, pool } = require('../helpers/db');

  const app = createApp({ enableRateLimit: false, enableCsrf: false });

  async function loginAs(agent, identifier) {
    await agent.post('/api/auth/login').send({ identifier, password: TEST_PASSWORD });
  }

  beforeEach(async () => {
    await cleanTables();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/books', () => {
    it('returns empty list when no books', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.books)).toBe(true);
    });

    it('returns seeded books', async () => {
      await seedBook();
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
      expect(res.body.data.books.length).toBeGreaterThan(0);
    });

    it('filters by search query', async () => {
      await seedBook({ isbn: '111', title: 'Unique Title XYZ', author: 'Author A' });
      await seedBook({ isbn: '222', title: 'Another Book', author: 'Author B' });
      const res = await request(app).get('/api/books?q=Unique');
      expect(res.status).toBe(200);
      expect(res.body.data.books.length).toBe(1);
      expect(res.body.data.books[0].title).toBe('Unique Title XYZ');
    });
  });

  describe('GET /api/books/:isbn', () => {
    it('returns 404 for unknown isbn', async () => {
      const res = await request(app).get('/api/books/nonexistent');
      expect(res.status).toBe(404);
    });

    it('returns book detail', async () => {
      await seedBook();
      const res = await request(app).get('/api/books/978-0-1234-5678-9');
      expect(res.status).toBe(200);
      expect(res.body.data.isbn).toBe('978-0-1234-5678-9');
    });
  });

  describe('POST /api/admin/books', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/admin/books').send({
        isbn: '999', title: 'T', author: 'A',
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 when patron tries to add book', async () => {
      await seedMember({ email_verified: true });
      const agent = request.agent(app);
      await loginAs(agent, 'STU001');
      const res = await agent.post('/api/admin/books').send({
        isbn: '999', title: 'T', author: 'A',
      });
      expect(res.status).toBe(403);
    });

    it('staff can add a book', async () => {
      await seedStaff();
      const agent = request.agent(app);
      await loginAs(agent, 'STAFF001');
      const res = await agent.post('/api/admin/books').send({
        isbn: '978-test-001',
        title: 'New Book',
        author: 'New Author',
        copies_total: 2,
      });
      expect(res.status).toBe(201);
      expect(res.body.data.isbn).toBe('978-test-001');
    });

    it('returns 400 for missing required fields', async () => {
      await seedStaff();
      const agent = request.agent(app);
      await loginAs(agent, 'STAFF001');
      const res = await agent.post('/api/admin/books').send({ title: 'No ISBN' });
      expect(res.status).toBe(400);
    });

    it('returns 409 for duplicate ISBN', async () => {
      await seedBook();
      await seedStaff();
      const agent = request.agent(app);
      await loginAs(agent, 'STAFF001');
      const res = await agent.post('/api/admin/books').send({
        isbn: '978-0-1234-5678-9',
        title: 'Dup',
        author: 'Dup Author',
      });
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/admin/books/:isbn', () => {
    it('staff can update a book', async () => {
      await seedBook();
      await seedStaff();
      const agent = request.agent(app);
      await loginAs(agent, 'STAFF001');
      const res = await agent.put('/api/admin/books/978-0-1234-5678-9').send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('returns 404 for non-existent book', async () => {
      await seedStaff();
      const agent = request.agent(app);
      await loginAs(agent, 'STAFF001');
      const res = await agent.put('/api/admin/books/nonexistent').send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/books/:isbn', () => {
    it('staff can delete a book with no loans', async () => {
      await seedBook();
      await seedStaff();
      const agent = request.agent(app);
      await loginAs(agent, 'STAFF001');
      const res = await agent.delete('/api/admin/books/978-0-1234-5678-9');
      expect(res.status).toBe(200);
      expect(res.body.data.isbn).toBe('978-0-1234-5678-9');
    });

    it('returns 404 for non-existent book', async () => {
      await seedStaff();
      const agent = request.agent(app);
      await loginAs(agent, 'STAFF001');
      const res = await agent.delete('/api/admin/books/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/books/:isbn/reserve', () => {
    it('returns 401 when not authenticated', async () => {
      await seedBook();
      const res = await request(app).post('/api/books/978-0-1234-5678-9/reserve');
      expect(res.status).toBe(401);
    });

    it('patron can reserve a book', async () => {
      await seedBook();
      await seedMember({ email_verified: true });
      const agent = request.agent(app);
      await loginAs(agent, 'STU001');
      const res = await agent.post('/api/books/978-0-1234-5678-9/reserve');
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
    });

    it('returns 409 on duplicate reservation', async () => {
      await seedBook();
      await seedMember({ email_verified: true });
      const agent = request.agent(app);
      await loginAs(agent, 'STU001');
      await agent.post('/api/books/978-0-1234-5678-9/reserve');
      const res = await agent.post('/api/books/978-0-1234-5678-9/reserve');
      expect(res.status).toBe(409);
    });
  });
});
