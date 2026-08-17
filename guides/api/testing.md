# API testing guide

Tests should protect the public contract and the boundaries between controllers, services, repositories, and the database. Add or update tests whenever behavior, validation, status codes, error handling, or schema changes.

## Test levels

### Unit tests

Unit-test services and other logic without a real database. Mock the repository at the service boundary and cover:

- successful create, read, update, and delete behavior;
- missing-record behavior and the feature-specific error;
- optional fields and partial updates;
- repository failures when the service has special handling for them.

Repository tests should focus on query behavior and mapping when that behavior is non-trivial. Keep unit tests deterministic and independent of environment state.

### HTTP / E2E tests

Use Nest's testing utilities and Supertest for HTTP behavior. Exercise the application through its public routes rather than calling controller methods directly. Cover the configured global prefix/version, request validation, response bodies, status codes, not-found errors, and the standard error shape.

Use a dedicated test database or controlled test doubles for persistence. Do not make tests depend on a developer's local data. Reset or isolate records between tests, and always close the Nest application and database resources.

## What to assert

Assert observable behavior, not private implementation details. A useful resource suite normally includes:

- list returns the expected collection shape;
- get returns a record and returns the standard 404 for an unknown ID;
- create accepts valid input and rejects missing, invalid, or overlong fields;
- update supports partial input and rejects invalid fields;
- delete returns 204 and subsequent access returns 404;
- unexpected/database failures map to the documented error response.

Use stable assertions for generated IDs and timestamps: validate their type/format rather than hard-coding values.

## Running checks

From the repository root, use the API package scripts:

```bash
bun --cwd apps/api test
bun --cwd apps/api run test:e2e
bun --cwd apps/api run test:cov
bun --cwd apps/api run typecheck
bun --cwd apps/api run lint
```

Run the narrowest relevant test while developing, then run the full API checks before handing work to another agent. If a check requires PostgreSQL, start the repository's database service and state that prerequisite clearly.

Keep tests aligned with the active source layout and route contract. If a test references a removed root endpoint or an old module path, update the test as part of the refactor instead of preserving obsolete behavior solely to satisfy it.
