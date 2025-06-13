# JAIP Backend

This repository Capstan-deploys the JAIP Backend, so that it is service-locatable by the JAIP frontend.

## Development Setup

### Requirements
1. We use yarn for dependency management. Install this tool before developing in this codebase.
1. This project requires a postgres database. A Prisma schema is included. See the Database section of this guide for more information on identifying the appropriate `DATABASE_URL`. 
1. Development in this project requires access to the [ITHAKA CLI tool](https://github.com/ithaka/ithaka-cli?tab=readme-ov-file) and the ITHAKA VPN in order to take advantage of the Polaris sidecar for service discovery.

### Install Dependencies
```
$ yarn install
```

### Environment
Check the `example.env` file to see the required environment variables used in local development (e.g., for a database connection). Add a `.env` file in the project's root directory containing appropriate values, as described in the example.

### Database
The database URL is kept in AWS Parameter Store, and is used to connect to the database. The correct values are available at `/test/labs/jaip/jaip-backend/database_url` and `/prod/labs/jaip/jaip-backend/database_url`. Generally, you should only need to use the test database, but it is occasionally useful to use production data locally, especially when handling bug reports. In that case change the ENVIRONMENT to `prod` and the DATABASE_URL to the production database URL. Using production data will also require a change to the ITHAKA sidecar command used for service discovery (use `ithaka sidecar polaris --env prod`). Obviously, be extremely cautious when working with production data.

There are only two databases for this application: `test` and `prod`. There is no development database at present. For most purposes, the `test` database should be fine for local development.

### Development
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
    "server":true,
    "service_discovery":true,
    "db":true
}
```
## Testing
Jest unit tests are run in Gitlab as part of the CI/CD pipeline with the command `yarn test:ci`. To test locally, use `yarn test`. 

## Building & Deployment
Deployment is handled by [Gitlab](https://gitlab.com/capstan/platform-apps/labs/constellate-backend) CI. There are test, deploy, and undeploy jobs defined in the `.gitlab-ci.yml` file, found in the project root.

The application is deployed to the ITHAKA POW platform known as [Capstan](https://wiki.ithaka.org/display/softdel/Capstan+Software+Delivery+Home). Capstan is a POW sanctioned Kubernetes cluster with first-class support for logging (to [captains-log](https://super-dashboard.apps.prod.cirrostratus.org/index/search)), metrics via prometheus, viewed in [grafana](http://grafana.acorn.cirrostratus.org/d/ac7795b9-1e37-4042-9fd6-fe81bcbdb47f/constellate-performance-prod), and visual graphs ([argo](https://argocd.eks.test.cirrostratus.org/)) of each deployed application on the platform. It also provides high reliability and scalability with the help of Kubernetes.

### Environment Specific Configurations
You can find these in the [k8s](k8s/) directory at the project root.
