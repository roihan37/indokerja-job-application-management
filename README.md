# IndoKerja Job Application Management

Backend implementation for the IndoKerja full-stack assessment. Frontend and deployment are pending.

## Requirements and local setup

- Node.js 22+ (verified with Node 24), npm, and PostgreSQL.
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

## Demo accounts

| Email | Role |
| --- | --- |
| seeker@example.com | Job Seeker |
| seeker2@example.com | Second Job Seeker for isolation checks |
| company1@example.com | Company: Example Technology |
| company2@example.com | Company: Nusantara Digital |

All use the password supplied through `DEMO_PASSWORD` during seeding. Document the deployed demo-only password when preparing the submission. Each company has a demo job: `demo-job-1` and `demo-job-2`.

## Checks

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
npm ci
npm run db:generate
npm run build
npm run db:migrate
npm start
```

Set production environment variables before running these commands; use HTTPS and configure `CLIENT_ORIGIN` to the frontend URL. Seed explicitly once with demo accounts if desired. No automatic migration or seeding happens at server startup. PostgreSQL connection failure prevents startup.

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

See [docs/api.md](docs/api.md) for endpoints and response examples. Remaining submission work: frontend, deployment, deployed end-to-end verification, source push, candidate-created Google Doc, and submission form.
