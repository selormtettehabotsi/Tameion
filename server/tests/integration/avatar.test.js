process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

const SKIP = !process.env.DATABASE_URL;
const describeDb = SKIP ? describe.skip : describe;

/**
 * Profile pictures. Any signed-in account manages its own through
 * /api/auth/avatar; staff read member pictures via the admin route.
 */
describeDb('Profile pictures (integration)', () => {
  const request = require('supertest');
  const { createApp } = require('../../src/app');
  const { cleanTables, seedMember, seedStaff, TEST_PASSWORD, pool } = require('../helpers/db');

  const app = createApp({ enableRateLimit: false, enableCsrf: false });

  const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(256, 9)]);
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(256, 9),
  ]);
  const b64 = (buf) => buf.toString('base64');

  async function login(identifier) {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ identifier, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    return agent;
  }

  beforeEach(async () => {
    await cleanTables();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('a patron manages their own picture', () => {
    it('reports no picture before one is uploaded', async () => {
      await seedMember();
      const agent = await login('STU001');

      const me = await agent.get('/api/auth/me');
      expect(me.body.data.hasAvatar).toBe(false);

      const img = await agent.get('/api/auth/avatar');
      expect(img.status).toBe(404);
    });

    it('stores an upload and serves it back with the right content type', async () => {
      await seedMember();
      const agent = await login('STU001');

      const up = await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });
      expect(up.status).toBe(200);
      expect(up.body.data.hasAvatar).toBe(true);
      expect(up.body.data.bytes).toBe(JPEG.length);

      const img = await agent.get('/api/auth/avatar');
      expect(img.status).toBe(200);
      expect(img.headers['content-type']).toContain('image/jpeg');
      expect(Buffer.compare(img.body, JPEG)).toBe(0);
    });

    it('never lets a picture be cached by a shared proxy', async () => {
      await seedMember();
      const agent = await login('STU001');
      await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });

      const img = await agent.get('/api/auth/avatar');
      expect(img.headers['cache-control']).toContain('private');
    });

    it('reflects the upload in /auth/me straight away', async () => {
      await seedMember();
      const agent = await login('STU001');
      await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });

      const me = await agent.get('/api/auth/me');
      expect(me.body.data.hasAvatar).toBe(true);
    });

    it('replaces an existing picture', async () => {
      await seedMember();
      const agent = await login('STU001');

      await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });
      await agent.post('/api/auth/avatar').send({ mime: 'image/png', data: b64(PNG) });

      const img = await agent.get('/api/auth/avatar');
      expect(img.headers['content-type']).toContain('image/png');
      expect(Buffer.compare(img.body, PNG)).toBe(0);
    });

    it('removes a picture and falls back to no picture', async () => {
      await seedMember();
      const agent = await login('STU001');
      await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });

      const del = await agent.delete('/api/auth/avatar');
      expect(del.status).toBe(200);
      expect(del.body.data.hasAvatar).toBe(false);

      expect((await agent.get('/api/auth/avatar')).status).toBe(404);
      expect((await agent.get('/api/auth/me')).body.data.hasAvatar).toBe(false);
    });

    it('accepts a browser-style data: URI payload', async () => {
      await seedMember();
      const agent = await login('STU001');

      const up = await agent
        .post('/api/auth/avatar')
        .send({ mime: 'image/jpeg', data: `data:image/jpeg;base64,${b64(JPEG)}` });

      expect(up.status).toBe(200);
      const img = await agent.get('/api/auth/avatar');
      expect(Buffer.compare(img.body, JPEG)).toBe(0);
    });
  });

  describe('staff manage their own picture through the same routes', () => {
    it('stores and serves a staff picture', async () => {
      await seedStaff();
      const agent = await login('STAFF001');

      const up = await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });
      expect(up.status).toBe(200);

      const img = await agent.get('/api/auth/avatar');
      expect(img.status).toBe(200);
      expect(Buffer.compare(img.body, JPEG)).toBe(0);
    });

    it('writes a staff picture to the staff row, not a member row', async () => {
      const member = await seedMember();
      await seedStaff();
      const agent = await login('STAFF001');
      await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });

      const staffRow = await pool.query('SELECT avatar_data FROM staff WHERE knust_staff_id = $1', ['STAFF001']);
      const memberRow = await pool.query('SELECT avatar_data FROM members WHERE id = $1', [member.id]);

      expect(staffRow.rows[0].avatar_data).not.toBeNull();
      expect(memberRow.rows[0].avatar_data).toBeNull();
    });
  });

  describe('rejects anything that is not really an image', () => {
    it.each([
      ['an SVG carrying script', 'image/jpeg', Buffer.from('<svg><script>alert(1)</script></svg>')],
      ['an HTML document', 'image/png', Buffer.from('<!doctype html><script>alert(1)</script>')],
      ['a Windows executable', 'image/jpeg', Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64)])],
      ['PNG bytes declared as JPEG', 'image/jpeg', Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64),
      ])],
    ])('rejects %s and stores nothing', async (_label, mime, buf) => {
      const member = await seedMember();
      const agent = await login('STU001');

      const res = await agent.post('/api/auth/avatar').send({ mime, data: b64(buf) });
      expect(res.status).toBe(400);

      const row = await pool.query('SELECT avatar_data FROM members WHERE id = $1', [member.id]);
      expect(row.rows[0].avatar_data).toBeNull();
    });

    it('rejects a disallowed content type such as image/svg+xml', async () => {
      await seedMember();
      const agent = await login('STU001');

      const res = await agent
        .post('/api/auth/avatar')
        .send({ mime: 'image/svg+xml', data: b64(Buffer.from('<svg/>')) });
      expect(res.status).toBe(400);
    });

    it('rejects an image over the size cap', async () => {
      await seedMember();
      const agent = await login('STU001');

      const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(600 * 1024, 3)]);
      const res = await agent.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(big) });
      expect(res.status).toBe(400);
    });
  });

  describe('access control', () => {
    it('requires authentication to read, upload or delete', async () => {
      expect((await request(app).get('/api/auth/avatar')).status).toBe(401);
      expect((await request(app).post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) })).status).toBe(401);
      expect((await request(app).delete('/api/auth/avatar')).status).toBe(401);
    });

    it('lets staff read a member picture through the admin route', async () => {
      const member = await seedMember();
      await seedStaff();

      const patron = await login('STU001');
      await patron.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });

      const staff = await login('STAFF001');
      const img = await staff.get(`/api/admin/members/${member.id}/avatar`);
      expect(img.status).toBe(200);
      expect(Buffer.compare(img.body, JPEG)).toBe(0);
    });

    it('does not let a patron read another member picture through the admin route', async () => {
      const other = await seedMember({ knust_id: 'STU002', email: 'other@test.com' });
      await seedMember();
      const patron = await login('STU001');

      const res = await patron.get(`/api/admin/members/${other.id}/avatar`);
      expect(res.status).toBe(403);
    });

    it('returns 404 for a member who has no picture', async () => {
      const member = await seedMember();
      await seedStaff();
      const staff = await login('STAFF001');

      const res = await staff.get(`/api/admin/members/${member.id}/avatar`);
      expect(res.status).toBe(404);
    });
  });

  describe('member payloads never leak raw image bytes', () => {
    it('exposes has_avatar rather than avatar_data on the members list', async () => {
      await seedMember();
      await seedStaff();
      const patron = await login('STU001');
      await patron.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });

      const staff = await login('STAFF001');
      const res = await staff.get('/api/admin/members');

      expect(res.status).toBe(200);
      const row = res.body.data.members[0];
      expect(row.has_avatar).toBe(true);
      expect(row.avatar_data).toBeUndefined();
    });

    it('omits avatar_data from the member detail payload', async () => {
      const member = await seedMember();
      await seedStaff();
      const patron = await login('STU001');
      await patron.post('/api/auth/avatar').send({ mime: 'image/jpeg', data: b64(JPEG) });

      const staff = await login('STAFF001');
      const res = await staff.get(`/api/admin/members/${member.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.avatar_data).toBeUndefined();
      expect(res.body.data.has_avatar).toBe(true);
      expect(res.body.data.password_hash).toBeUndefined();
    });
  });
});
