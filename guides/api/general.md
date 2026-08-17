# General API development guide

These instructions apply to every agent working in the API. Make the smallest coherent change, follow the module and domain conventions in `architecture.md`, and inspect existing code before introducing a new pattern.

## After making changes

Run formatting, linting, typechecking, and relevant tests before handing work off:

```bash
bun run format
bun run lint
bun run typecheck
bun run test
bun --cwd apps/api run test:e2e
```

Use the narrower API commands while iterating (`bun --cwd apps/api run ...`), then run the relevant repository-wide checks. If a check cannot run, explain why and report it rather than silently skipping it. Do not reformat unrelated files or overwrite existing work.

## Database

The PostgreSQL schema is defined in `apps/api/src/database/schema.ts`. The Drizzle client is in `apps/api/src/database/client.ts`, and configuration is in `apps/api/drizzle.config.ts`. Repositories should access the database through the shared `DatabaseModule` provider.

Start the local PostgreSQL container from the repository root:

```bash
bun run db
```

Database operations are API package scripts:

```bash
bun --cwd apps/api run db:generate  # generate migration files from schema changes
bun --cwd apps/api run db:migrate   # apply migrations
bun --cwd apps/api run db:push      # push schema directly during local development
bun --cwd apps/api run db:studio    # open Drizzle Studio
```

For committed schema changes, update `schema.ts`, generate and review the migration, and apply it through migrations. Use `db:push` only when appropriate for local iteration. Never assume a developer's local database contains safe or current data.

## Main technologies

- **Bun:** package manager, workspace runner, and development command runner.
- **TypeScript/NestJS:** application framework, dependency injection, modules, controllers, services, pipes, and testing utilities.
- **PostgreSQL + postgres.js:** relational database and connection driver.
- **Drizzle ORM/Drizzle Kit:** typed queries, schema definition, migrations, and database tooling. Keep queries in repositories.
- **class-validator and class-transformer:** request validation and DTO transformation through Nest's global validation pipe.
- **Zod:** use for runtime schemas where a Zod-based boundary or contract is appropriate; do not duplicate validation without a reason when class-validator already owns an HTTP DTO.
- **Swagger/OpenAPI and Scalar:** endpoint metadata and the API reference. Confirm changes render correctly at `/reference`.
- **Better Auth:** authentication, sessions, trusted origins, and auth OpenAPI integration.
- **Biome:** repository formatter and linter; use the configured scripts rather than introducing ESLint or Prettier configuration.
- **Socket.IO:** use Nest's supported WebSocket/Socket.IO integration for realtime features when one is added. Keep realtime functionality inside its feature module and document/test its events like HTTP endpoints. Do not add a second transport abstraction without a clear need.

Prefer existing workspace packages such as `@repo/contracts` for shared contracts when they are already the established boundary. Add dependencies only when the existing stack cannot reasonably support the requirement, and update the appropriate workspace package rather than installing at the repository root by default.
