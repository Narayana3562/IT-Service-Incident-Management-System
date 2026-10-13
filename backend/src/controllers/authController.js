import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AppError } from '../utils/errors.js';

function tokenFor(user) {
  return jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  });
}

export async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 100) throw new AppError(400, 'Name must be 2-100 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, 'Enter a valid email');
  if (password.length < 10 || password.length > 72) throw new AppError(400, 'Password must be 10-72 characters');

  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'employee')
     RETURNING id, name, email, role`,
    [name, email, hash]
  );
  const user = result.rows[0];
  res.status(201).json({ user, token: tokenFor(user) });
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const result = await query(
    'SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  const valid = user && user.is_active && await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError(401, 'Invalid email or password');

  const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ user: publicUser, token: tokenFor(publicUser) });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
