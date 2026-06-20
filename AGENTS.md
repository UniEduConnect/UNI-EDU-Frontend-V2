# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in this repo.
This is the canonical agent instruction file; `CLAUDE.md` points here.

## What this is

**UNI-EDU Frontend V2** — the web client for EduConnect, a Vietnamese tutoring
platform. Vite + React 18 + TypeScript + Tailwind + shadcn/ui. It talks to the
**.NET UNI-EDU backend** (sibling repo `../UNI-EDU-Backend`) over a REST API.

This is **no longer a mock-only prototype** — most screens are wired to the real
API. Where the backend has no endpoint yet, individual pages still fall back to
in-memory seed data. The current coverage map (✅ wired / 🟡 partial / ⛔ mock)
lives in [API_INTEGRATION_NOTES.md](API_INTEGRATION_NOTES.md); the per-role
backend gaps are in the `backend-gaps-*.json` files. Read those before assuming a
screen has (or lacks) a real endpoint.

## Commands

```bash
npm install            # install deps (both bun.lock and package-lock.json exist; README uses npm)
npm run dev            # Vite dev server on http://localhost:8080 (HMR overlay disabled)
npm run build          # production build
npm run build:dev      # build in development mode (keeps lovable-tagger annotations)
npm run lint           # ESLint over the repo
npm run preview        # serve the built dist/
npm run test           # vitest run (single pass)
npm run test:watch     # vitest in watch mode

# Run a single test file or filter by name
npx vitest run src/test/example.test.ts
npx vitest run -t "name fragment"
```

There is no `typecheck` script. `tsc --noEmit` is not part of the flow and TS is
configured **loose on purpose** (`strict: false`, `noImplicitAny: false`,
`strictNullChecks: false`, `noUnusedLocals: false`); ESLint also sets
`@typescript-eslint/no-unused-vars: off`. Do not "fix" code by tightening these —
the relaxed settings are intentional for this app's velocity.

## Backend connection (read this before touching data fetching)

- The frontend calls `VITE_API_BASE_URL` (see [.env.example](.env.example)). In
  **dev** this is the relative path `/api`, which Vite proxies to the backend —
  the backend sends **no CORS headers**, so going same-origin via the proxy is
  how we avoid CORS. The proxy target is `VITE_BACKEND_ORIGIN` (default
  `http://localhost:5115`), configured in [vite.config.ts](vite.config.ts).
- Copy `.env.example` → `.env` (or `.env.development`) to run. `.env*` is
  gitignored except `.env.example`.
- **Never** hardcode a backend URL or build a second axios instance — everything
  goes through the shared client below.

### The data layer is a strict 3-layer stack

```
src/types/api.ts   ← TypeScript mirror of the backend DTOs (camelCase)
src/services/*.ts  ← thin async fns: one per endpoint, call apiClient, return typed data
src/hooks/use*.ts  ← TanStack Query wrappers (useQuery/useMutation) the UI consumes
                      components NEVER import services or apiClient directly
```

