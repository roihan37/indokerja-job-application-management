# Railway migration recovery (Prisma 6)

## Cause

Prisma sorts migration directories lexicographically. The old
`20261018000000_candidate_profiles_resumes` ran before `202610180001_initial`.
Its first statement alters `Application`, which the initial migration creates.
The profile/resume foreign keys also require `User`.

The candidate directory is now `202610180002_candidate_profiles_resumes`.
Both SQL files and the initial migration name are unchanged. The initial
migration must run first, followed by the candidate migration.

Renaming changes Prisma's migration identity. The old database record remains;
renaming alone does not resolve a failed migration.

## Inspect before recovery

Pause automatic redeployment and take a database backup. Run commands from
`server/` using the corrected revision and its installed Prisma CLI, inside a
controlled Railway environment with the database reference available. Private
Railway hostnames require access to Railway's network. Keep credentials private.

```bash
npx prisma migrate status --schema prisma/schema.prisma
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1
```

Status can exit nonzero while migrations are pending or failed. In psql, check
`SELECT to_regclass('public._prisma_migrations');` before querying the table:

```sql
SELECT migration_name, checksum, started_at, finished_at, rolled_back_at,
       applied_steps_count, logs
FROM public."_prisma_migrations"
ORDER BY started_at;

SELECT to_regclass('public."User"') AS users,
       to_regclass('public."Application"') AS applications,
       to_regclass('public."JobSeekerProfile"') AS profiles,
       to_regclass('public."Resume"') AS resumes;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Application', 'JobSeekerProfile', 'Resume')
ORDER BY table_name, ordinal_position;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('Application', 'JobSeekerProfile', 'Resume')
ORDER BY tablename, indexname;

SELECT conrelid::regclass AS table_name, conname,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid IN (
    to_regclass('public."Application"'),
    to_regclass('public."JobSeekerProfile"'),
    to_regclass('public."Resume"')
  )
ORDER BY conrelid::regclass::text, conname;
```

Compare every candidate SQL statement with these results. Do not infer absence
of partial SQL from `applied_steps_count = 0`. For the reported fresh-database
error (`42P01`, missing `Application`), the first statement fails: no candidate
tables or `resumeId` column should exist. Other failures need separate diagnosis.

## Failed-first-statement recovery

Proceed only if the old candidate row has `finished_at IS NULL`,
`rolled_back_at IS NULL`, its log confirms the missing `Application` error,
and inspection confirms no candidate DDL was applied. Exit psql with `\q`.

```bash
npx prisma migrate resolve --rolled-back 20261018000000_candidate_profiles_resumes --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

Resolve records a rollback; **it does not undo SQL**. Deploy applies the initial
migration if needed, then the renamed candidate migration. Omit resolve if the
old failure is already rolled back. If no old record exists, simply deploy.
A failed initial migration requires separate inspection and recovery.

## Other states

- **Partial SQL exists:** stop. Do not drop tables/columns or retry the full SQL.
  Back up, inspect existing rows, and prepare a reviewed forward repair containing
  only missing DDL. Verify all columns, indexes, constraints and prerequisites
  before marking the renamed migration applied. Account for the old failed
  migration's SQL effects before resolving it. No generic repair is safe here.
- **Old candidate name succeeded:** never mark it rolled back or rerun its SQL.
  Compare the recorded checksum with the command below and verify the complete
  live schema. Only when both match, reconcile the new identity without SQL:

  ```bash
  shasum -a 256 prisma/migrations/202610180002_candidate_profiles_resumes/migration.sql
  npx prisma migrate resolve --applied 202610180002_candidate_profiles_resumes --schema prisma/schema.prisma
  npx prisma migrate status --schema prisma/schema.prisma
  ```

  The old successful record stays as evidence. Coordinate this history
  reconciliation before rollout; `migrate dev` can report divergence on databases
  with the old successful name. Never reset a database containing useful data.

Do not manually edit `_prisma_migrations`, use `migrate reset` or `db push`, or
run demo seeds as part of production recovery. See Prisma's
[failed migration recovery documentation](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing).

## Railway rollout

Keep backend root `server` and existing `server/railway.json`: build with
`npm run db:generate && npm run build`, pre-deploy with `npm run db:migrate`,
and start with `npm start`.

Set `DATABASE_URL` to the Railway PostgreSQL reference, `JWT_SECRET` to a random
secret of at least 32 characters, and `CLIENT_ORIGIN` to the exact frontend HTTPS
origin. Missing database/JWT variables are environment configuration failures;
retain strict Zod validation. Frontend `VITE_API_BASE_URL` is the backend HTTPS
URL ending in `/api`. Never expose backend secrets through `VITE_` variables.

After the appropriate recovery branch, redeploy the corrected revision. Verify
migration status, pre-deploy and startup logs, then authenticated API/UI flows.
Production recovery and deployment remain unverified until executed in Railway.
