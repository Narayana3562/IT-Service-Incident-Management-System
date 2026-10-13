# IT Service Incident Management System

A full-stack portfolio project for IBM Associate System Engineer placement preparation.

## Technology
- Frontend: React + Vite + Tailwind CSS v4
- Backend: Node.js, Express.js, JWT, bcrypt
- Database: PostgreSQL
- Testing: Node.js built-in test runner + Supertest
- API style: REST

## Features
- Register and log in with hashed passwords
- JWT-protected endpoints
- Role-based access: `employee`, `support`, `admin`
- Create, list, view, update, assign, and resolve incidents
- Search, status/priority filters, pagination
- Comments and incident audit history
- Dashboard summary and SLA overdue calculation
- PostgreSQL schema, seed script, and API tests

> This is a learning/portfolio project, not a production-certified ITSM product. Before production use, add refresh-token rotation, rate limiting, email verification, monitoring, stronger operational controls, and a security review.

## Requirements
Install Node.js LTS and PostgreSQL. Check:
```cmd
node --version
npm --version
psql --version
```

## 1. Create the database
Open `psql` as a PostgreSQL administrator:
```sql
CREATE USER incident_app WITH PASSWORD 'change_this_local_password';
CREATE DATABASE incident_db OWNER incident_app;
```
Run the schema from the project root:
```cmd
psql -U incident_app -d incident_db -f database\schema.sql
```
You may be prompted for the password. If `psql` is not on PATH, use the full path to `psql.exe` from your PostgreSQL `bin` folder.

## 2. Configure the backend and seed demo users
```cmd
cd backend
copy .env.example .env
npm install
```
Edit `backend\.env` and set `DATABASE_URL` and a long random `JWT_SECRET`. Example local URL:
`postgresql://incident_app:change_this_local_password@localhost:5432/incident_db`

Then create demo accounts using bcrypt-generated password hashes:
```cmd
node scripts/seed.js
```

## 3. Start the backend
```cmd
npm run dev
```
API health check: http://localhost:5000/api/health

## 4. Start the frontend (new CMD window)
From the project root:
```cmd
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in the terminal, usually http://localhost:5173.

## Demo accounts
The Node.js seed script creates:
- `admin@example.com`
- `support@example.com`
- `employee@example.com`

Password for all seeded demo accounts: `DemoPass123!`

**Local demo only:** change these credentials and never use them for a deployed system.

## API overview
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register employee account |
| POST | `/api/auth/login` | Public | Log in |
| GET | `/api/auth/me` | Authenticated | Current account |
| GET | `/api/incidents` | Authenticated | List/filter incidents |
| POST | `/api/incidents` | Authenticated | Create incident |
| GET | `/api/incidents/:id` | Authenticated | Incident details |
| PATCH | `/api/incidents/:id` | Support/Admin or owner for limited fields | Update incident |
| POST | `/api/incidents/:id/comments` | Authenticated | Add comment |
| POST | `/api/incidents/:id/assign` | Admin | Assign support user |
| GET | `/api/dashboard/stats` | Authenticated | Summary metrics |

### Example create request
```json
{
  "title": "VPN connection unavailable",
  "description": "The corporate VPN fails to connect.",
  "category": "Network",
  "priority": "high"
}
```

## Run tests
The tests use an isolated test database configured by `TEST_DATABASE_URL`. Create a separate test database and set this variable in `backend/.env`, then run:
```cmd
cd backend
npm test
```
Do not point tests at a database containing data you need. Tests reset the test schema.

## Folder structure
```text
IT-Service-Incident-Management-System/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/db.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── utils/
│   ├── tests/
│   ├── scripts/seed.js
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed.sql
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

## Troubleshooting
- `ECONNREFUSED`: make sure PostgreSQL is running and the port/user/password are correct.
- `password authentication failed`: update `DATABASE_URL` to match your PostgreSQL user.
- `relation does not exist`: run `database\schema.sql` against the intended database.
- CORS error: confirm frontend URL and `CLIENT_ORIGIN` match.
- `JWT_SECRET is required`: copy `.env.example` to `.env` and set a secret.
- Port already in use: change `PORT` in backend `.env`.

## Suggested GitHub description
A full-stack incident management application built with React, Express.js, and PostgreSQL, featuring JWT authentication, role-based access, incident workflows, SLA tracking, audit history, and API tests.
