process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const SKIP = !process.env.DATABASE_URL;
const describeDb = SKIP ? describe.skip : describe;

describeDb('Admin API (integration)', () => {
  const request = require('supertest');
  const { createApp } = require('../../src/app');
  const { cleanTables, seedMember, seedStaff, seedBook, TEST_PASSWORD, pool } = require('../helpers/db');

  const app = createApp({ enableRateLimit: false, enableCsrf: false });

  const COVER = 'https://images.example.org/effective-java.jpg';
  const AVATAR = 'https://images.example.org/portrait.jpg';

  /** Logged-in agent for the seeded librarian. */
  async function asStaff() {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ identifier: 'STAFF001', password: TEST_PASSWORD });
    return agent;
  }

  /** Logged-in agent for a seeded patron. */
  async function asPatron(knustId = 'STU001') {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ identifier: knustId, password: TEST_PASSWORD });
    return agent;
  }

  beforeEach(async () => {
    await cleanTables();
    await seedStaff();
  });

  afterAll(async () => {
    await pool.end();
  });

  // ── cover_url ────────────────────────────────────────────────────────

  describe('books.cover_url round-trip', () => {
    const newBook = {
      isbn: '978-0134685991',
      title: 'Effective Java',
      author: 'Joshua Bloch',
      copies_total: 3,
    };

    it('persists cover_url on create and returns it', async () => {
      const agent = await asStaff();
      const res = await agent.post('/api/admin/books').send({ ...newBook, cover_url: COVER });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cover_url).toBe(COVER);
    });

    it('exposes cover_url on the public book detail endpoint', async () => {
      const agent = await asStaff();
      await agent.post('/api/admin/books').send({ ...newBook, cover_url: COVER });

      const res = await request(app).get(`/api/books/${newBook.isbn}`);
      expect(res.status).toBe(200);
      expect(res.body.data.cover_url).toBe(COVER);
    });

    it('exposes cover_url on the public book list endpoint', async () => {
      const agent = await asStaff();
      await agent.post('/api/admin/books').send({ ...newBook, cover_url: COVER });

      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
      const row = res.body.data.books.find((b) => b.isbn === newBook.isbn);
      expect(row).toBeDefined();
      expect(row.cover_url).toBe(COVER);
    });

    it('defaults cover_url to null when omitted', async () => {
      const agent = await asStaff();
      const res = await agent.post('/api/admin/books').send(newBook);

      expect(res.status).toBe(201);
      expect(res.body.data.cover_url).toBeNull();
    });

    it('updates cover_url through PUT', async () => {
      const agent = await asStaff();
      await agent.post('/api/admin/books').send({ ...newBook, cover_url: COVER });

      const updated = 'https://images.example.org/new-artwork.jpg';
      const res = await agent.put(`/api/admin/books/${newBook.isbn}`).send({ cover_url: updated });

      expect(res.status).toBe(200);
      expect(res.body.data.cover_url).toBe(updated);

      const check = await request(app).get(`/api/books/${newBook.isbn}`);
      expect(check.body.data.cover_url).toBe(updated);
    });

    it('leaves cover_url untouched when PUT omits it', async () => {
      const agent = await asStaff();
      await agent.post('/api/admin/books').send({ ...newBook, cover_url: COVER });

      const res = await agent.put(`/api/admin/books/${newBook.isbn}`).send({ title: 'Effective Java, 3rd Ed' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Effective Java, 3rd Ed');
      expect(res.body.data.cover_url).toBe(COVER);
    });

    it.each([
      ['javascript:', 'javascript:alert(1)'],
      ['data:', 'data:text/html,<script>alert(1)</script>'],
      ['http://', 'http://images.example.org/cover.jpg'],
    ])('rejects a %s cover_url on create and stores nothing', async (_label, value) => {
      const agent = await asStaff();
      const res = await agent.post('/api/admin/books').send({ ...newBook, cover_url: value });

      expect(res.status).toBe(400);

      const stored = await pool.query('SELECT isbn FROM books WHERE isbn = $1', [newBook.isbn]);
      expect(stored.rows).toHaveLength(0);
    });

    it.each([
      ['javascript:', 'javascript:alert(1)'],
      ['data:', 'data:image/svg+xml;base64,PHN2Zy8+'],
      ['http://', 'http://images.example.org/cover.jpg'],
    ])('rejects a %s cover_url on update and leaves the old value', async (_label, value) => {
      const agent = await asStaff();
      await agent.post('/api/admin/books').send({ ...newBook, cover_url: COVER });

      const res = await agent.put(`/api/admin/books/${newBook.isbn}`).send({ cover_url: value });
      expect(res.status).toBe(400);

      const check = await request(app).get(`/api/books/${newBook.isbn}`);
      expect(check.body.data.cover_url).toBe(COVER);
    });
  });

  // ── avatar_url ───────────────────────────────────────────────────────

  describe('members.avatar_url round-trip', () => {
    it('persists avatar_url and returns it', async () => {
      const member = await seedMember();
      const agent = await asStaff();

      const res = await agent.put(`/api/admin/members/${member.id}`).send({ avatar_url: AVATAR });

      expect(res.status).toBe(200);
      expect(res.body.data.avatar_url).toBe(AVATAR);
    });

    it('exposes avatar_url on the members list', async () => {
      const member = await seedMember();
      const agent = await asStaff();
      await agent.put(`/api/admin/members/${member.id}`).send({ avatar_url: AVATAR });

      const res = await agent.get('/api/admin/members');
      expect(res.status).toBe(200);
      const row = res.body.data.members.find((m) => m.id === member.id);
      expect(row.avatar_url).toBe(AVATAR);
    });

    it('is null for a member who has never had one set', async () => {
      await seedMember();
      const agent = await asStaff();

      const res = await agent.get('/api/admin/members');
      expect(res.body.data.members[0].avatar_url).toBeNull();
    });

    it.each([
      ['javascript:', 'javascript:alert(1)'],
      ['data:', 'data:text/html,<script>alert(1)</script>'],
      ['http://', 'http://images.example.org/a.jpg'],
    ])('rejects a %s avatar_url and leaves the column null', async (_label, value) => {
      const member = await seedMember();
      const agent = await asStaff();

      const res = await agent.put(`/api/admin/members/${member.id}`).send({ avatar_url: value });
      expect(res.status).toBe(400);

      const stored = await pool.query('SELECT avatar_url FROM members WHERE id = $1', [member.id]);
      expect(stored.rows[0].avatar_url).toBeNull();
    });

    it('rejects an account_status outside the allowed enum', async () => {
      const member = await seedMember();
      const agent = await asStaff();

      const res = await agent.put(`/api/admin/members/${member.id}`).send({ account_status: 'inactive' });
      expect(res.status).toBe(400);
    });
  });

  // ── dashboard ────────────────────────────────────────────────────────

  describe('GET /api/admin/dashboard', () => {
    it('counts only active members in activeMembers', async () => {
      await seedMember({ knust_id: 'STU001', email: 'a@test.com' });
      await seedMember({ knust_id: 'STU002', email: 'b@test.com' });
      await seedMember({ knust_id: 'STU003', email: 'c@test.com', account_status: 'suspended' });

      const agent = await asStaff();
      const res = await agent.get('/api/admin/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.data.totalMembers).toBe(3);
      expect(res.body.data.activeMembers).toBe(2);
    });

    it('reports activeMembers as 0 when every member is suspended', async () => {
      await seedMember({ knust_id: 'STU001', email: 'a@test.com', account_status: 'suspended' });

      const agent = await asStaff();
      const res = await agent.get('/api/admin/dashboard');

      expect(res.body.data.totalMembers).toBe(1);
      expect(res.body.data.activeMembers).toBe(0);
    });

    it('tracks activeMembers as staff suspend and restore accounts', async () => {
      const member = await seedMember();
      const agent = await asStaff();

      expect((await agent.get('/api/admin/dashboard')).body.data.activeMembers).toBe(1);

      await agent.put(`/api/admin/members/${member.id}`).send({ account_status: 'suspended' });
      expect((await agent.get('/api/admin/dashboard')).body.data.activeMembers).toBe(0);

      await agent.put(`/api/admin/members/${member.id}`).send({ account_status: 'active' });
      expect((await agent.get('/api/admin/dashboard')).body.data.activeMembers).toBe(1);
    });

    it('returns the whole stat block the dashboard renders', async () => {
      await seedMember();
      await seedBook();
      const agent = await asStaff();

      const res = await agent.get('/api/admin/dashboard');
      expect(res.body.data).toMatchObject({
        totalMembers: expect.any(Number),
        activeMembers: expect.any(Number),
        totalBooks: expect.any(Number),
        totalCopies: expect.any(Number),
        activeLoans: expect.any(Number),
        overdueLoans: expect.any(Number),
        pendingReservations: expect.any(Number),
        totalFinesOutstanding: expect.any(Number),
      });
      expect(Array.isArray(res.body.data.booksByBranch)).toBe(true);
      expect(Array.isArray(res.body.data.recentLoans)).toBe(true);
    });
  });

  // ── role guards (ported from scripts/smoke.sh) ───────────────────────

  describe('role guards', () => {
    const staffOnly = [
      '/api/admin/dashboard',
      '/api/admin/members',
      '/api/admin/loans',
      '/api/admin/fines',
      '/api/admin/reservations',
      '/api/admin/staff',
      '/api/admin/branches',
      '/api/admin/audit-log',
      '/api/admin/reports',
    ];

    it.each(staffOnly)('%s returns 401 for anonymous callers', async (path) => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    });

    it.each(staffOnly)('%s returns 403 for a patron', async (path) => {
      await seedMember();
      const agent = await asPatron();
      const res = await agent.get(path);
      expect(res.status).toBe(403);
    });

    it.each(staffOnly)('%s returns 200 for staff', async (path) => {
      const agent = await asStaff();
      const res = await agent.get(path);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it.each(['/api/patron/dashboard', '/api/patron/loans', '/api/patron/fines', '/api/patron/reservations'])(
      '%s returns 403 for staff',
      async (path) => {
        const agent = await asStaff();
        const res = await agent.get(path);
        expect(res.status).toBe(403);
      },
    );
  });

  // ── proxy trust ──────────────────────────────────────────────────────

  describe('proxy trust', () => {
    // Both compose files run nginx in front of the server. Without
    // `trust proxy`, express-rate-limit keys every proxied request on the
    // nginx container's IP, so all users share one bucket, and req.ip in the
    // audit log records the proxy instead of the caller.
    it('trusts exactly one proxy hop by default', () => {
      expect(app.get('trust proxy')).toBe(1);
    });

    it('resolves req.ip from X-Forwarded-For when proxied', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', '203.0.113.7');
      expect(res.status).toBe(200);
    });

    it('gives two different forwarded clients independent rate-limit buckets', async () => {
      // A rate-limited app is needed here; the shared one disables limiting.
      const limited = createApp({ enableRateLimit: true, enableCsrf: false });

      const first = await request(limited).get('/api/health').set('X-Forwarded-For', '203.0.113.10');
      const second = await request(limited).get('/api/health').set('X-Forwarded-For', '203.0.113.11');

      // Each client should be on its own counter, so both see the same
      // remaining allowance rather than a shared, decrementing one.
      expect(first.headers['ratelimit-remaining']).toBe(second.headers['ratelimit-remaining']);
    });

    it('honours the TRUST_PROXY override', () => {
      const custom = createApp({ enableRateLimit: false, enableCsrf: false, trustProxy: 2 });
      expect(custom.get('trust proxy')).toBe(2);
    });
  });

  // ── circulation (ported from scripts/smoke.sh) ───────────────────────

  describe('checkout / renew / return', () => {
    it('completes a full loan lifecycle and adjusts copies_available', async () => {
      await seedMember();
      await seedBook({ isbn: '978-0131103627', copies_total: 2, copies_available: 2 });
      const agent = await asStaff();

      const checkout = await agent.post('/api/admin/loans/checkout').send({
        book_isbn: '978-0131103627',
        member_knust_id: 'STU001',
        due_days: 14,
      });
      expect(checkout.status).toBe(201);
      const loanId = checkout.body.data.id;

      let book = await pool.query('SELECT copies_available FROM books WHERE isbn = $1', ['978-0131103627']);
      expect(book.rows[0].copies_available).toBe(1);

      const renew = await agent.post(`/api/admin/loans/${loanId}/renew`).send({ days: 7 });
      expect(renew.status).toBe(200);

      const ret = await agent.post(`/api/admin/loans/${loanId}/return`).send();
      expect(ret.status).toBe(200);
      expect(ret.body.data.fineAmount).toBe(0);

      book = await pool.query('SELECT copies_available FROM books WHERE isbn = $1', ['978-0131103627']);
      expect(book.rows[0].copies_available).toBe(2);
    });

    it('rejects checkout of a book with no copies available', async () => {
      await seedMember();
      await seedBook({ isbn: '978-0000000001', copies_total: 1, copies_available: 0 });
      const agent = await asStaff();

      const res = await agent.post('/api/admin/loans/checkout').send({
        book_isbn: '978-0000000001',
        member_knust_id: 'STU001',
      });
      expect(res.status).toBe(409);
    });
  });
});
