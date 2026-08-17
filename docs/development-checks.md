# Testing, linting, formatting, and typechecking

Run these commands from the repository root.

## Install dependencies

```bash
bun install
```

## Run tests

```bash
bun run test
```

The root test command runs every workspace package's `test` script. Apps without tests use Bun's `--pass-with-no-tests` option. Run the API directly with:

```bash
bun run --cwd apps/api test
```

## Lint

```bash
bun run lint
```

Biome checks the source files under `apps/` and `packages/`.

## Format

Format all workspace files:

```bash
bun run format
```

Check formatting without changing files:

```bash
bun run format:check
```

Run the combined Biome check:

```bash
bun run check
```

## Typecheck

```bash
bun run typecheck
```

Typechecking currently targets the NestJS API. To typecheck the API directly:

```bash
bun run --cwd apps/api typecheck
```

Typechecking uses TypeScript (`tsc --noEmit`); Biome handles formatting and linting.

## Recommended pre-commit checks

```bash
bun run check && bun run typecheck && bun run test
```
