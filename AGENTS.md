# AGENTS.md

## 1. Project Context

**Project:** IndoKerja Job Application Management  
**Repository:** `indokerja-job-application-management`  
**Type:** Full-stack technical assessment  
**Time limit:** 30 hours after the assessment is received (a submission deadline, not 30 hours of coding time).

Build a simple, fully functional job application management web app with two user roles: **Job Seeker** and **Company**.

This is a time-boxed assessment. Prioritize **working required features, secure authorization, correct relational data, clean code, tests, deployment, and documentation** over visual polish or additional features.

The official technical assessment document is the source of truth. If it conflicts with this file, follow the assessment document.

## 2. Required Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, TypeScript, **Express.js** (selected from the allowed Express/NestJS options) |
| Database | PostgreSQL |
| ORM | Prisma |
| API | REST API |

Implementation choices (not assessment mandates):
- React Router for frontend routing.
- Tailwind CSS for fast, responsive styling if helpful.
- Zod for request validation.
- JWT bearer authentication and secure password hashing (bcrypt or argon2).
- Vitest or Jest and an HTTP testing library for focused backend tests.

Do not switch frameworks, add a second ORM, or add infrastructure without a concrete requirement.

## 3. Scope: Mandatory Functional Requirements

### Authentication and authorization
- Users can log in as `JOB_SEEKER` or `COMPANY`.
- Enforce role-based permissions in the **backend**, not just in frontend navigation.
- Protected endpoints require authentication; unauthorized access is rejected consistently.

### Job Seeker
- View job listings showing **title, company, location, salary, and job type**.
- View a job's details.
- Apply to a job.
- View their own applications and current application statuses.
- Cannot apply to the **same job more than once**, including when requests race.

### Company
- Create new jobs associated with the authenticated company.
- View applicants **only for jobs belonging to their company**.
- Update applicant status to one of exactly:
  - `Applied`
  - `Reviewing`
  - `Shortlisted`
  - `Rejected`
  - `Accepted`
- Persist each actual status change in application history.

### Engineering quality
- Persist all application data in PostgreSQL.
- Use well-designed database relationships and migrations.
- Validate API input and return predictable errors.
- Implement responsive frontend pages.
- Keep implementation clear, maintainable, and easy to explain in a code walkthrough.

## 4. Non-Goals: Do Not Overengineer

Unless all mandatory work is finished and tested, **do not** add:
- AI recommendations, chat, WebSockets, notifications, or email sending.
- Redis, message queues, microservices, or event-driven architecture.
- Complex design systems, extensive animations, or an admin portal.
- Resume uploads, interview scheduling, advanced search, or analytics dashboards.
- A large documentation/harness hierarchy, speculative abstractions, or unnecessary packages.

A functional and deployed MVP is more important than optional enhancements.

## 5. Official Layer-Based Architecture

Use layer-based backend organization with this request flow:

**Routes → Controllers → Services → Prisma ORM → PostgreSQL**

The backend follows the layer-based structure below. Frontend folders remain guidance for its implementation. Create supporting files only when needed.

```text
indokerja-job-application-management/
├── AGENTS.md
├── README.md
├── .gitignore
├── client/
│   ├── .env.example
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── main.tsx
├── server/
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── jobs.routes.ts
│       │   ├── applications.routes.ts
│       │   └── index.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── jobs.controller.ts
│       │   └── applications.controller.ts
│       ├── services/
│       │   ├── auth.service.ts
│       │   ├── jobs.service.ts
│       │   └── applications.service.ts
│       ├── validators/
│       │   ├── auth.schema.ts
│       │   ├── jobs.schema.ts
│       │   └── applications.schema.ts
│       ├── middleware/
│       │   ├── authenticate.ts
│       │   ├── authorize.ts
│       │   ├── validate.ts
│       │   └── errorHandler.ts
│       ├── lib/
│       │   ├── prisma.ts
│       │   └── jwt.ts
│       ├── utils/
│       │   ├── AppError.ts
│       │   └── asyncHandler.ts
│       ├── types/
│       │   └── express.d.ts
│       ├── app.ts
│       └── server.ts
└── docs/
    └── api.md
```

### Layer responsibilities

- **Routes:** Register endpoints, apply authentication, role authorization, and validation middleware, then delegate to controllers. No business logic or database queries.
- **Controllers:** Read validated input and authenticated context, call services, and return the documented HTTP statuses and JSON envelopes. No Prisma queries or business rules.
- **Services:** Implement business rules and access PostgreSQL through Prisma. Accept typed values and authenticated identity rather than Express `Request` or `Response` objects. Enforce ownership, perform duplicate-application checks, and retain the database unique constraint and conflict handling for races. Create applications with their initial history atomically; update status and insert history in one transaction, preserving the documented no-op and concurrency behavior.
- **Validators:** Define Zod schemas for bodies, route parameters, and query parameters. Keep inferred input types alongside schemas; validation middleware makes parsed data available to controllers without unsafe casts.
- **Middleware:** Authenticate JWTs, enforce role permissions, validate requests, and handle errors centrally. Resource ownership remains a service responsibility.
- **Supporting files:** `lib/prisma.ts` provides the shared Prisma client; `lib/jwt.ts` centralizes token signing and verification settings. `utils/AppError.ts` represents safe application errors, and `types/express.d.ts` declares authenticated request context. `app.ts` composes Express without listening; `server.ts` handles configuration, database startup, listening, and shutdown. Retain useful configuration and domain type files in the appropriate layers.

