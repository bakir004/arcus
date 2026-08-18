# General frontend instructions

Read `architecture.md`, `styling.md`, and `api.md` before changing frontend code.

Make the smallest coherent change and inspect existing components before introducing a new pattern. Reuse shadcn and `components/common` primitives. Do not put page markup or business logic in TanStack Router route files.

## Checks

Run these commands before handing off work:

```bash
cd apps/frontend
bun run format
bun run check
bun run build
```

If generated route files change, run:

```bash
bun run generate-routes
```

Do not commit `node_modules`, build output, environment files, or `.tanstack/` artifacts. Keep secrets out of source, documentation, logs, and screenshots.
