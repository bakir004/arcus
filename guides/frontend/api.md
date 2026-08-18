# Frontend API and data guide

Use the API contract and existing API client conventions before adding requests. Do not call backend endpoints directly from route files or scattered components.

## Feature ownership

API code belongs to the relevant feature:

```text
src/features/projects/api/
├── projects.ts       # request functions and response types
├── queries.ts        # TanStack Query options/hooks
└── mutations.ts      # write operations
```

Keep request construction, query keys, response mapping, and mutation invalidation together. Components consume feature hooks or query options; they should not know URL details.

Use TanStack Query for all API communication and server state. Nothing else may be used for contacting the API: do not use `fetch`, Axios, SWR, React Server Components data fetching, ad hoc request hooks, or direct request calls from components. Configure a single `QueryClient` for the application. Query keys must be stable, specific, and defined near the query that owns them. Invalidate or update related queries after mutations.

## Error and loading states

Every page that performs a request must account for loading, empty, success, and error states. Use shadcn components such as `Skeleton`, `Alert` when available, `Empty` patterns, `Button`, and `Sonner` consistently with the feature's UX.

Do not expose secrets in frontend code. Only explicitly public environment variables may be shipped to the browser. Never commit API keys, JWT secrets, OAuth secrets, or service credentials.

## Contracts

Use the API's public response and error shapes. Do not duplicate backend business rules in the UI. Validate user input at the UI boundary for usability, but treat server validation as authoritative.
