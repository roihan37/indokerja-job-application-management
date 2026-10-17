# REST API Documentation

**Project:** IndoKerja Job Application Management  
**Assessment:** IndoKerja.id Full Stack Developer  
**API style:** REST + JSON  
**Suggested local base URL:** `http://localhost:4000/api`  
**Status:** **Proposed API contract, not a verified record of implemented endpoints.** Update this file to reflect the actual routes, payloads, and HTTP responses before submission.

> **Source of requirements:** IndoKerja.id technical assessment and repository `AGENTS.md`. The assessment defines functionality and technologies, **not** route names or JSON payloads. The endpoint paths, response envelope, ID strings, job-type values, and salary convention below are implementation decisions proposed for this project.

## 1. General Conventions

### Authentication

- The login endpoint is public. All other endpoints in this draft require a valid JWT access token.
- Send authenticated requests with `Authorization: Bearer <access_token>`.
- The server determines the user's role and identity from the verified token, **never** from user-supplied `role`, `companyId`, or `jobSeekerId` fields.
- Supported roles: `JOB_SEEKER` and `COMPANY`.
- Public registration is **out of scope**; use seeded demo accounts for evaluation.

### Content type and IDs

- Request/response content type: `application/json`.
- `:id` is an opaque database identifier (string). Example values such as `job_123` are illustrative, not a required Prisma ID format.
- Timestamps use ISO 8601 in UTC, for example `2026-10-18T02:00:00.000Z`.
- **Proposed salary convention:** `salary` is a nonnegative integer indicating **IDR per month**, with `0` representing an unspecified amount only if the application explicitly supports that convention. To avoid ambiguity, prefer a documented nonnegative integer salary for this assessment.
- **Suggested job types:** `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`. These are proposed API enum values, not categories specified by the assessment.

### Consistent success format

```json
{
  "success": true,
  "data": {}
}
```

### Consistent error format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "field": "title", "message": "Title is required" }
    ]
  }
}
```

`details` is optional. Do not leak passwords, hashes, tokens, database queries, or stack traces in error responses.

| HTTP | Meaning | Example error code |
| --- | --- | --- |
| `200 OK` | Successful read or update | Not applicable |
| `201 Created` | Job or application created | Not applicable |
| `400 Bad Request` | Invalid input | `VALIDATION_ERROR` |
| `401 Unauthorized` | No/invalid token or invalid login | `UNAUTHORIZED`, `INVALID_CREDENTIALS` |
| `403 Forbidden` | Wrong role or resource not owned by requester | `FORBIDDEN` |
| `404 Not Found` | Resource not found | `NOT_FOUND` |
| `409 Conflict` | Duplicate job application | `ALREADY_APPLIED` |
| `500 Internal Server Error` | Unexpected server error | `INTERNAL_SERVER_ERROR` |

## 2. Endpoint Summary

| Method | Endpoint | Allowed role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Sign in and receive JWT |
| `GET` | `/api/jobs` | `JOB_SEEKER`, `COMPANY` | List available jobs |
| `GET` | `/api/jobs/:id` | `JOB_SEEKER`, `COMPANY` | View job detail |
| `POST` | `/api/jobs` | `COMPANY` | Create job owned by signed-in company |
| `POST` | `/api/jobs/:id/applications` | `JOB_SEEKER` | Apply to a job |
| `GET` | `/api/applications/me` | `JOB_SEEKER` | List signed-in seeker's applications |
| `GET` | `/api/jobs/:id/applications` | Owning `COMPANY` | View applicants for own job |
| `PATCH` | `/api/applications/:id/status` | Owning `COMPANY` | Change application status and save history |

The paths above match the *suggested routes* in `AGENTS.md`. Implement them consistently or update this document when changing the backend contract.

## 3. Authentication

### `POST /api/auth/login`

**Access:** Public  
**Purpose:** Authenticate a seeded Job Seeker or Company account.

**Request**

```json
{
  "email": "seeker@example.com",
  "password": "<demo-password>"
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "accessToken": "<signed-jwt>",
    "tokenType": "Bearer",
    "user": {
      "id": "usr_123",
      "email": "seeker@example.com",
      "role": "JOB_SEEKER"
    }
  }
}
```

**Failures:** `400` invalid input; `401` invalid credentials. Password hashes must never appear in responses.

## 4. Jobs

### `GET /api/jobs`

**Access:** `JOB_SEEKER` or `COMPANY`  
**Purpose:** Display job listings with title, company, location, salary, and job type.

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "job_123",
      "title": "Frontend Developer",
      "company": {
        "id": "cmp_123",
        "name": "Example Technology"
      },
      "location": "Jakarta",
      "salary": 8500000,
      "jobType": "FULL_TIME",
      "createdAt": "2026-10-18T02:00:00.000Z"
    }
  ]
}
```

**Failures:** `401` unauthenticated. Empty list returns `200` with `data: []`.

### `GET /api/jobs/:id`

