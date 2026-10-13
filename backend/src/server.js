import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be configured and at least 32 characters long.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const { default: app } = await import('./app.js');
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Incident API listening on http://localhost:${port}`));
