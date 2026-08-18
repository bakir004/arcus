# Frontend styling guide

Use Tailwind CSS and the existing shadcn/ui system. The source of truth for theme variables and global styles is:

```text
apps/frontend/src/styles.css
```

Do not create a second theme file or replace the tweakcn variables in `styles.css`.

## Component rules

- Do not use regular HTML layout or typography tags directly in page and feature UI (`div`, `section`, `main`, `header`, `h1`, `p`, etc.). Use the primitives in `components/common` instead, such as `Page`, `PageHeader`, `Panel`, `Stack`, `Inline`, `Display`, `Heading`, `Body`, and `Muted`.
- This rule has only really rare exceptions: use a native element when a required browser semantic, form behavior, table structure, or third-party component API cannot be represented by an existing primitive. Keep the exception local and document why it is necessary.
- If shadcn provides a component, use it instead of building a custom equivalent.
- Put generated shadcn components in `src/components/ui/`.
- Put shared project primitives in `src/components/common/`.
- Use the existing `cn()` helper from `@/lib/utils` for conditional classes.
- Prefer semantic theme utilities such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, and `ring-ring`.
- Avoid hard-coded colors when a theme token exists.
- Keep styling colocated with the component; use `styles.css` for global tokens, resets, and shared CSS only.
- Use the common typography and layout components when they express the intended pattern.

Generated shadcn UI files are excluded from strict Biome linting, but still run the formatter on them.

## Interaction

Buttons and button-like controls use pointer cursors through the global styles. Preserve disabled states and accessible labels. Use shadcn's built-in variants before adding one-off class combinations.

## Validation

From `apps/frontend`:

```bash
bun run format
bun run check
bun run build
```
