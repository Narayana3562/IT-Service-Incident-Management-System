import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool, query } from '../src/config/db.js';

dotenv.config();

const demoPassword = 'DemoPass123!';
const passwordHash = await bcrypt.hash(demoPassword, 10);
const accounts = [
  ['Demo Admin', 'admin@example.com', 'admin'],
  ['Demo Support', 'support@example.com', 'support'],
  ['Demo Employee', 'employee@example.com', 'employee']
];

try {
  for (const [name, email, role] of accounts) {
    await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role, is_active = TRUE`,
      [name, email, passwordHash, role]
    );
  }
  console.log('Demo accounts seeded. Password for all: DemoPass123!');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
