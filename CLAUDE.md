# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

There is no `typecheck` script; `tsc --noEmit` is not part of the standard flow and TS is configured loose (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`). ESLint also has `@typescript-eslint/no-unused-vars: off`. Do not "fix" code by tightening these — the relaxed settings are intentional for this prototype.

## Architecture

This is a **frontend-only prototype** for EduConnect, a Vietnamese tutoring platform. There is no backend: all data is seeded in-memory inside React Context providers. TanStack Query is wired in [src/App.tsx](src/App.tsx) but currently has no real endpoints to call.

### The role-based pattern (most important thing to understand)

The app has **8 user roles**, each with a parallel triplet of files:

| Role          | Context provider                                                  | Layout                                                        | Pages                                  |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| admin         | [AdminContext](src/contexts/AdminContext.tsx)                     | [AdminLayout](src/components/admin/AdminLayout.tsx)           | [src/pages/admin/](src/pages/admin/)   |
| tutor         | [TutorContext](src/contexts/TutorContext.tsx)                     | [TutorLayout](src/components/tutor/TutorLayout.tsx)           | [src/pages/tutor/](src/pages/tutor/)   |
| teacher       | [TeacherContext](src/contexts/TeacherContext.tsx)                 | [TeacherLayout](src/components/teacher/TeacherLayout.tsx)     | reuses tutor pages                     |
| student       | [StudentContext](src/contexts/StudentContext.tsx)                 | [StudentLayout](src/components/student/StudentLayout.tsx)     | [src/pages/student/](src/pages/student/) |
| parent        | [ParentContext](src/contexts/ParentContext.tsx)                   | [ParentLayout](src/components/parent/ParentLayout.tsx)        | [src/pages/parent/](src/pages/parent/) |
| office        | [OfficeContext](src/contexts/OfficeContext.tsx)                   | [OfficeLayout](src/components/office/OfficeLayout.tsx)        | [src/pages/office/](src/pages/office/) |
| finance       | [FinanceContext](src/contexts/FinanceContext.tsx)                 | [FinanceLayout](src/components/finance/FinanceLayout.tsx)     | [src/pages/finance/](src/pages/finance/) |
| exam-manager  | [ExamManagerContext](src/contexts/ExamManagerContext.tsx)         | [ExamManagerLayout](src/components/exam-manager/ExamManagerLayout.tsx) | [src/pages/exam-manager/](src/pages/exam-manager/) |

Routes are nested under `/<role>` in [src/App.tsx](src/App.tsx) and use React Router's `<Outlet />` inside each Layout. All eight providers wrap the app at the root (see [src/App.tsx:96-225](src/App.tsx)) — don't move them under specific routes, the layouts call `useAdmin()`/`useTutor()`/etc. unconditionally.

When adding a new route for a role, follow the existing triple: register the route in `App.tsx`, add the nav entry in that role's `*Layout.tsx`, and add the page under `src/pages/<role>/`. Some routes deliberately `<Navigate>` to consolidated pages — preserve that when restructuring.

The `teacher` role reuses the tutor pages and provider — they are intentional aliases, not duplicates to merge.

### Context shape & seed data

Each role context (e.g. [AdminContext.tsx](src/contexts/AdminContext.tsx)) follows the same shape:
- Exports TypeScript types/interfaces for that role's domain entities (users, classes, transactions, etc.).
- Defines large `seed*` arrays of mock data, often referencing avatar images imported from [src/assets/](src/assets/).
- Exposes CRUD-ish callbacks via `useState` + `useCallback`.

All user-facing strings are **Vietnamese**; identifiers and code comments stay English. When editing seed data, keep dates as ISO `YYYY-MM-DD` strings — they are sorted/displayed as plain strings, not `Date` objects.

### UI / styling

- shadcn/ui primitives live in [src/components/ui/](src/components/ui/) and are configured via [components.json](components.json) (style: default, base color: slate, alias `@/components/ui`). Generate new primitives with `npx shadcn@latest add <name>` rather than hand-writing them.
- Tailwind config in [tailwind.config.ts](tailwind.config.ts) defines custom font sizes (`text-hero`, `text-section`, `text-body`), brand colors (`neon`, `deep-blue`, `bright-blue`), and a full sidebar color palette — all driven by CSS variables in [src/index.css](src/index.css). Dark mode is class-based.
- Use `cn()` from [src/lib/utils.ts](src/lib/utils.ts) for conditional classNames (clsx + tailwind-merge).
- Path alias: `@/*` → `src/*` (configured in [vite.config.ts](vite.config.ts), [tsconfig.app.json](tsconfig.app.json), and [vitest.config.ts](vitest.config.ts) — keep them in sync if you add another).

### Testing

Vitest + jsdom + React Testing Library. Config in [vitest.config.ts](vitest.config.ts), setup in [src/test/setup.ts](src/test/setup.ts) (mocks `window.matchMedia`). Test files: `src/**/*.{test,spec}.{ts,tsx}`. The repo currently has only [src/test/example.test.ts](src/test/example.test.ts) — there is no established testing convention for components yet.

### Lovable integration

This project was scaffolded with Lovable. The `lovable-tagger` Vite plugin is loaded **only in development mode** ([vite.config.ts:15](vite.config.ts#L15)) and tags components for the Lovable editor. Don't remove it; it's a no-op in production builds.
