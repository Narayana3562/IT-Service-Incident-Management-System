import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AppError, asyncHandler } from '../utils/errors.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }

  const result = await query(
    'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
    [payload.sub]
  );
  const user = result.rows[0];
  if (!user || !user.is_active) throw new AppError(401, 'Account unavailable');
  req.user = user;
  next();
});

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}
