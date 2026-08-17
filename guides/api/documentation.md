# API documentation guide

Documentation is part of the API contract. When changing a route, update the implementation, DTO metadata, OpenAPI metadata, and tests in the same change. Make sure the resulting documentation is complete and displays nicely in Scalar at `/reference`.

## Document routes at the controller

Use Nest Swagger decorators on every public route:

- `@ApiTags` groups related operations;
- `@ApiOperation` gives a short action-oriented summary;
- `@ApiParam` documents path parameters;
- response decorators describe the success DTO and whether it is an array;
- error response decorators describe the standard `ErrorResponseDto`.

Use the actual HTTP status code in the implementation and documentation. For example, creation returns 201 and deletion returns 204. Document not-found and validation responses where they can occur.

## Document DTOs

DTOs are the source of truth for request shape. Add `class-validator` decorators for runtime validation and matching Swagger decorators for examples, optionality, and descriptions. Keep examples realistic and concise. Make optional fields optional in both TypeScript and validation metadata. Do not accept fields merely because they exist on an entity; use explicit request DTOs and the global whitelist validation.

Response DTOs should describe the public response contract and provide a deliberate mapping from entities. Avoid exposing internal columns or database implementation details by accident.

## OpenAPI and Scalar reference

The application generates its OpenAPI document at startup. The Swagger UI is served at `/api`; the Scalar reference is served at `/reference`. Routes must be included through their Nest module for them to appear. If adding authentication or another separately generated document, integrate it through the existing Swagger setup instead of duplicating documentation setup in a feature.

After adding or changing an endpoint, check the Scalar reference manually. Confirm that the endpoint appears under the correct tag and that its parameters, request body, response schemas, status codes, examples, and error responses render clearly. If it does not appear, verify that the controller is registered in its feature module and that the feature module is imported by `AppModule`.

When a contract changes, verify the generated reference manually or through an OpenAPI export if available. Keep route names, versioning, status codes, error shapes, and DTO examples consistent with the generated document.

## Writing style

Describe behavior, constraints, and failure cases—not implementation trivia. Prefer stable terms and action summaries such as “Create a todo” or “List todos.” Mark unfinished or intentionally unavailable endpoints clearly rather than documenting aspirational behavior as implemented.
