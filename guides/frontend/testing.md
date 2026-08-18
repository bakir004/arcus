# Frontend testing guide

Test behavior at the feature boundary rather than implementation details. Pages should be testable without going through a route definition.

Prioritize tests for:

- loading, empty, success, and error states;
- form validation and disabled/submitting states;
- query and mutation behavior, including invalidation;
- accessible names and keyboard interaction for dialogs, menus, tables, and forms;
- responsive layout behavior where it affects usability.

Keep test fixtures and feature-specific helpers under the feature. Do not make tests depend on a developer's local API or database. Prefer deterministic mocks for network requests.

Before handoff, run the frontend format, Biome check, build, and any relevant test command. Report commands that cannot run instead of silently skipping them.
