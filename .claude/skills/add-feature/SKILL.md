---
name: add-feature
description: Wire a screen or resource in UNI-EDU-Frontend-V2 to the backend API following the conventions in AGENTS.md — DTO types in src/types/api.ts → service fns in src/services/<domain>.ts → TanStack Query hooks in src/hooks/use<Domain>.ts → consume in a page/component, plus route + layout nav for a brand-new screen. Invoke when adding an API-backed feature, connecting a mock screen to a real endpoint, or scaffolding a new role page.
---

# add-feature

You are wiring a feature in **UNI-EDU-Frontend-V2** (Vite + React 18 + TS +
Tailwind + shadcn/ui, talking to the .NET UNI-EDU backend). The goal: produce
code that **already matches the conventions in [AGENTS.md](../../../AGENTS.md)**
so the user never has to send it back for "please follow the pattern."

Read `AGENTS.md` first if you haven't — especially the **3-layer data stack** and
**Auth & roles** sections. This skill is the step-by-step for executing it.

## Step 0 — Clarify scope before writing files

Ask the user (concisely) only for what isn't already obvious from their request:

- **What endpoint(s)** does this hit? Method + path (e.g. `GET /Trials`,
  `POST /Trials/{id}/accept`). If they don't know, the backend is the sibling
  repo `../UNI-EDU-Backend` — its controllers + `CLAUDE.md` are the source of
  truth. Check [API_INTEGRATION_NOTES.md](../../../API_INTEGRATION_NOTES.md) and
  the `backend-gaps-*.json` files to see whether the endpoint exists yet.
- **Does the endpoint exist?** If it's marked ⛔ (no backend endpoint) in
  `API_INTEGRATION_NOTES.md`, do **not** invent a service call — keep that screen
  on its existing in-memory seed data and tell the user it's blocked on the BE.
- **Which role(s)** consume it — `admin`, `tutor`, `teacher`, `student`,
  `parent`, `office`, `finance`, `exam-manager`? (Determines which pages/layout.)
- **New screen or existing page?** If new, you'll also add a route + nav entry.

Skip questions whose answer is already in the prompt. Don't ask more than 3 at once.

## Step 1 — Types (`src/types/api.ts`)

Mirror the backend DTO. This file is the single TS mirror of the backend.

- Field names are **camelCase** (the backend serializes camelCase to the client).
- Add a one-line comment naming the endpoint the type belongs to (match the
  existing `/** … — GET /Foo */` style).
- Backend **enums serialize as strings** — type the field as `string` and
  document the known values in a comment (see the enum legend at the top of the
  file). Do not invent a TS union unless the screen needs exhaustiveness.
- Paged/list endpoints return `Paged<T>` (`{ items, total, page, pageSize,
  totalPages }`) — reuse it, don't redefine.
- Query/filter params for a list endpoint go in a `<Feature>ListQuery` interface
  with PascalCase keys (the backend binds `[FromQuery]` PascalCase, e.g.
  `Search`, `Subject`, `Page`).

## Step 2 — Service (`src/services/<domain>.ts`)

One thin async fn per endpoint. Add to the existing domain file if there is one
(e.g. `tutors.ts`, `wallet.ts`); otherwise create `src/services/<domain>.ts`.

- Import the shared client: `import { apiClient } from "@/lib/apiClient";`.
  **Never** create a new axios instance or import axios directly here.
- The response interceptor **already unwraps** the `{ statusCode, message, data }`
  envelope and returns `data`, so the runtime value is the payload — not an
  `AxiosResponse`. That's why every call casts:
  ```ts
  export async function getTrials(query: TrialListQuery = {}): Promise<Paged<TrialItem>> {
    return apiClient.get("/Trials", { params: query }) as unknown as Promise<Paged<TrialItem>>;
  }
  ```
  Keep the `as unknown as Promise<T>` cast — it's intentional, not a smell.
- Match the backend's path casing exactly (the backend uses `/Tutors`, `/Wallet`,
  `/Classes`, … PascalCase controller names). Pass query params via
  `{ params: query }`, not string concatenation.
- `void`-returning calls just `await apiClient.delete(...)` etc.

## Step 3 — Hook (`src/hooks/use<Domain>.ts`)

TanStack Query wrappers — **this is the only layer components import.**

- `useQuery` for reads, `useMutation` for writes. Use `import * as <domain>Service
  from "@/services/<domain>";`.
- **Query keys** are arrays starting with a stable string and including every
  arg that changes the result: `["trials", query]`, `["trial", id]`. Reuse the
  existing key prefixes so invalidation lines up.