Express 5 already forwards rejected async handlers to error middleware. The target `utils/asyncHandler.ts` is conditional: add it only if explicit async forwarding is needed; do not create a redundant wrapper or empty placeholder.

Do not organize backend source into feature folders such as `modules/auth`, `modules/jobs`, or `modules/applications`. Services query Prisma directly; do not add a Repository Pattern, CQRS, dependency-injection containers, microservices, Redis, queues, or unrelated dependencies. Create only files with an immediate purpose.

### Architecture maintenance

Keep validators and reusable middleware separate from thin controllers, services, and route modules. Startup lives in `server.ts`; update scripts and imports together when moving entry points. Preserve testability, JWT settings, ownership checks, duplicate conflict handling, and atomic history updates. Retain the service-level duplicate lookup while keeping the database constraint authoritative. Run formatting, lint, typecheck, build, and the focused PostgreSQL integration tests before frontend work. This architecture does not require additional endpoints or schema changes.

## 6. Database Design Rules

Implement the minimum appropriate relational model:

1. **User**: id, email (unique), password hash, role, timestamps.
2. **Company**: id, name, association to its authorized company user, timestamps.
3. **Job**: id, companyId, title, location, salary, jobType, optional description, timestamps.
4. **Application**: id, jobId, jobSeekerId, status, timestamps.
5. **ApplicationHistory**: id, applicationId, previousStatus (nullable for initial application), newStatus, changedById, createdAt.

Rules:
- Use Prisma relations and foreign keys; create and commit migrations.
- Add a database-level composite unique constraint on `Application(jobId, jobSeekerId)`.
- Initialize applications with status `Applied`.
- Prefer recording the initial `Applied` state as a history entry, in addition to recording every subsequent status change.
- Update status and insert its history entry **in one Prisma transaction**.
- Do not add a history entry when the status has not actually changed; choose and document a consistent no-op response.
- Use authorization checks when fetching or updating applications; a company must not access another company's applicants.
- Use appropriate database indexes for job and application lookups.
- Use a sensible salary representation, document units/currency, and validate nonnegative values.
- Never use frontend-supplied role, company ID, or job seeker ID as authorization proof. Derive identity from the authenticated server-side context.

## 7. REST API Guidance

Implement consistent endpoints. Suggested routes (adjust names consistently as needed):

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Login and receive a token |
| GET | `/api/jobs` | Job Seeker / Company | List jobs |
| GET | `/api/jobs/:id` | Job Seeker / Company | Job details |
| POST | `/api/jobs` | Company | Create a job |
| POST | `/api/jobs/:id/applications` | Job Seeker | Apply to a job |
| GET | `/api/applications/me` | Job Seeker | View own applications |
| GET | `/api/jobs/:id/applications` | Owning Company | View applicants for a job |
| PATCH | `/api/applications/:id/status` | Owning Company | Update an application status |

