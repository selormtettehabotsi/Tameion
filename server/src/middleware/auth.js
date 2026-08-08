function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, data: null, message: 'Not authenticated' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, data: null, message: 'Not authenticated' });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ success: false, data: null, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

const requirePatron = requireRole('student', 'faculty', 'postgraduate');
const requireStaff = requireRole('librarian', 'admin');

module.exports = { requireAuth, requireRole, requirePatron, requireStaff };
