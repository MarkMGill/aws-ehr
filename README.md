# AWS EHR learning project

This repository is a hands-on, learning-focused EHR starter that combines a Next.js front end, an Express.js API, a PostgreSQL database, and AWS deployment concepts. The goal is to help you understand the core building blocks of an electronic health record system while practicing the full lifecycle from local development through infrastructure setup.

## Recommended structure

This project uses a monorepo layout so the front end and back end stay separate without making the codebase overly complex.

- `apps/web` — Next.js client application
- `apps/server` — Express.js API and database seed logic
- `apps/server/sql/schema.sql` — PostgreSQL schema for EHR entities
- `infra/terraform` — AWS infrastructure as code for EC2, RDS, IAM, and S3
- `packages/shared` — shared types for future reuse

This aligns well with how many modern teams structure EHR systems:

- client and server are isolated for independent deployment and scaling
- shared contracts can be reused across services
- AWS infrastructure is deliberately separate from application code

## Local development

1. Start PostgreSQL locally:
   ```bash
   docker compose up -d postgres
   ```
2. Seed the database:
   ```bash
   npm run db:seed --workspace apps/server
   ```
3. Start both apps in development mode:
   ```bash
   npm run dev
   ```
4. Open the app on `http://localhost:3000` and the API on `http://localhost:4000/health`

Demo logins:

- `clinician@clinic.local` / `Password123!`
- `patient@clinic.local` / `Password123!`
- `admin@clinic.local` / `Password123!`

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
