# Testing Guide

This repository uses Jest for API unit, integration, and HTTP end-to-end tests. The API lives in `apps/api`.

## Test layout

Place tests alongside the feature's test namespace:

```text
apps/api/test/
  authz/
  common/
  modules/
    courses/courses/
    exams/exams/
  helpers/
```

Recommended test split for a module:

- `dto/<module>.dto.spec.ts` — class-validator input constraints and partial update DTOs.
- `<module>.entity.spec.ts` — Zod parsing, normalization, and invalid data.
- `<module>.errors.spec.ts` — exception status codes and messages.
- `<module>.repository.spec.ts` — repository behavior with a mocked Drizzle database.
- `<module>.repository.integration.spec.ts` — repository behavior against isolated PostgreSQL.
- `<module>.service.spec.ts` — validation, delegation, and error propagation.
- `<module>.controller.spec.ts` — direct controller behavior and response serialization.
- `<module>.e2e-spec.ts` — HTTP requests through a real Nest module.

Keep tests focused on one layer. Unit tests should be fast and deterministic; database and HTTP tests should verify integration boundaries that mocks cannot prove.

## Commands

Run commands from `new/apps/api`:

```bash
bun run test -- --runInBand test/modules/courses/courses
bun run test -- --runInBand test/authz test/common
bun run test:e2e -- --runInBand test/modules/courses/courses/courses.e2e-spec.ts
bun run test:cov -- --runInBand
bun run typecheck
bunx biome lint test/modules/courses/courses
```

Use `--runInBand` because integration suites create databases and the project Jest configuration uses one worker. Run the focused suite while developing, then run the complete suite and coverage before finishing.

The normal Jest configuration is in `apps/api/package.json`. The e2e configuration is `apps/api/test/jest-e2e.json`.

## Coverage configuration

Coverage is collected from production TypeScript files through `collectCoverageFrom`. The entire database folder is intentionally excluded:

```json
"!src/database/**"
```

Do not add coverage thresholds. Coverage should guide missing tests, not make unrelated modules prevent a focused test run.

Coverage is measured by behavior, not by merely importing files. Aim for complete statements, functions, and lines, and cover meaningful branches. Some branch counts can come from TypeScript decorator and enum metadata instrumentation; document those residual non-actionable branches rather than writing artificial tests.

## Unit tests

### DTOs

Use `plainToInstance` and `validate`:

```ts
const errors = await validate(plainToInstance(CreateCourseDto, payload));
expect(errors).toEqual([]);
```

Cover:

- valid complete payloads;
- missing required fields;
- wrong types;
- minimum and maximum boundaries;
- `null` versus `undefined` for optional and required fields;
- invalid enum or UUID values;
- unknown-property behavior when exercised through Nest's `ValidationPipe`;
- empty and partially populated update DTOs.

Use table-driven tests (`it.each`) for validation boundaries.

### Entities

Test Zod schemas directly. Verify both rejection and normalization, for example:

- trimmed names/codes;
- empty optional strings becoming `null` when the schema defines that behavior;
- `nullish` fields;
- UUID and date coercion;
- invalid persisted, create, and update values.

### Repositories

Mock the Drizzle query chain and test repository behavior rather than implementation details alone. Cover:

- successful create, list, lookup, update, and delete;
- empty `returning()` results mapped to the appropriate not-found/creation exception;
- database errors propagated unchanged;
- ordering and lookup-by-code behavior;
- all scoping predicates, especially IDs belonging to a different course/user.

Integration tests should verify the same behavior against real PostgreSQL so that SQL joins, constraints, enum types, and generated IDs are exercised.

### Services

Mock the repository and verify:

- input is parsed through the create/update Zod schema;
- normalized data is passed to the repository;
- repository methods receive the correct IDs and arguments;
- validation errors prevent repository calls;
- repository errors propagate.

### Controllers

Mock services for direct controller tests. Test:

- every route method;
- ISO serialization of dates;
- request/session user IDs passed to services;
- successful empty-list and no-content responses;
- service exceptions propagated;
- `/me` authenticated and anonymous behavior.

For endpoints that use `@Res()`, provide a response mock with methods such as `status` and `json`, and assert that anonymous responses call:

