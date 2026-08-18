# Frontend architecture

These rules apply to all work in `apps/frontend`.

## Application structure

```text
apps/frontend/src/
├── components/
│   ├── common/       # Shared project primitives: typography, panels, layout
│   └── ui/           # shadcn/ui components
├── features/         # Product capabilities and domain-specific UI
│   └── <feature>/
│       ├── api/      # Feature API client, queries, mutations, types
│       ├── components/# Feature-only presentational components
│       ├── lib/      # Feature utilities, transforms, constants, hooks
│       ├── pages/    # Page-level feature compositions
│       └── ...       # Add folders only when the feature needs them
├── routes/           # TanStack Router route definitions only
├── router.tsx
├── main.tsx
└── styles.css
```

Features may contain subfeatures when a capability has meaningful independent areas. Nest them inside the owning feature while preserving the same structure, for example `features/courses/assignments/components/` and `features/courses/assignments/pages/`. Keep genuinely reusable code in `components/common` or `lib`; keep feature-specific code inside its feature. Do not put feature implementation directly in `routes`.

All files inside `features/` must use kebab-case filenames, including React components (for example, `course-card.tsx`, `assignment-page.tsx`, and `course-filters.tsx`). Use PascalCase for the exported React component names. Keep non-component modules such as `queries.ts`, `types.ts`, and `constants.ts` in kebab-case as well.

## Routes are references only

TanStack Router routes must contain route configuration and reference a page. They must not contain UI elements, feature composition, data fetching, or internal logic.

```tsx
// src/routes/projects.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProjectsPage } from '@/features/projects/pages/projects-page';

export const Route = createFileRoute('/projects')({
    component: ProjectsPage,
});
```

The `pages/` component owns composition. Move loaders, queries, event handlers, and view markup there or into the feature's `api`, `lib`, and `components` folders.

## Shared components

Use `components/ui` for shadcn components and `components/common` for project-level primitives. Extend an existing component before creating a competing implementation. Use the `@/` alias for imports.

## Data and state

Use TanStack Query for all API communication and server state; no other API client or request pattern is permitted. Keep query keys and query functions near the feature in `features/<feature>/api`. Keep local UI state in the smallest component that owns it. Do not duplicate server state in global stores without a clear reason.
