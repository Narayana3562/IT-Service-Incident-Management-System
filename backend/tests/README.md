# API test notes

`health.test.js` is a database-independent smoke test for the API health route.

For a stronger integration test suite, create a disposable test database and add tests for:
- Registration and login
- Missing/invalid JWTs
- Employee access boundaries
- Incident creation and validation
- Support status updates
- Admin-only assignment
- SLA deadline calculations
- Comment and history persistence

The application currently selects `TEST_DATABASE_URL` when `NODE_ENV=test`. To run the test process in test mode on Windows CMD:
```cmd
set NODE_ENV=test
npm test
```
Open a new CMD window to clear the variable, or run `set NODE_ENV=` after testing.
