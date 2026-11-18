# Backend structure and Sequelize

The Express API is organized by feature. Database models are centralized because
patients, notes, users, prescriptions, bills, and documents share relationships.

```text
apps/server/
  src/
    app.ts                       HTTP middleware and feature routing
    index.ts                     Start/stop the HTTP server and connection pool
    config/env.ts                Environment settings
    database/
      sequelize.ts               PostgreSQL connection and model defaults
      models/                    Typed Sequelize models and associations
      migrations/                Versioned schema changes
      migrator.ts                Umzug runner with SequelizeMeta history
      migrate.ts                 Migration command
      seeders/demo.ts            Transactional, repeatable sample data
      seed.ts                    Migration + seed command
    middleware/
      require-auth.ts            Cognito token verification and profile lookup
      require-role.ts            Role checks
      permissions.ts             Patient chart query restriction
      async-handler.ts           Forward async controller errors to Express
      error-handler.ts           Safe HTTP error responses
    features/
      patients/
        patient.routes.ts
        patient.controller.ts
        patient.service.ts
      clinical-notes/
      prescriptions/
      billing/
      documents/
      dashboard/
      portal/
      users/                     Profile lookup and Cognito linking
  tests/
    database.integration.test.ts
    fixtures/                    Old SQL used only to test compatibility
```

## Request flow

For `GET /api/patients`:

1. `app.ts` applies the shared API authentication and role checks.
2. `require-auth.ts` verifies the Cognito access token and uses the user service
   to resolve its `sub` with `User.findOne`.
3. The patients router invokes the controller through `asyncHandler`.
4. The controller calls the patient service.
5. The service applies `patientWhere` and calls `Patient.findAll`.
6. Sequelize generates parameterized PostgreSQL queries and maps snake_case
   columns to camelCase model attributes.
7. The controller returns JSON; errors go to the central error handler.

Controllers handle HTTP. Services contain application rules and ORM operations.
Models define attributes and relationships. The frontend remains in Next.js;
the API doesn't have a views folder or server-rendered templates.

API paths remain unchanged. Billing amounts are normalized to numbers, date-only
fields stay `YYYY-MM-DD`, and timestamps serialize as ISO strings. Password hashes
are excluded from normal user queries and profile responses.

## Database commands

From the repository root:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

`db:migrate` applies pending Sequelize migrations using Umzug. It records completed
migrations in `SequelizeMeta`. `db:migrate:auth` is retained as a compatibility alias
and now runs all pending migrations.

`db:seed` also applies pending migrations, then inserts the original demo data in
one transaction. Existing rows are found by their original unique identifiers and
left unchanged. It does not reset the database, update edited demo rows, overwrite
Cognito links, or create Cognito accounts.

`auth:link` uses the user service and a transaction with a row lock. It still
requires an explicit Cognito `sub`; it rejects placeholders and reassignment to
another identity. Repeating a patient link without a chart argument now preserves
the existing chart mapping.

```bash
npm run auth:link -- clinician@clinic.local YOUR_ACTUAL_COGNITO_SUB
```

## Existing database compatibility

The two initial migrations support both an empty PostgreSQL database and the
previous SQL-created schema:

- `001-initial-schema` creates missing EHR tables and adopts existing ones.
- `002-cognito-sessions` adds missing identity/chart columns and session storage.

Existing table names, column names, primary keys, password hashes, Cognito links,
and session payloads remain intact. No `sync`, `alter`, or `force` schema operation
runs at application startup. Run migrations explicitly during deployment.

These adoption migrations intentionally refuse automatic rollback: tables and
identity columns can predate the migration history. A rollback that dropped them
could erase existing data. Make reviewed forward migrations for later changes.
For a new migration, add a file to `database/migrations` and register it in
`database/migrator.ts`; the same registry works in TypeScript and compiled JS.
Run one migration process at a time.

The Next.js server still owns login/session management. Its session-storage SQL
uses the same `web_sessions` table; the backend's model and migrations preserve
that interface. This refactor changes the Express backend, not the browser's
session flow.

PostgreSQL configuration comes from `DATABASE_URL`. Set `DATABASE_SSL=true` when
TLS is required, and provide a trusted CA through the normal Node.js trust setup
when needed. Certificate verification is enabled; it is not bypassed based on a
substring in the connection URL.

## Data behavior

List endpoints use stored data exclusively. An empty result is an empty array;
a database error returns a safe error response instead of fabricated records.
Dashboard counts and recent patients also come from PostgreSQL.

Patient queries are restricted at the database layer to the linked chart.
An absent chart link fails closed. Clinicians and administrators still have
registry-wide access in this learning app. The portal resolves its patient from
PostgreSQL, but its original appointment/last-visit display for `p-001` remains
sample data until appointment management is implemented.

## Verification

```bash
npm run build
npm run test --workspace apps/server
npm run test:integration --workspace apps/server
node scripts/smoke-auth.mjs
```

Unit tests cover JWT verification and patient restrictions. Integration tests use
real local PostgreSQL, creating fresh temporary databases whose names start with
`ehr_test_`. They test empty and legacy schemas, repeatable migration/seeding,
preserved identities and sessions, associations, JSON response fields, patient
isolation, dashboard counts, and safe database failures. The temporary databases
are deleted afterward; the developer's EHR database is not reset. The configured
local PostgreSQL role must be able to create databases. An optional
`TEST_DATABASE_ADMIN_URL` can supply another local administrative connection.

The HTTP smoke script needs both production builds first. It checks that protected
routes remain inaccessible without valid authentication, including the Next.js
session and proxy routes. A full browser login still requires the configured
Cognito user pool.