- `enabled: !!id` on detail queries that depend on a param so they don't fire
  with `undefined`.
- For list hooks, surface the array as a convenience field like the others do:
  ```ts
  export function useTrials(query: TrialListQuery = {}) {
    const result = useQuery({ queryKey: ["trials", query], queryFn: () => trialsService.getTrials(query) });
    return { ...result, trials: result.data?.items ?? [] };
  }
  ```
- **Mutations must `invalidateQueries`** the keys they affect, via
  `const qc = useQueryClient();` + `onSuccess: () => qc.invalidateQueries({ queryKey: [...] })`.
- "My own X" hooks read the id from auth: `const { user } = useAuth();` then pass
  `user?.id` down (see `useMyTutorProfile` / `useMyReviews` for the pattern).
- `staleTime` is optional; add `60_000` for lists that don't change often.

## Step 4 — Consume in the page/component

- Import the hook, never the service or `apiClient`.
- Handle the three states: loading (`isLoading` → spinner/skeleton), error
  (`isError` → show `error.message`, which is already the backend's Vietnamese
  message), and data.
- All **user-facing strings are Vietnamese**; identifiers and comments stay
  English.
- Dates from the API are ISO strings — render date-only fields as the
  `YYYY-MM-DD` string, don't wrap in `new Date()` for sorting.
- Money is plain VND numbers; format for display only.
- Use shadcn/ui primitives from `@/components/ui/*` and `cn()` from
  `@/lib/utils` for conditional classes. Toaster (`sonner` /
  `@/components/ui/toaster`) is already mounted for success/error toasts.

## Step 5 — New screen only: route + nav

Skip this if you're wiring an existing page. For a brand-new screen, do all three
(the role triplet):

1. **Route** in [src/App.tsx](../../../src/App.tsx) — add a `<Route>` inside the
   correct role's group (each group is wrapped in
   `<ProtectedRoute role="…">` → `<Layout>` → `<Outlet/>`). Keep any deliberate
   `<Navigate>` redirects intact.
2. **Nav entry** in that role's `src/components/<role>/<Role>Layout.tsx`.
3. **Page** under `src/pages/<role>/<Page>.tsx`.

Remember the deliberate aliases: **`teacher` reuses every `tutor` page**, and the
**`office` / `finance` / `exam-manager` portals are admin-gated** (no separate
backend user roles — they're guarded by the `admin` role in
[ProtectedRoute](../../../src/components/ProtectedRoute.tsx)). Don't create
parallel pages for `teacher`; route `/teacher/*` at the existing tutor pages.

## Step 6 — Verify before reporting done

1. `npm run lint` — must pass.
2. `npm run test` — must pass (Vitest). There's no component-test convention yet;
   if you add a test, mock the `use*` hook or `apiClient`, don't hit the network.
3. There is **no `typecheck` script** and TS is intentionally loose
   (`strict: false`, etc.). Do **not** tighten tsconfig/ESLint to "fix" warnings.
4. You can't fully verify behavior without the backend running. Say "lint/test
   are clean; run `npm run dev` (proxying to the backend on
   `VITE_BACKEND_ORIGIN`) and exercise the screen to confirm." Lint passing ≠
   endpoint works.

## Anti-patterns to refuse

- ❌ Components importing `apiClient` or a service directly — always go through a
  `use*` hook.
- ❌ A second axios instance or a hardcoded backend URL — everything goes through
  `@/lib/apiClient`; the base URL comes from `VITE_API_BASE_URL` / the Vite proxy.
- ❌ "Correcting" the `as unknown as Promise<T>` cast in services — it's required
  because the interceptor unwraps the envelope.
- ❌ Re-reading the token from `localStorage` in app code — auth state comes from
  `useAuth()`; the axios interceptor handles the `Authorization` header and the
  401-refresh flow.
- ❌ Inventing a service call for a ⛔ endpoint that doesn't exist on the backend.
  Keep the screen on seed data and flag it.
- ❌ Mutations that don't `invalidateQueries` — the UI goes stale.
- ❌ English user-facing copy, or Vietnamese identifiers/comments.
- ❌ Tightening the loose TS/ESLint config to silence warnings.
- ❌ Duplicating tutor pages for the `teacher` role, or building separate
  office/finance/exam-manager user roles — they're aliases/admin-gated.

## Output discipline

- After scaffolding, give a short list of files created/modified (one path per
  line, no per-file commentary).
- Mention manual follow-ups: "endpoint X isn't on the backend yet, left on seed
  data" / "run the dev server against the backend to verify the response shape."
- Don't write a long summary of what the code does — the diff and `AGENTS.md`
  already explain the pattern.
