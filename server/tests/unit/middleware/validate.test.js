const {
  validate, registerSchema, bookSchema, bookUpdateSchema,
  memberUpdateSchema, checkoutSchema, avatarUploadSchema, decodeAvatar,
} = require('../../../src/middleware/validate');

/** Minimal byte sequences carrying each format's magic number. */
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 1),
]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP'), Buffer.alloc(64, 1),
]);
const b64 = (buf) => buf.toString('base64');

function runValidate(schema, body) {
  const req = { body };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  validate(schema)(req, res, next);
  return { req, res, next };
}

describe('validate middleware', () => {
  describe('registerSchema', () => {
    const validPayload = {
      knust_id: 'STU001',
      full_name: 'John Doe',
      email: 'john@example.com',
      user_type: 'student',
      password: 'password123',
    };

    it('passes valid registration data', () => {
      const { next, res } = runValidate(registerSchema, validPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects missing knust_id', () => {
      const { next, res } = runValidate(registerSchema, { ...validPayload, knust_id: '' });
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid email', () => {
      const { next, res } = runValidate(registerSchema, { ...validPayload, email: 'bad' });
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects short password', () => {
      const { next, res } = runValidate(registerSchema, { ...validPayload, password: 'short' });
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid user_type', () => {
      const { next, res } = runValidate(registerSchema, { ...validPayload, user_type: 'admin' });
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('allows optional phone field', () => {
      const { next } = runValidate(registerSchema, { ...validPayload, phone: '0551234567' });
      expect(next).toHaveBeenCalled();
    });

    it('strips unknown fields', () => {
      const { req, next } = runValidate(registerSchema, { ...validPayload, extra: 'hacked' });
      expect(next).toHaveBeenCalled();
      expect(req.body.extra).toBeUndefined();
    });
  });

  describe('bookSchema', () => {
    const validBook = { isbn: '978-123', title: 'A Book', author: 'Someone' };

    it('passes valid book data', () => {
      const { next } = runValidate(bookSchema, validBook);
      expect(next).toHaveBeenCalled();
    });

    it('rejects missing isbn', () => {
      const { res } = runValidate(bookSchema, { title: 'A Book', author: 'Someone' });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects missing title', () => {
      const { res } = runValidate(bookSchema, { isbn: '123', author: 'Someone' });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('accepts optional fields', () => {
      const { next } = runValidate(bookSchema, {
        ...validBook, publisher: 'Pub', genre: 'Fiction', copies_total: 5,
      });
      expect(next).toHaveBeenCalled();
    });
  });

  // Image URLs are rendered straight into <img src>, so the shared httpsUrl
  // refinement must keep script-bearing and mixed-content schemes out of the
  // database. These run against every schema that accepts an image URL.
  describe('image URL validation', () => {
    const REJECTED = [
      ['javascript:', 'javascript:alert(1)'],
      ['javascript: with newline', 'java\nscript:alert(1)'],
      ['data: image', 'data:image/svg+xml;base64,PHN2Zy8+'],
      ['data: html', 'data:text/html,<script>alert(1)</script>'],
      ['http (mixed content)', 'http://example.com/cover.jpg'],
      ['protocol-relative', '//example.com/cover.jpg'],
      ['relative path', '/img/cover.jpg'],
      ['vbscript:', 'vbscript:msgbox(1)'],
      ['file:', 'file:///etc/passwd'],
      ['not a url', 'definitely not a url'],
    ];

    const ACCEPTED = [
      ['https', 'https://images.example.org/cover.jpg'],
      ['https with query', 'https://images.example.org/c.jpg?w=400&h=600'],
      ['https with port', 'https://images.example.org:8443/cover.jpg'],
    ];

    describe('bookSchema.cover_url', () => {
      const book = { isbn: '978-1', title: 'T', author: 'A' };

      it.each(REJECTED)('rejects %s', (_label, value) => {
        const { next, res } = runValidate(bookSchema, { ...book, cover_url: value });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it.each(ACCEPTED)('accepts %s', (_label, value) => {
        const { next, res } = runValidate(bookSchema, { ...book, cover_url: value });
        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('accepts an omitted cover_url', () => {
        const { next } = runValidate(bookSchema, book);
        expect(next).toHaveBeenCalled();
      });

      it('accepts an explicit null cover_url', () => {
        const { next } = runValidate(bookSchema, { ...book, cover_url: null });
        expect(next).toHaveBeenCalled();
      });

      it('rejects a cover_url longer than 500 characters', () => {
        const long = 'https://example.org/' + 'a'.repeat(500) + '.jpg';
        const { res } = runValidate(bookSchema, { ...book, cover_url: long });
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('bookUpdateSchema.cover_url', () => {
      it.each(REJECTED)('rejects %s', (_label, value) => {
        const { next, res } = runValidate(bookUpdateSchema, { cover_url: value });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('accepts an https cover_url on its own', () => {
        const { next } = runValidate(bookUpdateSchema, { cover_url: 'https://a.example/b.jpg' });
        expect(next).toHaveBeenCalled();
      });

      it('does not require isbn', () => {
        const { next } = runValidate(bookUpdateSchema, { title: 'New title' });
        expect(next).toHaveBeenCalled();
      });
    });

    describe('memberUpdateSchema.avatar_url', () => {
      it.each(REJECTED)('rejects %s', (_label, value) => {
        const { next, res } = runValidate(memberUpdateSchema, { avatar_url: value });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it.each(ACCEPTED)('accepts %s', (_label, value) => {
        const { next, res } = runValidate(memberUpdateSchema, { avatar_url: value });
        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('memberUpdateSchema', () => {
    it('accepts the statuses the admin UI offers', () => {
      for (const account_status of ['active', 'suspended']) {
        const { next } = runValidate(memberUpdateSchema, { account_status });
        expect(next).toHaveBeenCalled();
      }
    });

    it('rejects a status the UI must not offer', () => {
      const { res } = runValidate(memberUpdateSchema, { account_status: 'inactive' });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('accepts all three member types', () => {
      for (const user_type of ['student', 'postgraduate', 'faculty']) {
        const { next } = runValidate(memberUpdateSchema, { user_type });
        expect(next).toHaveBeenCalled();
      }
    });

    it('rejects an unknown member type', () => {
      const { res } = runValidate(memberUpdateSchema, { user_type: 'alumnus' });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('strips unknown fields so account_status cannot be smuggled in', () => {
      const { req, next } = runValidate(memberUpdateSchema, { full_name: 'A', password_hash: 'x' });
      expect(next).toHaveBeenCalled();
      expect(req.body.password_hash).toBeUndefined();
    });
  });

  // A profile picture is stored and served back to browsers, so the bytes must
  // really be the image type they claim. Trusting the declared mime would let a
  // renamed script or an SVG (which can carry JavaScript) through.
  describe('avatar upload', () => {
    describe('avatarUploadSchema', () => {
      it('accepts a well-formed JPEG payload', () => {
        const { next } = runValidate(avatarUploadSchema, { mime: 'image/jpeg', data: b64(JPEG) });
        expect(next).toHaveBeenCalled();
      });

      it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', (mime) => {
        const { next } = runValidate(avatarUploadSchema, { mime, data: b64(JPEG) });
        expect(next).toHaveBeenCalled();
      });

      it.each(['image/svg+xml', 'text/html', 'application/octet-stream', 'image/gif'])(
        'rejects the %s content type outright',
        (mime) => {
          const { res } = runValidate(avatarUploadSchema, { mime, data: b64(JPEG) });
          expect(res.status).toHaveBeenCalledWith(400);
        },
      );

      it('rejects an empty payload', () => {
        const { res } = runValidate(avatarUploadSchema, { mime: 'image/jpeg', data: '' });
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('rejects a payload beyond the base64 length cap', () => {
        const { res } = runValidate(avatarUploadSchema, { mime: 'image/jpeg', data: 'A'.repeat(1_400_001) });
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('decodeAvatar', () => {
      it.each([
        ['jpeg', 'image/jpeg', JPEG],
        ['png', 'image/png', PNG],
        ['webp', 'image/webp', WEBP],
      ])('accepts a real %s and returns its bytes', (_label, mime, buf) => {
        const out = decodeAvatar({ mime, data: b64(buf) });
        expect(out.error).toBeUndefined();
        expect(out.mime).toBe(mime);
        expect(Buffer.compare(out.buffer, buf)).toBe(0);
      });

      it('accepts a data: URI prefix, as the browser canvas produces', () => {
        const out = decodeAvatar({ mime: 'image/jpeg', data: `data:image/jpeg;base64,${b64(JPEG)}` });
        expect(out.error).toBeUndefined();
        expect(Buffer.compare(out.buffer, JPEG)).toBe(0);
      });

      it('rejects PNG bytes declared as JPEG', () => {
        const out = decodeAvatar({ mime: 'image/jpeg', data: b64(PNG) });
        expect(out.error).toMatch(/do not match/i);
      });

      it('rejects JPEG bytes declared as PNG', () => {
        const out = decodeAvatar({ mime: 'image/png', data: b64(JPEG) });
        expect(out.error).toMatch(/do not match/i);
      });

      it('rejects an SVG renamed as a JPEG', () => {
        const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        const out = decodeAvatar({ mime: 'image/jpeg', data: b64(svg) });
        expect(out.error).toMatch(/do not match/i);
      });

      it('rejects an HTML document renamed as an image', () => {
        const html = Buffer.from('<!doctype html><script>alert(1)</script>');
        const out = decodeAvatar({ mime: 'image/png', data: b64(html) });
        expect(out.error).toMatch(/do not match/i);
      });

      it('rejects a Windows executable renamed as an image', () => {
        const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64, 0)]);
        const out = decodeAvatar({ mime: 'image/jpeg', data: b64(exe) });
        expect(out.error).toMatch(/do not match/i);
      });

      it('rejects data that is not base64 at all', () => {
        const out = decodeAvatar({ mime: 'image/jpeg', data: 'not!!base64!!' });
        expect(out.error).toMatch(/base64/i);
      });

      it('rejects a truncated file too short to identify', () => {
        const out = decodeAvatar({ mime: 'image/jpeg', data: b64(Buffer.from([0xff, 0xd8])) });
        expect(out.error).toMatch(/truncated/i);
      });

      it('rejects an image over the 512KB cap', () => {
        const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(520 * 1024, 7)]);
        const out = decodeAvatar({ mime: 'image/jpeg', data: b64(big) });
        expect(out.error).toMatch(/512KB or smaller/);
      });

      it('accepts an image just under the cap', () => {
        const nearly = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(500 * 1024, 7)]);
        const out = decodeAvatar({ mime: 'image/jpeg', data: b64(nearly) });
        expect(out.error).toBeUndefined();
      });
    });
  });

  describe('checkoutSchema', () => {
    it('passes valid checkout data', () => {
      const { next } = runValidate(checkoutSchema, {
        book_isbn: '978-123', member_knust_id: 'STU001',
      });
      expect(next).toHaveBeenCalled();
    });

    it('rejects missing book_isbn', () => {
      const { res } = runValidate(checkoutSchema, { member_knust_id: 'STU001' });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects due_days out of range', () => {
      const { res } = runValidate(checkoutSchema, {
        book_isbn: '978-123', member_knust_id: 'STU001', due_days: 0,
      });
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
