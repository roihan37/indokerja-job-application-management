# IndoKerja Job Application Management

Job application management for the IndoKerja full-stack assessment: a React frontend in `client/` and an Express REST API in `server/`, backed by PostgreSQL and Prisma. Deployment and deployed end-to-end verification remain submission tasks.

## Requirements and local setup

- Node.js 24 LTS (24.15+ recommended), npm, and PostgreSQL. The supported
  range is `^22.22.2 || ^24.15.0 || >=26.0.0`, matching the frontend test
  dependencies (including jsdom); React Router also requires Node 22.22+.
- Run commands below inside `server/`.

```sh
npm ci
cp .env.example .env
```

Edit `.env`: configure `DATABASE_URL`, set a randomly generated `JWT_SECRET` of at least 32 characters, and choose a demo-only `DEMO_PASSWORD` (12+ characters, at most 72 UTF-8 bytes). Never reuse a real password or commit `.env`.

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The API runs at `http://localhost:4000/api`. Configure `PORT` and `CLIENT_ORIGIN` as needed. Seed can be rerun; it updates demo passwords and jobs without deleting applications.

### Frontend

In another terminal, run these commands inside `client/`:

```sh
npm ci
cp .env.example .env
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. Set `VITE_API_BASE_URL` to the API base URL including `/api` (default: `http://localhost:4000/api`) and set the backend `CLIENT_ORIGIN` to the frontend origin. Restart Vite after changing local environment variables. Every `VITE_` variable is public browser configuration; keep database credentials and JWT secrets in the backend environment only.

The client uses React, strict TypeScript, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS 4 through its Vite plugin, and shadcn/ui components. Job Seekers can browse, view, and apply to jobs and track their applications. Companies can create jobs, view their own applicants, and update application statuses. Use the seeded accounts below; registration is outside scope.

Sessions use `sessionStorage` for the current browser tab and expire with the one-hour access token. Logout and expired sessions clear authenticated query data. Backend role and ownership checks remain authoritative. Search and job-type filters operate on the complete jobs response in the browser; the API has no search or pagination parameters. Application history is persisted by the backend; there is no history endpoint or frontend history view.

Run frontend checks inside `client/`:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Frontend tests use Vitest and React Testing Library. All frontend tests, setup, and fixtures live in `client/test/`, with subfolders matching the source structure. Backend tests live in `server/test/`. Keep test files outside `src/` in both applications. `npm run format` applies the same shared formatting conventions as the backend.

## Demo accounts

| Email                | Role                                   |
| -------------------- | -------------------------------------- |
| seeker@example.com   | Job Seeker                             |
| seeker2@example.com  | Second Job Seeker for isolation checks |
| company1@example.com | Company: Example Technology            |
| company2@example.com | Company: Nusantara Digital             |

All use the password supplied through `DEMO_PASSWORD` during seeding. Document the deployed demo-only password when preparing the submission. Each company has a demo job: `demo-job-1` and `demo-job-2`.

After applying migrations, run `npm run db:seed` inside `server/` to add
candidate-profile demo data. Andi Pratama (`seeker@example.com`) has a complete
profile; Siti Rahma (`seeker2@example.com`) has optional fields left empty to
demonstrate fallbacks. Both candidates have an application for each demo job,
so either company can open candidate details immediately. New applications
include their initial `Applied` history entry atomically.

Rerunning seed preserves existing profiles, application statuses, CV attachments,
and history; it does not reset the database or duplicate applications. Seed does
not create fake CV metadata or upload files to Supabase. To test CV selection,
preview, and download, configure private Storage and upload a real PDF through
the candidate's Profile page, then apply to a newly created job with that CV.
Previously submitted demo applications intentionally remain without a CV.

## Checks

Run the following backend commands inside `server/`.

```sh
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Run `npm run format` inside `server/` to apply formatting. Prettier uses 2 spaces, single quotes, semicolons, trailing commas, and an 80-character print width. ESLint checks TypeScript, imports, braces, and promise handling. See the Code Style & Readability section in `AGENTS.md` for shared conventions.

Tests use the existing **Node Test Runner**, TypeScript through `tsx`, and Supertest against `createApp()`; they do not start the production server. No additional test dependencies are needed. Unit tests use small Prisma substitutes; database constraints, transactions, and HTTP authorization are tested against real PostgreSQL.

```text
server/test/
├── setup.ts
├── helpers/
│   ├── authHelper.ts
│   ├── mockDatabase.ts
│   ├── testDatabase.ts
│   └── testFactory.ts
├── unit/
│   ├── helpers/testDatabase.test.ts
│   └── services/
│       ├── auth.service.test.ts
│       ├── jobs.service.test.ts
│       └── applications.service.test.ts
└── integration/
    ├── auth.test.ts
    ├── jobs.test.ts
    ├── applications.test.ts
    ├── authorization.test.ts
    └── errors.test.ts
