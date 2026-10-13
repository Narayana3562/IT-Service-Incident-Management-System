import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();
process.env.JWT_SECRET ||= 'test_secret_that_is_at_least_32_characters_long';
const { default: app } = await import('../src/app.js');

test('GET /api/health returns service status', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});