```ts
response.status(200).json(null);
```

## PostgreSQL integration harness

`apps/api/test/helpers/test-database.ts` provides `openExamTestDatabase()`. It creates a uniquely named disposable PostgreSQL database, applies the current TypeScript schema through `drizzle-kit push`, and drops the database during cleanup. The helper is shared by course, exam, and authz integration/e2e tests.

The harness expects:

```text
TEST_DATABASE_URL=postgres://user:password@host:5432/test_database
```

If unset, it uses the local default:

```text
postgres://arcus:arcus@localhost:5432/arcus_test
```

The configured test URL must not equal `DATABASE_URL`. The database user must be allowed to create and drop databases. `drizzle-kit push` is invoked with the temporary database URL and the existing `src/database/schema.ts`, so schema changes are picked up automatically instead of requiring test-only table DDL. Tests should always use `try/finally`:

```ts
const testDb = await openExamTestDatabase();
try {
    // seed and exercise the repository
} finally {
    await testDb.close();
}
```

Use unique IDs and database names so suites cannot collide. Seed only the rows needed by the test. When adding a new feature that needs more schema, extend the helper carefully, including foreign keys, enum types, and authorization tables. Keep the helper cleanup-safe if setup fails.

The helper uses the current TypeScript schema through Drizzle tooling rather than duplicating table definitions. This keeps integration tests aligned with application schema changes. It does not replace migration testing: if migration drift becomes important, add a separate migration-based harness that applies the checked-in migration history.

## HTTP e2e harness

E2e tests should use the real feature module, service, repository, database, and authorization guard whenever practical. Do not replace the service with a mock and call that full e2e coverage.

The current Jest/CommonJS setup cannot load Better Auth's ESM session decorator directly. E2e tests therefore use a narrow mock only for the `Session` parameter decorator and test middleware to attach a session to the request. This is the boundary substitute:

- real `PermissionsGuard` remains enabled;
- real `AuthzService` and `AuthzRepository` query PostgreSQL;
- real feature service and repository persist data;
- middleware supplies the authenticated session that Better Auth would normally attach.

E2e setup should:

1. open an isolated database;
2. seed users, courses, memberships, roles, and permissions;
3. create a Nest testing module with the real feature module;
4. attach the narrow session middleware;
5. configure `ValidationPipe` and the project exception filter;
6. issue requests through `supertest`;
7. close the Nest app and drop the database in `afterAll`.

Cover each route with:

- anonymous request (`401` where authentication is required);
- authenticated user without permission (`403`);
- authenticated authorized request;
- malformed UUIDs (`400`);
- invalid DTO payloads (`400`);
- not-found resources (`404`);
- persistence and response serialization;
- wrong-course or wrong-scope access;
- unexpected service/database failures where the harness can trigger them.

For optional `/me` endpoints, verify that an anonymous request returns HTTP `200` with a JSON `null` body, not an empty body. Verify authenticated responses include the expected user, session, roles, and permissions.

## Authentication and authorization tests

Test authentication and authorization separately:

- authentication answers whether a session exists;
- authorization answers whether the session has the required permission in the requested scope.

For `PermissionsGuard`, cover:

- no `@RequirePermission` metadata returns `true`;
- missing or null session returns `UnauthorizedException`;
- missing, malformed, or non-UUID route scope IDs return `BadRequestException`;
- no granted permissions returns `ForbiddenException`;
- successful authorization attaches `request.authz` and returns `true`;
- repository/service errors propagate.

For authorization repositories, cover course and faculty scope behavior, empty requested permissions, duplicate permissions, sorted role/permission context results, user/course scoping, and database error propagation.

## Reliability checklist

Before finishing a test change:

- use `try/finally` for every disposable database;
- avoid fixed timestamps when comparing values generated with `new Date()`;
- do not depend on test order;
- use `--runInBand` for database suites;
- do not leave generated coverage, artifacts, or temporary files tracked;
- run focused tests, e2e tests, full coverage, typecheck, and targeted lint;
- report environmental limitations such as missing PostgreSQL or pre-existing lint failures;
- do not change production behavior merely to make a test pass.
