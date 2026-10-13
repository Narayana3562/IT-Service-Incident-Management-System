# IBM interview preparation

## 60-second project introduction
"I developed an IT Service Incident Management System using React, Node.js, Express.js, and PostgreSQL. Employees can raise IT incidents, while support engineers and administrators can track and update them. I implemented JWT-based authentication, role-based access control, incident prioritization, SLA deadlines, comments, and audit history. PostgreSQL stores the normalized data, and the Express API uses parameterized SQL queries. I also added API testing and documented the setup so the application can be reproduced locally."

## Architecture
1. React renders the user interface and sends HTTP requests.
2. Express routes map requests to controller functions.
3. Middleware validates JWTs and checks roles.
4. Controllers validate business inputs and call PostgreSQL using `pg`.
5. PostgreSQL constraints, foreign keys, and indexes enforce data integrity and improve common lookups.
6. JSON responses return to React, which updates the interface.

## Common questions and answer points

### Why did you choose PostgreSQL?
It is a relational database with transactions, constraints, joins, indexing, and strong data-integrity features. Incident data has clear relationships between users, tickets, comments, and history.

### Why hash passwords?
Passwords must not be stored as plaintext. bcrypt hashes them with a salt and a configurable work factor. The application compares a submitted password against the stored hash during login.

### What is JWT?
A signed token that lets the API verify a user's identity on protected requests without storing a server-side session for each request. A JWT is not encrypted by default, so secrets must not be placed in its payload.

### What is role-based access control?
Authorization rules based on roles. For example, an employee can see their own incidents, support users can process tickets, and admins can assign incidents.

### How do you prevent SQL injection?
Use parameterized queries with `$1`, `$2`, etc., instead of concatenating user input into SQL. Dynamic SQL fragments are selected from fixed, allow-listed conditions.

### What is an SLA?
A service-level agreement defines a target for response or resolution. This project calculates a due time based on incident priority and flags unresolved incidents whose deadline has passed.

### Why use a transaction?
When a workflow updates an incident and inserts its audit event, a transaction ensures both operations commit together or are rolled back together.

### What would you improve for production?
Add rate limiting, refresh-token rotation, password reset and email verification, structured logging, centralized monitoring, migrations, stronger integration tests, CSRF considerations if using cookies, deployment secrets management, and a formal security review.

### How would you scale it?
Add pagination and indexes first, then caching for read-heavy dashboards, background workers for notifications/SLA checks, connection-pool tuning, observability, and horizontal API replicas behind a load balancer.

## Be honest in interviews
Run the application yourself, understand the files, and describe only features you have tested. Explain the trade-offs and future improvements rather than claiming production readiness.
