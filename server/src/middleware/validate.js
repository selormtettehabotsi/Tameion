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

/**
 * Profile picture upload.
 *
 * The client resizes the image to a small square and posts it as base64 in the
 * JSON body, so no multipart parser is needed. This schema only checks shape
 * and declared type — decodeAvatar() below verifies the bytes really are the
 * image they claim to be.
 */
const AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 512 * 1024;

const avatarUploadSchema = z.object({
  mime: z.enum(AVATAR_MIMES),
  // Base64 payload, optionally still wrapped in a data: URI prefix.
  data: z.string().min(1, 'Image data is required').max(1_400_000, 'Image is too large'),
});

/** Leading bytes that must be present for each accepted type. */
const MAGIC = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  'image/webp': (b) =>
    b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP',
};

/**
 * Turn a validated upload into a Buffer, or explain why it is not usable.
 *
 * Never trust the declared mime: a .exe renamed to .jpg, or an SVG (which can
 * carry script), would otherwise be stored and served back. Checking magic
 * bytes against the declared type rejects both.
 *
 * @returns {{ buffer: Buffer, mime: string } | { error: string }}
 */
function decodeAvatar({ data, mime }) {
  const base64 = data.includes(',') ? data.slice(data.indexOf(',') + 1) : data;

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64.replace(/\s/g, ''))) {
    return { error: 'Image data is not valid base64' };
  }

  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return { error: 'Image data is not valid base64' };
  }

  if (buffer.length === 0) return { error: 'Image is empty' };
  if (buffer.length > AVATAR_MAX_BYTES) {
    return { error: `Image must be ${Math.floor(AVATAR_MAX_BYTES / 1024)}KB or smaller` };
  }
  if (buffer.length < 12) return { error: 'Image is truncated' };

  const check = MAGIC[mime];
  if (!check || !check(buffer)) {
    return { error: 'File contents do not match the declared image type' };
  }

  return { buffer, mime };
}

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
  avatarUploadSchema, decodeAvatar, AVATAR_MIMES, AVATAR_MAX_BYTES,
  validate,
};