**Access:** `JOB_SEEKER` or `COMPANY`  
**Purpose:** Retrieve job details before applying.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "job_123",
    "title": "Frontend Developer",
    "company": {
      "id": "cmp_123",
      "name": "Example Technology"
    },
    "location": "Jakarta",
    "salary": 8500000,
    "jobType": "FULL_TIME",
    "description": "Build and maintain web interfaces.",
    "createdAt": "2026-10-18T02:00:00.000Z"
  }
}
```

**Failures:** `401` unauthenticated; `404` nonexistent job.

### `POST /api/jobs`

**Access:** `COMPANY` only  
**Purpose:** Create a job for the authenticated company.

**Request**

```json
{
  "title": "Frontend Developer",
  "location": "Jakarta",
  "salary": 8500000,
  "jobType": "FULL_TIME",
  "description": "Build and maintain web interfaces."
}
```

**Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "job_123",
    "companyId": "cmp_123",
    "title": "Frontend Developer",
    "location": "Jakarta",
    "salary": 8500000,
    "jobType": "FULL_TIME",
    "description": "Build and maintain web interfaces.",
    "createdAt": "2026-10-18T02:00:00.000Z"
  }
}
```

**Validation:** Require nonempty `title` and `location`, nonnegative integer `salary`, supported `jobType`, and optional string `description` (with reasonable length limits). `companyId` must be derived from the authenticated company account, not request input.

**Failures:** `400` invalid input; `401` unauthenticated; `403` wrong role.

## 5. Applications

### `POST /api/jobs/:id/applications`

**Access:** `JOB_SEEKER` only  
**Purpose:** Apply to a job once per `(jobId, jobSeekerId)` pair.

**Request:** No request body is needed; infer the job from `:id` and Job Seeker from the JWT.

**Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "app_123",
    "jobId": "job_123",
    "jobSeekerId": "usr_123",
    "status": "Applied",
    "createdAt": "2026-10-18T03:00:00.000Z"
  }
}
```

**Rules:**

- Create the application with status `Applied`.
- Store an initial `ApplicationHistory` record (`previousStatus: null`, `newStatus: "Applied"`), as recommended by `AGENTS.md`.
- Enforce unique `(jobId, jobSeekerId)` in PostgreSQL/Prisma, not only in the UI.
- Convert Prisma unique-constraint errors to `409 Conflict`, including when two requests arrive concurrently.

**Duplicate response `409`**

```json
{
  "success": false,
  "error": {
    "code": "ALREADY_APPLIED",
    "message": "You have already applied to this job"
  }
}
```

**Other failures:** `401` unauthenticated; `403` wrong role; `404` job not found.

### `GET /api/applications/me`

**Access:** `JOB_SEEKER` only  
**Purpose:** Show the authenticated seeker's applications and their current statuses.

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "app_123",
      "status": "Reviewing",
      "job": {
        "id": "job_123",
        "title": "Frontend Developer",
        "company": { "id": "cmp_123", "name": "Example Technology" },
        "location": "Jakarta"
      },
      "createdAt": "2026-10-18T03:00:00.000Z",
      "updatedAt": "2026-10-18T04:00:00.000Z"
    }
  ]
}
```

**Rules:** Filter by `jobSeekerId` from JWT. Return `200` and `data: []` when no applications exist. Never return other users' applications.

**Failures:** `401` unauthenticated; `403` wrong role.

### `GET /api/jobs/:id/applications`

**Access:** `COMPANY` owning the specified job  
**Purpose:** View candidates who applied to one of the company's jobs.

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "app_123",
      "status": "Reviewing",
      "jobSeeker": {
        "id": "usr_123",
        "email": "seeker@example.com"
      },
      "createdAt": "2026-10-18T03:00:00.000Z"
    }
  ]
}
```

**Rules:** Check job ownership using the authenticated company's identity **before** returning candidate information. Do not expose password hashes or unrelated applicants.

**Failures:** `401` unauthenticated; `403` wrong role or a job owned by another company; `404` nonexistent job.

### `PATCH /api/applications/:id/status`

**Access:** `COMPANY` owning the application’s job  
**Purpose:** Update an applicant’s status and persist an audit history entry.

**Request**

```json
{
  "status": "Shortlisted"
}
```

**Allowed values (exact spelling and case):**

| Value | Meaning |
| --- | --- |
| `Applied` | Initial application / applied |
| `Reviewing` | Company is reviewing |
| `Shortlisted` | Candidate has been shortlisted |
| `Rejected` | Application rejected |
| `Accepted` | Application accepted |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "app_123",
    "jobId": "job_123",
    "status": "Shortlisted",
    "updatedAt": "2026-10-18T05:00:00.000Z"
  }
}
```

**Rules:**