When adding/changing an API call, touch all three in order:
1. Add/adjust the DTO type in [src/types/api.ts](src/types/api.ts) (match the
   backend's camelCase serialization; document string-enum values in comments).
2. Add a service fn in the matching `src/services/<domain>.ts`.
3. Expose it via a `use*` hook in `src/hooks/use<Domain>.ts`, with a sensible
   `queryKey` and `invalidateQueries` on related mutations.

Key conventions in this stack:
- **`apiClient` ([src/lib/apiClient.ts](src/lib/apiClient.ts)) unwraps the
  envelope.** Every backend response is `{ statusCode, message, data }`
  (`ApiEnvelope<T>`); the response interceptor returns `data` directly, so
  service fns get the payload, not the envelope. This is why services cast with
  `as unknown as Promise<T>` — the runtime shape no longer matches axios's
  `AxiosResponse` type. Keep that pattern; don't "correct" it.
- **Paged endpoints** return `Paged<T>` = `{ items, total, page, pageSize,
  totalPages }`. List hooks typically surface `data.items` as a convenience
  field (e.g. `useTutors()` returns `{ ...result, tutors }`).
- **Auth tokens:** the access token lives in `localStorage` via
  [src/lib/authToken.ts](src/lib/authToken.ts) (a React-free store so the axios
  interceptors can read it). The request interceptor attaches
  `Authorization: Bearer <token>`. A `401` triggers a **single shared**
  `/refresh-token` call (httpOnly refresh cookie, `withCredentials: true`); all
  concurrent 401s await the same refresh promise, then retry once. If refresh
  fails, the token is cleared and `triggerUnauthorized()` forces a logout.
- Error messages are normalized to the backend `message` (Vietnamese) so toasts
  can show them directly.

### Auth & roles

- [AuthContext](src/contexts/AuthContext.tsx) is the **only** React context. It
  decodes the JWT (`jwt-decode`), exposes `user / role / isAuthenticated /
  isLoading / login / register* / logout`, and on boot does a silent
  `/refresh-token` so a returning user with an expired access token but a live
  refresh cookie isn't bounced to `/login`. Gate route guards on `isLoading`.
- [src/lib/roleRoutes.ts](src/lib/roleRoutes.ts) is the single source of truth
  for the **8 app roles** and each one's dashboard path. It maps the JWT `role`
  claim → app role. ⚠️ Read the comment there: early RDS seed data had
  mis-ordered role integers; if you ever run against that data the claim looks
  permuted and you swap to the documented inversion map. For `/register`
  accounts the mapping is identity.
- [ProtectedRoute](src/components/ProtectedRoute.tsx) guards each `/<role>` route
  group. Note two deliberate aliases: **`teacher` reuses all `tutor` pages**, and
  the **`office` / `finance` / `exam-manager` portals are gated by the `admin`
  role** (the backend has no separate users for them). Preserve both.

## App structure (the role pattern)

Eight roles, each with a parallel triplet — Layout + pages + nav:

| Role         | Layout                                                      | Pages                                                  | Notes |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------ | ----- |
| admin        | [AdminLayout](src/components/admin/AdminLayout.tsx)         | [src/pages/admin/](src/pages/admin/)                   | |
| tutor        | [TutorLayout](src/components/tutor/TutorLayout.tsx)         | [src/pages/tutor/](src/pages/tutor/)                   | |
| teacher      | [TeacherLayout](src/components/teacher/TeacherLayout.tsx)   | reuses tutor pages                                     | alias of tutor |
| student      | [StudentLayout](src/components/student/StudentLayout.tsx)   | [src/pages/student/](src/pages/student/)               | |
| parent       | [ParentLayout](src/components/parent/ParentLayout.tsx)      | [src/pages/parent/](src/pages/parent/)                 | |
| office        | [OfficeLayout](src/components/office/OfficeLayout.tsx)      | [src/pages/office/](src/pages/office/)                 | admin-gated portal |
| finance      | [FinanceLayout](src/components/finance/FinanceLayout.tsx)   | [src/pages/finance/](src/pages/finance/)               | admin-gated portal |
| exam-manager | [ExamManagerLayout](src/components/exam-manager/ExamManagerLayout.tsx) | [src/pages/exam-manager/](src/pages/exam-manager/) | admin-gated portal |

- Routes are nested under `/<role>` in [src/App.tsx](src/App.tsx), each group
  wrapped in `<ProtectedRoute role="…">`, rendering pages through `<Outlet />`
  inside the Layout. Public pages (`/`, `/login`, `/register`, `/find-tutor`, …)
  sit outside the guards.
- **Adding a route for a role:** register it in `App.tsx`, add the nav entry in
  that role's `*Layout.tsx`, and add the page under `src/pages/<role>/`. Some
  routes deliberately `<Navigate>` to consolidated pages (e.g.
  `/admin/approvals` → `/admin/users`) — preserve those redirects when
  restructuring.

## UI / styling

- shadcn/ui primitives live in [src/components/ui/](src/components/ui/),
  configured by [components.json](components.json) (style: default, base color:
  slate, alias `@/components/ui`). Generate new primitives with
  `npx shadcn@latest add <name>` rather than hand-writing them.
- Tailwind config ([tailwind.config.ts](tailwind.config.ts)) defines custom font
  sizes (`text-hero`, `text-section`, `text-body`), brand colors (`neon`,
  `deep-blue`, `bright-blue`), and a sidebar palette — all driven by CSS
  variables in [src/index.css](src/index.css). Dark mode is class-based.
- Use `cn()` from [src/lib/utils.ts](src/lib/utils.ts) for conditional
  classNames (clsx + tailwind-merge).
- Toasts: both `@/components/ui/toaster` (shadcn) and `sonner` are mounted in
  `App.tsx`. Charts use `recharts`; forms use `react-hook-form` + `zod`.
- Path alias `@/*` → `src/*` is set in [vite.config.ts](vite.config.ts),
  [tsconfig.app.json](tsconfig.app.json), and
  [vitest.config.ts](vitest.config.ts) — keep all three in sync if you add one.

## Localization & data conventions

- **All user-facing strings are Vietnamese.** Identifiers, code comments, and
  commit messages stay English.
- Dates from the backend are ISO strings; treat date-only fields as
  `YYYY-MM-DD` strings (sorted/displayed as strings, not `Date` objects) and
  datetimes as ISO datetime strings.
- Money is plain VND numbers.

## Testing

Vitest + jsdom + React Testing Library. Config in
[vitest.config.ts](vitest.config.ts), setup in
[src/test/setup.ts](src/test/setup.ts) (mocks `window.matchMedia`). Test glob
`src/**/*.{test,spec}.{ts,tsx}`. There is only a placeholder
[src/test/example.test.ts](src/test/example.test.ts) so far — no established
component-testing convention yet; mock the `use*` hooks (or `apiClient`) rather
than hitting the network.

## Lovable integration

Scaffolded with Lovable. The `lovable-tagger` Vite plugin loads **only in
development** ([vite.config.ts](vite.config.ts)) to tag components for the Lovable
editor. Don't remove it; it's a no-op in production builds.

## Quick checklist before you finish

- [ ] New/changed API call goes through `types → services → hooks`, never a
      component calling `apiClient` directly.
- [ ] Mutations `invalidateQueries` the keys they affect.
- [ ] User-facing text is Vietnamese; code stays English.
- [ ] `npm run lint` passes; `npm run test` passes.
- [ ] No new backend URL hardcoded; config stays in `.env` / `vite.config.ts`.
- [ ] Didn't tighten the loose TS/ESLint config to "fix" warnings.
