# Getting Started

## Requirements

- Node.js (use `nvm use`)
- Yarn package manager
- PostgreSQL database ([Database Guide](database.md))
- [ITHAKA CLI](https://github.com/ithaka/ithaka-cli) + VPN

## Setup

```bash
# Install dependencies
yarn install

# Setup environment
cp example.env .env
# Edit .env with database URL

# Start development server
yarn dev
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

1. Verify the server is running at `localhost:8080/api/v2/healthcheck/readiness`. This should confirm that the server, Polaris service discovery, and the database connection are all running. Expected response:

```json
{
  "server": true,
  "service_discovery": true,
  "db": true
}
```

## Testing

Vitest unit tests are run in Gitlab as part of the CI/CD pipeline with the command `yarn test:ci`. To test locally, use `yarn test`.

## Building & Deployment

Deployment is handled by [Gitlab](https://gitlab.com/capstan/platform-apps/labs/jaip/jaip-backend) CI. There are test, deploy, and undeploy jobs defined in the `.gitlab-ci.yml` file, found in the project root.

The application is deployed to the ITHAKA POW platform known as [Capstan](https://wiki.ithaka.org/display/softdel/Capstan+Software+Delivery+Home). Capstan is a POW sanctioned Kubernetes cluster with first-class support for logging (to [captains-log](https://super-dashboard.apps.prod.cirrostratus.org/index/search)), metrics via prometheus, viewed in [grafana](http://grafana.acorn.cirrostratus.org/d/e35853c1-7025-4f35-8685-65eaeaba64a7/jaip-dashboard), and visual graphs ([argo test](https://argocd.eks.test.cirrostratus.org/applications/jaip-backend?orphaned=false&resource=) or [argo prod](https://argocd.eks.prod.cirrostratus.org/applications/argocd/jaip-backend?view=tree&orphaned=false&resource=)) of each deployed application on the platform. It also provides high reliability and scalability with the help of Kubernetes.

### Environment Specific Configurations

You can find these in the [k8s](k8s/) directory at the project root.
