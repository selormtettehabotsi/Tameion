const { validate, registerSchema, bookSchema, checkoutSchema } = require('../../../src/middleware/validate');

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
