# Database

PostgreSQL with Prisma ORM. Connection URLs in AWS Parameter Store.

## Quick Setup

```bash
# 1. Get database URL
aws ssm get-parameter --name "/test/labs/jaip/jaip-backend/database/dev/url" --with-decryption

# 2. Add to .env
DATABASE_URL="your_connection_string"

# 3. Generate client
yarn dlx prisma generate
```

## Environments

| Environment     | Database   | Parameter Store Path                            |
| --------------- | ---------- | ----------------------------------------------- |
| **Development** | `jaip_dev` | `/test/labs/jaip/jaip-backend/database/dev/url` |
| **Test**        | `jaip`     | `/test/labs/jaip/jaip-backend/database/url`     |
| **Production**  | `jaip`     | `/prod/labs/jaip/jaip-backend/database/url`     |

## Common Commands

```bash
# Schema changes
yarn dlx prisma db push           # Push schema to DB
yarn dlx prisma migrate dev       # Create migration
yarn dlx prisma generate          # Generate client

# Database operations
yarn dlx prisma db pull           # Pull schema from DB
yarn dlx prisma studio            # Browse data
```

## Development Database

Use `jaip_dev` for local development to avoid disrupting test environment.

**Recreate if corrupted:**

```sql
DROP DATABASE jaip_dev;
CREATE DATABASE jaip_dev WITH TEMPLATE jaip OWNER admin_user;
```

**Service discovery:** Use `ithaka sidecar polaris --env prod` when connecting to production data.

## Handling migrations

Changes to the database structure should be handled using [Prisma's migrations system](https://www.prisma.io/docs/orm/prisma-migrate). However, three important aspects of the database are not handled directly by Prisma's migrations system, and must be added manually using the patterns described in [Prisma's documentation for customizing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations). These three things must be added manually:

1. Modules
1. Permissions
1. Stored procedures and functions

A typical process for adding a new permission might look something like this:

1. `yarn dlx prisma migrate dev --create-only`
1. That will create a new, empty migration file. You can then edit that migration file with whatever you need. E.g., `GRANT SELECT ON TABLE public.table_name TO role_name; `
1. `yarn dlx prisma migrate dev`, which will apply
