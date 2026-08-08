const { z } = require('zod');

const registerSchema = z.object({
  knust_id: z.string().min(1, 'KNUST ID is required').max(30),
  full_name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email'),
  phone: z.string().max(20).optional().nullable(),
  user_type: z.enum(['student', 'faculty', 'postgraduate']),
  programme: z.string().max(200).optional().nullable(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

const checkoutSchema = z.object({
  book_isbn: z.string().min(1, 'Book ISBN is required'),
  member_knust_id: z.string().min(1, 'Member KNUST ID is required'),
  due_days: z.number().int().min(1).max(365).optional(),
});

// Artwork/avatars are rendered into <img src>, so only absolute https URLs are
// accepted — this keeps javascript: and data: payloads out of the database.
const httpsUrl = z
  .string()
  .max(500)
  .url('Must be a valid URL')
  .refine((v) => v.startsWith('https://'), 'Must be an https:// URL');

const bookSchema = z.object({
  isbn: z.string().min(1, 'ISBN is required').max(20),
  title: z.string().min(1, 'Title is required').max(300),
  author: z.string().min(1, 'Author is required').max(200),
  publisher: z.string().max(200).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  copies_total: z.number().int().min(1).optional(),
  shelf_location: z.string().max(50).optional().nullable(),
  cover_url: httpsUrl.optional().nullable(),
  branch_id: z.number().int().optional().nullable(),
});

const bookUpdateSchema = bookSchema.partial().omit({ isbn: true });

const memberUpdateSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional().nullable(),
  user_type: z.enum(['student', 'faculty', 'postgraduate']).optional(),
  programme: z.string().max(200).optional().nullable(),
  account_status: z.enum(['active', 'suspended']).optional(),
  avatar_url: httpsUrl.optional().nullable(),
});

const staffCreateSchema = z.object({
  knust_staff_id: z.string().min(1, 'Staff ID is required').max(30),
  full_name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['librarian', 'admin']).optional(),
  branch_id: z.number().int().optional().nullable(),
});

const branchSchema = z.object({
  branch_name: z.string().min(1, 'Branch name is required').max(200),
  college: z.string().min(1, 'College is required').max(200),
  location: z.string().max(300).optional().nullable(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map(e => e.message).join(', ');
      return res.status(400).json({ success: false, data: null, message });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  registerSchema, loginSchema, checkoutSchema,
  bookSchema, bookUpdateSchema, memberUpdateSchema, staffCreateSchema, branchSchema,
  validate,
};