API requirements:
- Use standard HTTP statuses: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500` as appropriate.
- Validate `body`, `params`, and `query` inputs where applicable.
- Return consistent JSON error envelopes, with safe and useful messages.
- Handle duplicate applications as `409 Conflict` (including database unique-constraint errors).
- Never expose password hashes, JWT secrets, raw stack traces, or unrelated users' records.
- Document request/response examples and role restrictions in `docs/api.md`.

Registration is **not explicitly required** by the assessment. Prefer seeded demo accounts for both roles instead of expanding scope unless registration is needed for a functional demo.

## 8. Frontend Guidance

Required user journeys:

**Job Seeker:** login → job list → job detail → apply → my applications/status.

**Company:** login → company dashboard/jobs → create job → view applicants → change status.

Frontend requirements:
- Show loading, empty, success, and error states where needed.
- Prevent accidental double submission of Apply actions in the UI, while enforcing uniqueness in the database.
- Guard routes by login state and role, but treat backend authorization as authoritative.
- Build usable layouts on mobile and desktop.
- Prefer reusable form, feedback, and navigation components without premature abstraction.
- Keep API calls in a service module rather than spreading raw fetch logic across every page.
- Maintain consistency between displayed statuses and backend enum values.

## 9. Security, Reliability, and Code Quality

- Keep secrets and real `.env` files out of Git; provide only `.env.example` files with placeholder values.
- Store password hashes, not plaintext passwords.
- Validate tokens, authentication, role, and resource ownership on protected routes.
- Use Prisma parameterized queries and avoid unsafe raw SQL.
- Catch async errors with centralized Express error middleware.
- Follow the layer boundaries in section 5; keep controllers thin and business logic in services.
- Enable TypeScript strict mode; avoid `any` without a documented reason.
- Prefer straightforward, readable code over clever abstractions.
- Never silence failing tests or weaken security checks simply to make CI pass.

### Code Style & Readability

- Use Prettier: 2 spaces, single quotes in JavaScript/TypeScript, semicolons, trailing commas, and an 80-character print width. Run `npm run format` or `npm run format:check` inside each initialized application.
- Use TypeScript-aware ESLint and strict TypeScript. Run `npm run lint` and `npm run typecheck`; do not suppress failures or introduce unjustified `any` types.
- Group imports as side effects, Node built-ins, external packages, then local modules, with blank lines between groups. Sort module paths within groups and named imports alphabetically; use explicit type imports. Avoid an import-sorting dependency solely for this convention.
- Use descriptive camelCase names for values/functions, PascalCase for types/React components, and UPPER_SNAKE_CASE for fixed configuration constants. Avoid unnecessary abbreviations, oversized functions, and deeply nested conditionals; use braces and early returns.
- Use async/await consistently with centralized error handling. Keep inferred request types with their Zod schemas and prefer Prisma-generated domain types where appropriate; follow section 5 for backend layer responsibilities.
- For future frontend code, use functional TypeScript components, PascalCase component files and `useCamelCase` hooks. Keep API calls in service modules and handle loading, empty, success, and error states explicitly. Reuse components when they remove real duplication.
- Comments should explain non-obvious business or security decisions in concise English. Preserve the API contract in `docs/api.md`; report inconsistencies before changing it, and never change API behavior solely for architecture or style.
- Keep formatting and refactors scoped. Add tooling to future applications when initialized; verify formatting, lint, typecheck, build, and relevant tests before reporting completion.

## 10. Mandatory Tests to Prioritize

At minimum, cover:

1. Successful login and rejection of invalid credentials.
2. A Job Seeker can list, view, and apply to jobs.
3. Duplicate application is rejected, including the database constraint.
4. A Job Seeker cannot create jobs or change statuses.
5. A Company can create a job and see applications for its own job.
6. A Company cannot read or update applications belonging to another company.
7. A status update persists both the current status and a matching history record.
8. Invalid request data produces a clean validation error.

Also perform a manual end-to-end check in the deployed application using seeded demo accounts.

## 11. Codex / Coding Agent Workflow

When implementing a feature:

1. Read this file and inspect the relevant existing code before editing.
2. Identify the smallest vertical slice needed for the mandatory requirement.
3. Implement database changes first when necessary, then backend API, then frontend integration.
4. Run the relevant lint, typecheck, tests, and production builds if scripts exist; add simple scripts when missing.
5. Fix regressions before proceeding to another feature.
6. Summarize **what changed, which commands were run, what passed/failed, and what remains**.
7. Avoid large unrelated refactors and unnecessary dependencies.

**Do not claim a test, command, or deployment passed unless it was actually run and verified.**

When a choice is ambiguous, prefer the simplest implementation that satisfies the assessment and document the assumption. Ask for clarification only when proceeding would risk a material conflict with the explicit requirements.

## 12. Execution Priorities for the 30-Hour Deadline

### P0: Must finish first
- Database schema and migrations.
- Seed demo data: at least two companies, jobs, one Job Seeker, and accounts that demonstrate role boundaries.
- Working login/authentication and role permissions.
- Job listing and detail endpoints/pages.
- Create job, apply job, my applications, company applicant list.
- Status update with persistent application history.
- Duplicate application protection.

### P1: Required quality and submission readiness
- API validation and centralized error handling.
- Responsive UI and complete core user journeys.
- Targeted tests.
- Production build, deployment, reachable app and API, and deployed database migrations.
- README, `.env.example`, API documentation, demo credentials, and source code in Git.

### P2: Only if time remains
- Nonessential UI polish, optional filters, expanded test coverage, and minor developer-experience improvements.

**Do not defer deployment until the final minutes.** Deploy an early working version, then validate the final deployment after changes.

## 13. Definition of Done

A feature is complete only when:
- It works through the UI and REST API.
- Authentication, role checks, and ownership checks are enforced where applicable.
- Inputs are validated and errors handled.
- Relevant data survives server restarts in PostgreSQL.
- Related checks/tests pass or any remaining limitation is explicitly reported.

The assessment submission is ready only when:
- Frontend and backend source code are pushed to the repository.
- Database migration/schema is committed.
- `README.md` explains local setup, environment variables, migrations, seeding, and how to run the app.
- `docs/api.md` explains the important API endpoints.
- Frontend and backend are accessible in a deployed environment for review.
- Demo account credentials are documented for testing; demo-only passwords must not be reused elsewhere.
- Repository and deployed-app links are included in a **new Google Doc created by the candidate** (do not edit the master assessment file).
- The assessment is submitted using the required form: `https://forms.gle/rtBb6qqejXENSGkV8`.

**Submission rule:** Submit the current work even if incomplete rather than missing the 30-hour deadline. Clearly document incomplete items instead of pretending they work.
