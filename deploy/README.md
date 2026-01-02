# Diktator Deployment Configuration

This directory contains homelab-specific deployment configuration for Diktator.

## Directory Structure

```
.
├── deploy/                          # Kubernetes manifests
│   ├── knative-service-backend.yaml
│   ├── knative-service-frontend.yaml
│   ├── postgres-cluster.yaml
│   ├── migration-job.yaml
│   └── networkpolicy.yaml
├── mise.toml                        # All tasks (dev + homelab)
└── HOMELAB.md                       # Deployment documentation
```

## Mise Configuration

All tasks are in **`mise.toml`** (in the submodule root):

- **Development tasks** - For local development with Docker Compose
  - `dev`, `frontend:dev`, `backend:dev`
  - `test`, `lint`, `format`
  - `db:start`, `db:migrate`, etc.

- **Homelab deployment tasks** - Prefixed with `homelab:`
  - `homelab:build`, `homelab:deploy`, `homelab:full-deploy`
  - `homelab:db-create`, `homelab:db-migrate`
  - `homelab:status`, `homelab:logs-*`, `homelab:url-*`

## Environment Variables

Set these in your homelab mise.toml (root of homelab repo):

```toml
[env]
REGISTRY_URL = "registry.intern.flaatten.org:5000"
NAMESPACE = "diktator"
FRONTEND_SERVICE = "www"
BACKEND_SERVICE = "api"
DEPLOY_DIR = "deploy"
```

Or override when running tasks:

```bash
REGISTRY_URL=my-registry:5000 mise run homelab:build
```

## Usage

```bash
# Homelab deployment
mise run homelab:build              # Build for homelab
mise run homelab:deploy             # Deploy to Knative
mise run homelab:full-deploy        # Build + deploy
mise run homelab:status             # Check services

# Local development
mise run dev                        # Local dev environment
mise run test                       # Run tests
```

## First-time Setup

Trust the config when first using the submodule:

```bash
cd /path/to/homelab/apps/diktator
mise trust
```

This is required only once per checkout.
