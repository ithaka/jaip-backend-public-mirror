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

## Environments and Roles

The test and production databases each have two accounts, a primary and an alternate, which are used for zero-downtime password rotation. The idea
is that the non-current role can be updated with a new password, the deployment can be altered to use that role with the new password, the application redeployed, and then the original role can also be updated with the new password (the process is described in detail in the password rotation section).

These roles are already established in the migration files.

| Environment     | Database   | Parameter Store Path                            | Role                              |
| --------------- | ---------- | ----------------------------------------------- | --------------------------------- |
| **Development** | `jaip_dev` | `/test/labs/jaip/jaip-backend/database/dev/url` | Primary                           |
| **Test**        | `jaip`     | `/test/labs/jaip/jaip-backend/database/url`     | Primary                           |
| **Production**  | `jaip`     | `/prod/labs/jaip/jaip-backend/database/url`     | Primary                           |
| **Test**        | `jaip`     | `/test/labs/jaip/jaip-backend/database/alt/url` | Alternate (for password rotation) |
| **Production**  | `jaip`     | `/prod/labs/jaip/jaip-backend/database/alt/url` | Alternate (for password rotation) |

## Common Commands

```bash
# Deploying
yarn dlx prisma migrate deploy    # Apply migration to the db currently listed in the .env

# Making changes
yarn dlx prisma migrate dev       # Create migration
yarn dlx prisma generate          # Generate client locally

# Database operations
yarn dlx prisma studio            # Browse data

# Depricated commands
yarn dlx prisma db push           # Screws up migrations
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

## Password Rotation

Passwords should be rotated every 6 months (this aligns with some external API key rotations). In order to rotate passwords with zero downtime, the following procedure should be followed:

1. There are two existing roles in the `test` and `prod` databases: `jaip_writer` and `jaip_writer_alt`. These are represented in AWS Parameter Store using the paths described in the Environments and Roles section.
1. First, determine which role is currently in use by checking the value of `JAIP_DB_URL` in `_setup.yml`. If the path ends in `/alt/url`, then the current role is `jaip_writer_alt`. Otherwise, the current role is `jaip_writer`.
1. Enter the `test` and `prod` databases and change the password for whichever role is _not_ current. E.g., if the current role is `jaip_writer`, use `ALTER ROLE jaip_writer_alt WITH PASSWORD 'new_password'`.
1. Update the value of the appropriate paths in Parameter Store. E.g., if the current role is `jaip_writer`, update `/test/labs/jaip/jaip-backend/database/alt/url` and `/prod/labs/jaip/jaip-backend/database/alt/url`. That is, update the value for whichever role is _not_ currently active.
1. Change the value of `JAIP_DB_URL` in `_setup.yml` to refer to whichever role is not current. E.g., if the current role is `jaip_writer`, change the value of `JAIP_DB_URL` to `/$API_TARGET/labs/jaip/jaip-backend/database/alt/url`. Conversely, if the current role is `jaip_writer_alt`, change the value of `JAIP_DB_URL` to `/$API_TARGET/labs/jaip/jaip-backend/database/url`.
1. Merge that change and redeploy in `test`.
1. Verify that the deployment was successful by visiting `test-pep.jstor.org`.
1. Deploy the change in `prod`.
1. Enter the `test` and `prod` databases and change the passwords of the original role to the new password. E.g., if this process started with `jaip_writer` as the active role, and you have now redeployed using `jaip_writer_alt`, change the password of `jaip_writer` with `ALTER ROLE jaip_writer WITH PASSWORD 'new_password'` in both databases.
1. Update the values for whatever role you just changed in Parameter Store. E.g., if this process started with `jaip_writer` as the active role, change the password for `jaip_writer` to `'new_password'` in `test/labs/jaip/jaip-backend/database/url` and `prod/labs/jaip/jaip-backend/database/url`.
1. Update any local `.env` files to reflect the changes and notify other developers of the change.
