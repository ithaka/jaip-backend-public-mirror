# JAIP Backend

This repository Capstan-deploys the JAIP Backend, so that it is service-locatable by the JAIP frontend.

## Development Setup

### Requirements

1. We use yarn for dependency management. Install this tool before developing in this codebase.
1. This project requires a postgres database. A Prisma schema is included. See the Database section of this guide for more information on identifying the appropriate `DATABASE_URL`.
1. Development in this project requires access to the [ITHAKA CLI tool](https://github.com/ithaka/ithaka-cli?tab=readme-ov-file) and the ITHAKA VPN in order to take advantage of the Polaris sidecar for service discovery.

### Install Dependencies

[Install `nvm` for managing the project node version.](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)

Activate the pinned node version based on this project's `.nvmrc` file.

```
$ nvm use
```

If you do not have that node version on your local machine, `nvm` will say so. Use `nvm install` to install the pinned version.

Finally, install project depdendencies:

```
$ yarn install
```

### Environment

Check the `example.env` file to see the required environment variables used in local development (e.g., for a database connection). Add a `.env` file in the project's root directory containing appropriate values, as described in the example.

### Database

The database URL is kept in AWS Parameter Store, and is used to connect to the database. The correct values are available at `/test/labs/jaip/jaip-backend/database/url` and `/prod/labs/jaip/jaip-backend/database/url`. Generally, you should only need to use the test database, but it is occasionally useful to use production data locally, especially when handling bug reports. In that case change the ENVIRONMENT to `prod` and the `DATABASE_URL` to the production database URL. Using production data will also require a change to the ITHAKA sidecar command used for service discovery (use `ithaka sidecar polaris --env prod`). Obviously, be extremely cautious when working with production data.

There are two main RDS clusters for this application: one in `TEST` and one in `PROD`. In the `PROD` cluster, there is a single database, `jaip`. In the `TEST` cluster, there is a `jaip` database, used in the test deployment. There is also a development database, `jaip_dev`. The URL for this database is available in AWS Parameter store at `/test/labs/jaip/jaip-backend/database/dev/url`. This can be used to make changes that would otherwise disrupt the primary `jaip` database in `TEST`. Conversely, it can be used for normal development purposes when a breaking change is in `TEST`. Note that this database is not created by the CloudFormation template, because CF does not currently support creating multiple databases during the creation process.

If the `jaip_dev` database should become damaged or excessively separated from the `jaip` database, it can be dropped and recreated with `jaip` as a template.

```sql
DROP DATABASE jaip_dev;
-- Replace admin_user with the admin user specified in AWS Parameter Store.
CREATE DATABASE jaip_dev WITH TEMPLATE jaip OWNER admin_user;
```

Note that this process will not work when there are open connections to `jaip`. There are two options for addressing this issue. One is to close down the `TEST` deployment of `jaip-backend`, which will terminate the existing connection. The other is to run the following command immediately prior to dropping the database and creating the new one:

```sql
SELECT
    pg_terminate_backend(pid)
FROM
    pg_stat_activity
WHERE
    -- don't kill my own connection!
    pid <> pg_backend_pid()
    -- don't kill the connections to other databases
    AND datname = 'jaip';
```

This will terminate any existing connections, but the backend will automatically reconnect. The interruption is minimal, but note that this is not a good strategy for `PROD`!

If additional database instances become necessary (e.g., if multiple devs are working on projects with incompatible database states), then it is possible to create additional copies, preferably using the branch name.

```sql
CREATE DATABASE branch_name WITH TEMPLATE jaip OWNER admin_user;
```

If this turns into a regular occurrence, consider running local instances.

### Database Changes

The `jaip` database configuration is defined in the `./prisma/schema.prisma`. Changes made there can be pushed to the database using `yarn dlx prisma db push`, as described in the Prisma docs.

In order to manage the database using Prisma, it is necessary to set the `DATABASE_URL` in `.env` to use the admin username and password. Like the regular username and password, these URLs are defined in AWS Parameter Store at `/test/labs/jaip/jaip-backend/database/admin/url` and `/prod/labs/jaip/jaip-backend/database/admin/url` for test and prod respectively.

For local development, a Prisma client should be generated with `yarn dlx prisma generate`

### Development

1. Install dependencies (note that a postinstall hook will also generate the Prisma client, which may take some time)

```sh
yarn install
```

1. Start the Polaris sidecar. Generally, use

```sh
ithaka sidecar polaris
```

If it is necessary to work with production data, use

```sh
ithaka sidecar polaris --env prod
```

1. Start the local server

```sh
yarn dev
```

1. Verify the server is running at `localhost:8080/api/v2/healthcheck`. This should confirm that the server, Polaris service discovery, and the database connection are all running. Expected response:

```json
{
  "server": true,
  "service_discovery": true,
  "db": true
}
```

## Routes

Routes in this application are built with a consistent structure. Within the `./routes` directory, each category of routes has its own directory. For example, there are directories for `auth`, `search`, and `media_review`. In some cases, where there are more complex sets of routes, there may be further subdirectories. For example, `site_administration` includes subdirectories for `features` and `groups`, and the features subdirectory itself includes subdirectories for `grouped` and `ungrouped` features.

Every route directory includes the following:

- `schemas.ts`
- `routes.ts`
- `handlers.ts`
- `options.ts`
- Either `route.test.ts` _or_ a `./__tests__` directory containing test files or further subdirectories to organize the test files
- Optionally, a `helpers.ts` file including functions that may be reused or otherwise abstracted from the route handlers

## Testing

Jest unit tests are run in Gitlab as part of the CI/CD pipeline with the command `yarn test:ci`. To test locally, use `yarn test`.

## Building & Deployment

Deployment is handled by [Gitlab](https://gitlab.com/capstan/platform-apps/labs/constellate-backend) CI. There are test, deploy, and undeploy jobs defined in the `.gitlab-ci.yml` file, found in the project root.

The application is deployed to the ITHAKA POW platform known as [Capstan](https://wiki.ithaka.org/display/softdel/Capstan+Software+Delivery+Home). Capstan is a POW sanctioned Kubernetes cluster with first-class support for logging (to [captains-log](https://super-dashboard.apps.prod.cirrostratus.org/index/search)), metrics via prometheus, viewed in [grafana](http://grafana.acorn.cirrostratus.org/d/ac7795b9-1e37-4042-9fd6-fe81bcbdb47f/constellate-performance-prod), and visual graphs ([argo](https://argocd.eks.test.cirrostratus.org/)) of each deployed application on the platform. It also provides high reliability and scalability with the help of Kubernetes.

### Environment Specific Configurations

You can find these in the [k8s](k8s/) directory at the project root.
