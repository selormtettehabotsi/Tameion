const {
  validate, registerSchema, bookSchema, bookUpdateSchema,
  memberUpdateSchema, checkoutSchema,
} = require('../../../src/middleware/validate');

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
