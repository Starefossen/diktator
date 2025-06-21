# Configuration Management

This document describes the centralized configuration management system for the Diktator application using mise environments.

## Overview

The application uses a three-tier configuration management system:

1. **Static Configuration**: Defined in `mise.toml` using mise environments
2. **Dynamic Configuration**: Read from terraform outputs and cached in `.mise.env`
3. **Runtime Configuration**: Environment-specific overrides and secrets

## Configuration Layers

### 1. Static Configuration (`mise.toml` [env] section)

Static configuration values that don't change between deployments:

```toml
[env]
DIKTATOR_APP_NAME = "diktator"
DIKTATOR_API_SERVICE_NAME = "diktator-api"
DIKTATOR_DEFAULT_REGION = "europe-north1"
DIKTATOR_DEFAULT_PORT = "8080"
DIKTATOR_BUCKET_LOCATION = "EU"
```

These values are:
- ✅ Version controlled
- ✅ Consistent across environments
- ✅ Easy to modify for different deployments

### 2. Dynamic Configuration (`.mise.env`)

Dynamic values read from terraform outputs and Cloud services:

```bash
export DIKTATOR_PROJECT_ID='my-gcp-project'
export DIKTATOR_REGION='eu-north1'
export DIKTATOR_FRONTEND_BUCKET='my-gcp-project-diktator-frontend'
export DIKTATOR_API_URL='https://diktator-api-xxx.eu-north1.run.app'
```

These values are:
- 🔄 Generated automatically by `mise run config-load`
- 📍 Source of truth is terraform state + live Cloud services
- 🚫 **Not version controlled** (added to `.gitignore`)

### 3. Runtime Configuration

Environment-specific values set during deployment:

- **Development**: Local defaults from mise environments
- **CI/CD**: GitHub secrets (`GOOGLE_CLOUD_PROJECT`, `GCP_REGION`, etc.)
- **Production**: Generated `.env` files for Next.js

## Usage

### Loading Configuration

```bash
# Load dynamic configuration from terraform outputs
mise run config-load

# Check all configuration values
mise run config-check

# Generate production environment files
mise run env-production
```

### Deployment Tasks

All deployment tasks automatically load configuration:

```bash
# These tasks automatically run config-load
mise run deploy-backend
mise run deploy-frontend
```

### Configuration Variables

| Variable                    | Source  | Purpose                          |
| --------------------------- | ------- | -------------------------------- |
| `DIKTATOR_APP_NAME`         | Static  | Application identifier           |
| `DIKTATOR_API_SERVICE_NAME` | Static  | Cloud Run service name           |
| `DIKTATOR_DEFAULT_REGION`   | Static  | Default GCP region               |
| `DIKTATOR_BUCKET_LOCATION`  | Static  | Storage bucket location (EU/US)  |
| `DIKTATOR_PROJECT_ID`       | Dynamic | GCP project from terraform       |
| `DIKTATOR_REGION`           | Dynamic | Actual GCP region from terraform |
| `DIKTATOR_FRONTEND_BUCKET`  | Dynamic | Storage bucket from terraform    |
| `DIKTATOR_API_URL`          | Dynamic | Live Cloud Run service URL       |

## Environment-Specific Configuration

### Development Environment

Mise automatically sets:
```toml
[env.development]
NODE_ENV = "development"
DIKTATOR_ENV = "development"
NEXT_PUBLIC_API_URL = "http://localhost:8080"
```

### Production Environment

For production builds, dynamic values override defaults:
```bash
# These are set by env-production task
NEXT_PUBLIC_API_URL=${DIKTATOR_API_URL}
NEXT_PUBLIC_ASSET_PREFIX=https://storage.googleapis.com/${DIKTATOR_FRONTEND_BUCKET}
```

### CI/CD Environment

GitHub Actions can override any value via secrets:
- `GOOGLE_CLOUD_PROJECT` → `DIKTATOR_PROJECT_ID`
- `GCP_REGION` → `DIKTATOR_REGION`
- `GCP_FRONTEND_BUCKET` → `DIKTATOR_FRONTEND_BUCKET`

## Benefits

✅ **Single Source of Truth**: Static config in `mise.toml`, dynamic config from terraform
✅ **Consistent Naming**: All variables use `DIKTATOR_*` prefix for clarity
✅ **Automatic Updates**: Dynamic config updates when infrastructure changes
✅ **Environment Isolation**: Development, CI/CD, and production configs are separate
✅ **Graceful Fallbacks**: Tasks work even when dynamic config isn't available
✅ **Easy Debugging**: `config-check` shows all configuration at once

## Migration Guide

### For Existing Tasks

Old pattern:
```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=$(cd terraform && tofu output -raw region || echo "eu-north1")
```

New pattern:
```bash
mise run config-load
source .mise.env
# Use $DIKTATOR_PROJECT_ID and $DIKTATOR_REGION
```

### For New Tasks

Always start tasks that need configuration with:
```bash
# Load dynamic configuration
mise run config-load
source .mise.env
```

Then use the standardized variables:
- `$DIKTATOR_PROJECT_ID` instead of `$PROJECT_ID`
- `$DIKTATOR_REGION` instead of `$REGION`
- `$DIKTATOR_API_SERVICE_NAME` instead of hardcoded "diktator-api"

## Troubleshooting

### Configuration Not Loading

```bash
# Check if terraform is initialized
ls terraform/.terraform.lock.hcl

# Initialize if needed
mise run tofu-init

# Apply infrastructure
mise run tofu-apply

# Load configuration
mise run config-load
```

### Values Are Wrong

```bash
# Check all configuration sources
mise run config-check

# Reload from terraform
rm .mise.env
mise run config-load
```

### CI/CD Issues

Ensure GitHub secrets are set:
- `GCP_SA_KEY`
- `GCP_PROJECT_ID`
- `GCP_FRONTEND_BUCKET`
- `GCP_REGION` (optional, defaults to eu-north1)
