const { requireAuth, requireRole, requirePatron, requireStaff } = require('../../../src/middleware/auth');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { session: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  describe('requireAuth', () => {
    it('returns 401 when no session user', () => {
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Not authenticated' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when session user exists', () => {
      req.session.user = { id: 1, role: 'student' };
      requireAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when session is null', () => {
      req.session = null;
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireRole', () => {
    it('returns 401 when no session user', () => {
      const middleware = requireRole('admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when role does not match', () => {
      req.session.user = { id: 1, role: 'student' };
      const middleware = requireRole('admin', 'librarian');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Forbidden: insufficient role' })
      );
    });

    it('calls next when role matches', () => {
      req.session.user = { id: 1, role: 'admin' };
      const middleware = requireRole('admin', 'librarian');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requirePatron', () => {
    it('allows student role', () => {
      req.session.user = { id: 1, role: 'student' };
      requirePatron(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows faculty role', () => {
      req.session.user = { id: 1, role: 'faculty' };
      requirePatron(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects librarian role', () => {
      req.session.user = { id: 1, role: 'librarian' };
      requirePatron(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireStaff', () => {
    it('allows librarian role', () => {
      req.session.user = { id: 1, role: 'librarian' };
      requireStaff(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows admin role', () => {
      req.session.user = { id: 1, role: 'admin' };
      requireStaff(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('rejects student role', () => {
      req.session.user = { id: 1, role: 'student' };
      requireStaff(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
