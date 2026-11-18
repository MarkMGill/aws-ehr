# AWS EHR learning project

This repository is a hands-on, learning-focused EHR starter that combines a Next.js front end, an Express.js API, a PostgreSQL database, and AWS deployment concepts. The goal is to help you understand the core building blocks of an electronic health record system while practicing the full lifecycle from local development through infrastructure setup.

## Recommended structure

This project uses a monorepo layout so the front end and back end stay separate without making the codebase overly complex.

- `apps/web` — Next.js client application
- `apps/server` — Express.js API organized by feature
- `apps/server/src/database` — Sequelize models, versioned migrations, and seeders
- `infra/terraform` — AWS infrastructure as code for EC2, RDS, IAM, and S3
- `packages/shared` — shared types for future reuse

This aligns well with how many modern teams structure EHR systems:

- client and server are isolated for independent deployment and scaling
- shared contracts can be reused across services
- AWS infrastructure is deliberately separate from application code

## Local development

Requirements: Node.js 20 or newer, npm, Docker Desktop, and an AWS Cognito user pool.
The web app, API, and PostgreSQL can run locally; no EC2 or RDS deployment is required.

1. Install dependencies from the repository root:
   ```bash
   npm install
   ```
2. Configure Cognito using [docs/cognito.md](docs/cognito.md). Next.js reads
   `apps/web/.env.local`; Express reads `apps/server/.env`. The root `.env` is not
   automatically shared between these processes.
3. Start and initialize PostgreSQL:
   ```bash
   npm run db:up
   npm run db:migrate
   npm run db:seed
   ```
4. Create a test Cognito user and explicitly link its `sub` to a seeded profile:
   ```bash
   npm run auth:link -- clinician@clinic.local YOUR_COGNITO_SUB
   ```
5. Start both apps:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000/login`. The API health check is
   `http://localhost:4000/health`.

The old demo passwords no longer authenticate. Seeded users are local application
profiles; Cognito manages their login credentials. Database lookup failures deny
access rather than falling back to a demo user.

See [the backend architecture guide](docs/backend.md) for the route/controller/service
structure, database migration workflow, and integration tests.

## EHR features included

- Role-based authentication for clinicians, patients, and administrators
- Patient registry
- Clinical notes
- Prescriptions
- Billing records
- Document storage model
- HIPAA-oriented security baseline configuration and design guidance

## AWS architecture learning goals

This project intentionally includes a Terraform setup for the following AWS resources:

- EC2 instance for app hosting
- IAM role with least-privilege S3 access
- PostgreSQL RDS instance
- S3 bucket for document storage
- VPC and security group configuration
- CloudWatch log group

This is an educational baseline for understanding AWS architecture, not a production-ready HIPAA-compliant deployment.

## HIPAA and security notes

For a real healthcare deployment, you would also need to consider:

- encryption at rest and in transit
- IAM least privilege and MFA
- audit logging and immutable logs
- PHI segmentation and data retention policies
- WAF, API Gateway, CloudFront, and network isolation
- vulnerability and dependency scanning
- legal and compliance review with a compliance team or HIPAA counsel

This app is intended to teach the core technical patterns that matter most while building an EHR on AWS.
