# Cognito local setup

This integration adapts the AWS Express/EJS example to the existing Next.js UI.
Next.js owns OIDC login, the callback, refresh, and logout. Express verifies Cognito
access tokens and looks up application permissions in PostgreSQL. No Lambda,
EJS view engine, or extra hosted application is required.

## 1. Configure the existing Cognito app client

In the AWS console, open the user pool in **us-east-2 (Ohio)**:

- Pool ID: `us-east-2_mFzgDiirM`
- App client ID: `6k2due58lgrstqapb93q2rpcsf`
- Application type: Traditional web application (confidential client)
- Identity provider: Cognito user pool
- OAuth grant: Authorization code; do not enable implicit or client credentials
- Allowed scopes: `openid`, `email`, `profile`
- Allowed callback URL: `http://localhost:3000/api/auth/callback/cognito`
- Allowed sign-out URL: `http://localhost:3000`

Find these OAuth settings under **Applications > App clients > your client >
Login pages > Edit** (console labels can vary).
Find or create your domain under **Branding > Domain**. Use the complete HTTPS
origin, for example `https://your-prefix.auth.us-east-2.amazoncognito.com`, with no
`/login` or `/oauth2/authorize` path. Use a Cognito prefix domain for this exercise.

Select Essentials for managed login, keep public self-registration disabled, and
use authenticator-app MFA to avoid SMS delivery charges. This change does not
provision or update any AWS resource automatically.

## 2. Set local environment variables

A local `apps/web/.env.local` may already have been prepared with a generated
session secret. If it does not exist, copy `apps/web/.env.example` to that path.
Fill in:

- `COGNITO_DOMAIN`: the HTTPS domain from Branding > Domain
- `COGNITO_CLIENT_SECRET`: from Applications > App clients > your client
- `SESSION_SECRET`: at least 32 random characters, if not already generated

Generate a session secret if needed:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Keep this file private and uncommitted. Never put the client secret in a
`NEXT_PUBLIC_` variable or send it to the browser. Restart Next.js after changes.
The session secret encrypts stored token payloads; changing it invalidates sessions.

For Express, defaults already match this pool and the local database. For explicit
configuration, copy `apps/server/.env.example` to `apps/server/.env`.
A `.env` at the repository root is not read by the individual workspace processes.

## 3. Initialize the local database

Start Docker Desktop, then from the repository root:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

Sequelize migrations create or adopt the existing tables and add `users.cognito_sub`,
`users.patient_id`, and `web_sessions` when missing. Existing users, Cognito links,
and session payloads are preserved. The old `db:migrate:auth` command remains an
alias for `db:migrate`. The seed command also applies any pending migrations.

## 4. Create and link test users

Create a user under Cognito **User management > Users**, using an email address
you control. Copy that user's **sub** attribute. Do not copy its email address,
username, pool ID, or client ID in place of the sub.

Link it to an existing seeded application profile:

```bash
npm run auth:link -- clinician@clinic.local YOUR_CLINICIAN_SUB
```

For separate admin and patient test identities:

```bash
npm run auth:link -- admin@clinic.local YOUR_ADMIN_SUB
npm run auth:link -- patient@clinic.local YOUR_PATIENT_SUB p-001
```

The local profile email can differ from the Cognito email: this CLI command is an
explicit administrator-approved mapping, never automatic email-based linking.
Each Cognito sub can link to one local profile. Use separate test identities for
different roles. Patients must have a linked chart to gain access.
No role is accepted from a signup form or writable Cognito attribute.

## 5. Run and verify

```bash
npm run dev
```

Open `http://localhost:3000/login` and select **Sign in with Cognito**. Complete
any temporary-password and MFA setup that Cognito requests. After login, the
browser returns to the callback and then the dashboard.

Verify that:

- Reloading a protected page keeps the session.
- An unlinked Cognito account receives an access-denied message.
- A patient only receives records for the linked chart.
- Logging out clears the local session and redirects through Cognito logout.
- Calling `http://localhost:4000/api/patients` without a token returns 401.
- No access token, refresh token, or client secret appears in localStorage or
  browser API response payloads.

## Session behavior

Login uses PKCE S256, state, and nonce. Transactions expire after 10 minutes and
are consumed once. Every successful login receives a fresh random session ID.
The browser gets an HttpOnly, SameSite=Lax cookie; only a hash of its ID is stored
in PostgreSQL. Token payloads use AES-256-GCM encryption with `SESSION_SECRET`.
Sessions last at most eight hours. Expiring access tokens refresh on the server,
with a database row lock preventing parallel refresh requests. Refresh failures
require a fresh login. Expired sessions are cleaned up when new sessions start.
Production cookies require HTTPS through an HTTPS `APP_URL`.

Logout is a same-origin POST that deletes the server session and redirects to
Cognito's logout endpoint. It does not sign the user out of other devices or
revoke every access token previously issued to that user.

Browser requests go to an allowlisted, read-only `/api/ehr/*` Next.js proxy; Express
independently validates each access token's signature, issuer, expiry, client ID,
and access-token use. It resolves the stable sub to a database profile. Missing
credentials return 401, missing permission returns 403, and account database
failures return 503. Demo password login and registration return 410.

## Troubleshooting and limits

- **Sign-in unavailable:** check the client secret, domain, network access, and
  that PostgreSQL is running with the auth migration applied.
- **Redirect mismatch:** the configured callback must match exactly, including
  scheme, port, path, and trailing slash.
- **Account not linked:** rerun `auth:link` with the correct Cognito sub and local
  profile; include a chart ID for patients.
- **Logout rejected:** allow `http://localhost:3000` as a sign-out URL.
- **Database migration connection refused:** start Docker Desktop and run
  `npm run db:up` before retrying.

This remains a synthetic-data learning app. Staff currently have registry-wide
access. Care-team permissions, auditing, idle timeouts, infrastructure encryption,
operational controls, and broader EHR security still require separate work.
Adding Cognito does not establish HIPAA compliance.

References:
- https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html
- https://github.com/panva/openid-client
- https://github.com/awslabs/aws-jwt-verify
