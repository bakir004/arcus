# API architecture guide

Use this guide when adding or changing API code. Preserve the boundaries below rather than putting database or business logic in controllers.

## Modules and domain-driven development

Modules are mandatory. Structure the API using domain-driven development: each user-facing capability or business domain is a self-contained feature module under `apps/api/src/modules/<feature>/`. Do not build one global controllers/services folder or scatter a feature across unrelated top-level directories.

A feature should follow this structure:

```text
modules/<feature>/
├── dto/
│   ├── <feature-dto-1>.dto.ts
│   ├── <feature-dto-2>.dto.ts
│   └── <feature-dto-n>.dto.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
├── <feature>.entity.ts
├── <feature>.errors.ts
└── <feature>.module.ts
```

Add subdirectories only when the domain needs them. The module owns its controller, application service, repository, entity/model, DTOs, and domain errors. Keep feature-specific code inside the module; put genuinely cross-cutting concerns in `src/common/`.

Use this flow:

```text
HTTP request → controller → service → repository → database
HTTP response ← response DTO ← service
```

- **Controller:** routes, parameters, status codes, Swagger decorators, and DTO input/output. It should not contain queries or business rules.
- **Service:** use-case behavior, orchestration, and domain errors (for example, turn a missing record into a feature-specific not-found error).
- **Repository:** all Drizzle/database operations. Return application-shaped values and avoid leaking query construction into services.
- **DTOs:** validate input with `class-validator`, document it with Swagger decorators, and use separate response DTOs where the persistence shape should not be exposed.
- **Module:** wire the feature's providers and controllers.

## Application-wide conventions

Use Nest dependency injection. Access the database through the shared `DATABASE` provider and `DatabaseModule`; do not create ad-hoc database clients in features. Add schema changes to `src/database/schema.ts` and use Drizzle migrations rather than hand-editing production data.

Keep startup behavior in `main.ts`: configuration, global validation, versioning, CORS, filters, and documentation setup belong there. New global behavior should be deliberate and documented. Respect `API_PREFIX` and `API_VERSION`; do not hard-code a competing route prefix.

Throw Nest HTTP exceptions (or feature errors that map to them) and let `HttpExceptionFilter` produce the standard error shape. Do not return custom error formats from individual controllers.

Update the module, DTOs, OpenAPI decorators, tests, and migrations together when changing an endpoint or data model. Check existing imports and the active feature path before editing: the project may be migrating or have uncommitted work in progress.
