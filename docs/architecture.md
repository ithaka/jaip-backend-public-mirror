## 🏗️ Architecture Overview

The JAIP Backend is built with modern Node.js technologies:

- **Framework**: Fastify with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session management + session-service integration
- **Deployment**: Kubernetes with Polaris service discovery
- **Infrastructure**: AWS RDS, S3, Parameter Store

## Subdomain Management

The API provides subdomain validation to support organization-specific patterns across different institutional deployments.

- **Validation endpoint**: `/api/v2/subdomains/validate`
- **Predefined lists**: Admin (`pep-admin`, `admin.pep`) and student (`pep`, `www.pep`) subdomains
- **Dynamic configuration**: Database queries for additional subdomain validation
- **Multi-tenant support**: Different user types and institutional configurations via subdomain routing

## 📈 Monitoring & Operations

### Health Checks

- **Liveness**: `/healthchecks/liveness`
- **Readiness**: `/healthchecks/readiness`

### Logging

- Structured logging with configurable levels
- Request/response logging via Fastify
- Error tracking and reporting