1. Verify the user has role `COMPANY` and owns the job linked to this application.
2. Validate that `status` is one of the five supported values.
3. If the status **changes**, atomically update `Application.status` and create an `ApplicationHistory` record with `previousStatus`, `newStatus`, `changedById`, and timestamp, using a Prisma transaction.
4. **Proposed no-op policy:** if the requested status already equals the current status, return `200` with the unchanged application; do **not** add a history entry. Document any different implementation.
5. Do not permit modification of `jobId`, `jobSeekerId`, or company ownership through this endpoint.

**Failures:** `400` invalid status; `401` unauthenticated; `403` wrong role or non-owned application; `404` nonexistent application.

## 6. Application History: Data Requirement

History storage is **mandatory** in the assessment, but an HTTP endpoint to read history is **not** specified. The backend must preserve records such as:

```json
{
  "id": "hist_123",
  "applicationId": "app_123",
  "previousStatus": "Applied",
  "newStatus": "Reviewing",
  "changedById": "usr_company_123",
  "createdAt": "2026-10-18T04:00:00.000Z"
}
```

Recommended minimum relationship structure:

```text
User (JOB_SEEKER) 1 ── * Application * ── 1 Job * ── 1 Company
Application       1 ── * ApplicationHistory
User (COMPANY)    1 ── 1 Company    [simplest proposed account model]
```

The company-account association may differ in the actual Prisma schema, but ownership checks must remain enforced. No extra history-read endpoint is needed unless the UI requires one and the mandatory assessment features are already complete.

## 7. Authorization Matrix

| Operation | Job Seeker | Company | Other company's resource |
| --- | --- | --- | --- |
| Login | Yes | Yes | N/A |
| List / view jobs | Yes | Yes | Publicly listable to authenticated users |
| Create job | No | Yes | Company identity from JWT |
| Apply to job | Yes | No | N/A |
| View own applications | Yes | No | Never |
| View applicants of a job | No | Only own job | Forbidden |
| Change application status | No | Only own job | Forbidden |

Frontend guards are useful for navigation, but **all permission and ownership checks must be enforced on the backend**.

## 8. Validation and Security Checklist

- [ ] JWT is verified server-side on protected routes.
- [ ] Passwords are stored as secure hashes and never returned by APIs.
- [ ] Request bodies, params, and optional query parameters are validated.
- [ ] Login, job creation, apply, applicant listing, and status update enforce roles.
- [ ] Resource ownership is verified before returning or updating applicants.
- [ ] `(jobId, jobSeekerId)` has a database-level composite unique constraint.
- [ ] Application creation and initial history insertion are transactional.
- [ ] Status mutation and its history insertion are transactional.
- [ ] Prisma unique-constraint errors result in `409` on duplicate applications.
- [ ] Errors return a consistent JSON format and do not expose internal details.
- [ ] All data is stored in PostgreSQL and survives restarts.

## 9. Minimum API Test Scenarios

1. **Login:** valid seeded credentials -> `200`; wrong password -> `401`.
2. **List/details:** authenticated Job Seeker can view jobs; unknown job -> `404`.
3. **Create job:** Company -> `201`; Job Seeker -> `403`; invalid input -> `400`.
4. **Apply:** Job Seeker -> `201` and an initial history record; same job twice -> `409`.
5. **My applications:** only the authenticated seeker's records are returned.
6. **View applicants:** owning Company -> `200`; unrelated Company -> `403`.
7. **Change status:** owning Company -> `200`; current status and history both persist.
8. **No-op update:** unchanged status does not append a redundant history record.
9. **Cross-company access:** cannot inspect or change another company's applications.
10. **Unauthorized access:** missing/invalid bearer token -> `401`.

## 10. Example cURL Requests

Set base URL and token for local testing:

```bash
BASE_URL="http://localhost:4000/api"
# Replace with a token returned by a real login call.
TOKEN="<access-token>"
```

Login:

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"seeker@example.com","password":"<demo-password>"}'
```

List jobs:

```bash
curl "$BASE_URL/jobs" \
  -H "Authorization: Bearer $TOKEN"
```

Apply to a job (use a Job Seeker token):

```bash
curl -X POST "$BASE_URL/jobs/job_123/applications" \
  -H "Authorization: Bearer $TOKEN"
```

Change an application status (use a token for the Company that owns its job):

```bash
curl -X PATCH "$BASE_URL/applications/app_123/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"Reviewing"}'
```

> Replace sample IDs, accounts, and tokens with real seeded data. These commands illustrate the intended contract; they do not prove a running backend.

## 11. Before Submission

- [ ] Check every path and payload against the **actual implementation**; remove or edit anything that differs.
- [ ] Confirm response codes with API tests and live requests, rather than assuming the examples are correct.
- [ ] Ensure the README explains server environment variables, Prisma migrations, seeding, startup, and demo credentials.
- [ ] Verify the deployed frontend can call the deployed API and the PostgreSQL database is reachable.
- [ ] Include this file at `docs/api.md` in the submitted repository.

**Priority:** Complete and verify required features, deployment, and documentation within the **30-hour submission deadline**. Do not add optional API features just for completeness.
