# JAIP Backend

This repository Capstan-deploys the JAIP Backend, so that it is service-locatable by the JAIP frontend.

## Development Setup

### Requirements
1. We use yarn for dependency management. Install this tool before developing in this codebase.
1. This project requires a postgres database. A dbml template is included, along with a setup script that will provide initial starting values.
1. Development in this project requires access to the [ITHAKA CLI tool](https://github.com/ithaka/ithaka-cli?tab=readme-ov-file) and the ITHAKA VPN in order to take advantage of the Polaris sidecar for service discovery.

### Install Dependencies
```
$ yarn install
```

### Environment
Check the example.env file to see the required environment variables used in local development (e.g., for a database connection). Add a `.env` file in the project's root directory containing appropriate values.

### Development
1. Start the Polaris sidecar
```
ithaka sidecar polaris
```
1. Start the local server
```
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