```

```sh
npm run test:unit
```

Integration tests require a **dedicated PostgreSQL database**, created beforehand by your PostgreSQL administrator/user. Set `TEST_DATABASE_URL` in your local untracked `.env` or shell. Its database name must end in `_test`, its schema must be `public`, and it must differ from `DATABASE_URL`. The suite checks these conditions before migrating or cleaning up. Never point it at a database containing development or production data. The guard cannot detect every DNS alias to the same server; configure distinct database names.

```sh
# Example only: replace connection credentials and create indokerja_test first.
export TEST_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/indokerja_test
npm run test:integration
npm test
npm run test:coverage
```

Tests apply existing migrations automatically using the dedicated URL; do not change the application `DATABASE_URL` to run tests. Each test creates fresh fixtures in a transaction with unique email prefixes and runtime-generated credentials. Cleanup deletes only those fixtures, in foreign-key order; it never truncates tables or uses development seed data. Database tests run serially; concurrency cases explicitly submit simultaneous requests. Do not run multiple integration commands against the same database at once.

Coverage uses Node's native experimental V8 coverage report, restricted to loaded `src/**/*.ts` files; generated Prisma code and test helpers are excluded. Startup-only code is not exercised by Supertest. The command prints line, branch, and function coverage in the terminal.

Cases cover credentials/JWT claims and verification, missing credentials, role boundaries, required job fields, job listing/creation, concurrent duplicate applications and direct database constraint rejection, seeker isolation, cross-company ownership, all supported statuses, no-op history, concurrent status changes, transaction rollback, database safety guards, and serialization retry limits.

## Production

```sh
npm ci --include=dev
npm run db:generate
npm run build
npm run db:migrate
npm start
```

Set production environment variables before running these commands; use HTTPS and configure `CLIENT_ORIGIN` to the frontend URL. Seed explicitly once with demo accounts if desired. No automatic migration or seeding happens at server startup. PostgreSQL connection failure prevents startup.

For the frontend, run `npm ci` and `npm run build` inside `client/` with the production `VITE_API_BASE_URL` set at build time, then deploy `client/dist/` to a static host. Configure that host to serve `index.html` for client routes such as `/jobs`, `/applications`, and `/company/jobs`; direct navigation and refresh must resolve through the React Router application. Use the deployed frontend origin for the backend CORS setting. `npm run preview` is a local build preview, not the production API server.

### Railway backend and PostgreSQL

1. Create a PostgreSQL service and a backend service from this repository.
   Set the backend Root Directory to `/server` and Config File to
   `/server/railway.json` (the config path is relative to the repository,
   independently of Root Directory).
2. Set `RAILPACK_NODE_VERSION=24`,
   `RAILPACK_NODE_NPM_INSTALL=npm ci --include=dev`, and
   `RAILPACK_PRUNE_DEPS=false`. Keep development dependencies available:
   Prisma CLI runs migrations before deployment, and `tsx` runs the seed.
3. Set the backend variables below, then deploy and generate a public HTTPS domain.

| Variable        | Production value                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | Railway PostgreSQL connection reference, for example `${{Postgres.DATABASE_URL}}` when the database service is named `Postgres` |
| `JWT_SECRET`    | A randomly generated secret of at least 32 characters, stored only in Railway                                                   |
| `CLIENT_ORIGIN` | Exact frontend HTTPS origin, without a path or trailing slash                                                                   |
| `NODE_ENV`      | `production`                                                                                                                    |

Railway supplies `PORT`; the server listens on that port on all interfaces.
The configuration generates Prisma Client, builds TypeScript, runs only
`prisma migrate deploy` before deployment, and starts the compiled server.
A migration failure must block deployment. Do not use `migrate dev`,
`migrate reset`, or `db push` against production. Back up existing data before
applying future schema changes.

For the assessment demo, set `DEMO_PASSWORD` securely (12+ characters, at most
72 UTF-8 bytes) and run `npm run db:seed` once inside the deployed backend
environment using Railway's service shell/SSH. Do not seed automatically on
every deployment. Rerunning seed preserves applications/history but updates
demo passwords and demo jobs. Never run tests against the production database.

See [Railway monorepo configuration](https://docs.railway.com/deployments/monorepo)
and [Railpack Node configuration](https://railpack.com/languages/node/).

### Vercel frontend

Import the repository with Root Directory `client`, framework preset Vite,
Node.js `24.x`, install command `npm ci`, build command `npm run build`, and
output directory `dist`. Set `VITE_API_BASE_URL` to the backend HTTPS URL
including `/api` before building. Redeploy after changing it.
`client/vercel.json` provides the
[SPA fallback required for direct navigation](https://vercel.com/docs/frameworks/frontend/vite).
Keep all secrets out of frontend variables. After the frontend domain is
known, set Railway's `CLIENT_ORIGIN` to that exact origin and redeploy the API.
Preview domains need a matching CORS setting; production configuration allows
one origin.

Before submission, verify login for both roles, direct-route refresh, job
creation, applying, duplicate rejection, ownership rejection, and a status
change visible to the seeker on the deployed URLs. Local checks alone do not
verify deployment. Record the final URLs and demo-only credentials for reviewers.

## Implementation decisions

- The backend follows Routes → Controllers → Services → Prisma → PostgreSQL, defined in [AGENTS.md](AGENTS.md#5-official-layer-based-architecture). `src/routes/` wires authentication, authorization, validation, and thin controllers; `src/services/` owns database queries and business rules. Shared JWT settings and Prisma initialization live in `src/lib/`. `src/app.ts` composes Express for testing; `src/server.ts` starts and stops the server. Express 5 forwards async errors without a wrapper.
- One Express server, Prisma, PostgreSQL; no public registration or extra infrastructure.
- JWT access tokens expire after one hour. Only identity is carried in the token; protected requests load the current role/company from PostgreSQL. Logout discards the token; no refresh/revocation endpoint.
- Password hashes use bcrypt cost 12. API responses select safe fields and never return hashes.
- Salary is whole IDR/month, between 0 and 2,147,483,647; zero means zero. SQL also enforces nonnegative salary.
- A unique `(jobId, jobSeekerId)` constraint prevents duplicate applications under races; conflicts return `409`.
- Initial application/history creation is atomic. Status/history updates use serializable transactions and retry serialization conflicts up to three times after the initial attempt. Same-status updates return `200` without touching timestamps/history. Any of the five supported statuses may follow another; no extra workflow restrictions.
- Foreign resource access returns `403`; nonexistent resources return `404`. Ownership is checked before reading applicants and inside status transactions.
- Prisma CLI/client are pinned to the same major release. A `deepmerge-ts` override uses the patched version of a vulnerable CLI transitive dependency.

See [docs/api.md](docs/api.md) for endpoints and response examples. Remaining submission work: deployment, deployed end-to-end verification with both roles, source push, candidate-created Google Doc, and submission form.

## Candidate profiles and private resumes

Job Seekers can edit their profile at `/profile`, upload PDF CV versions,
preview their own CV, and choose a CV when confirming an application.
Companies can open a read-only candidate detail page from their applicant list,
preview/download the attached CV, and use the existing status control.
Applying without a CV remains supported. Uploading a new version never changes
the CV attached to an earlier application.

### Supabase configuration

1. Create a Supabase project and a **private** Storage bucket named
   `candidate-resumes`. Do not make it public. Set the bucket file-size limit
   to 5 MiB (5,242,880 bytes) and allowed MIME type to `application/pdf`.
2. Set backend-only `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (a server secret
   with Storage access), and `SUPABASE_STORAGE_BUCKET=candidate-resumes`.
   Set these on Railway as well. Never put this secret in frontend variables.
3. Run `npm run db:generate` and `npm run db:migrate` inside `server/`.
   The additive migration `20261018000000_candidate_profiles_resumes` preserves
   existing applications. Do not run database reset commands.
4. Restart the backend. No frontend Supabase credentials are required.

Storage configuration is optional for existing job functionality; upload and
signed-access operations return a safe 503 when storage is unavailable.
The backend checks authentication, MIME type, PDF signature, and the 5 MiB limit.
Files use generated unique paths; PostgreSQL stores metadata only. A failed
metadata insert triggers cleanup of only the newly uploaded object.
The most recently created successful upload is the current CV.

CV access goes through the backend and returns a fresh signed URL valid for
60 seconds with `Cache-Control: no-store`. These URLs are temporary bearer
links; do not share them. Company access requires ownership of the application's
job and always uses that application's original attachment. There is no
resume-deletion endpoint.

Automated profile/resume tests use mocked Storage operations and the dedicated
PostgreSQL test database described above; they require no cloud credentials.
Before deployment, verify real upload, preview, download, replacement, and
cross-company denial against your private bucket and deployed URLs.
