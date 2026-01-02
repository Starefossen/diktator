# Diktator - Homelab Deployment

Homelab deployment of [Diktator](https://github.com/starefossen/diktator) - Norwegian vocabulary learning app.

## Prerequisites

- Knative Serving with auto-TLS
- CloudNativePG operator
- Zitadel for OIDC authentication
- QNAP iSCSI storage class (qnap-iscsi)

## Quick Deploy

```bash
cd apps/diktator

# Create namespace and database
mise run homelab:create-namespace
mise run homelab:db-create

# Build and deploy
mise run homelab:full-deploy
```

## URLs

- **Frontend**: https://www.diktator.fn.flaatten.org
- **API**: https://api.diktator.fn.flaatten.org

## Configuration

### Zitadel OIDC Setup

1. Create application in Zitadel:
   - Name: `diktator`
   - Type: Web application
   - Authentication Method: **PKCE** (recommended)
     - Response Types: Code
     - Grant Types: Authorization Code
     - Authentication Method: None
   - Redirect URIs: `https://www.diktator.fn.flaatten.org/*`
   - Post logout: `https://www.diktator.fn.flaatten.org`

2. Update backend manifest with client ID

### Environment Variables

**Backend** ([deploy/knative-service-backend.yaml](deploy/knative-service-backend.yaml)):
- `DATABASE_URL`: From secret `diktator-db-app`
- `AUTH_MODE`: `oidc`
- `OIDC_ISSUER_URL`: `https://zitadel.zitadel.fn.flaatten.org`
- `OIDC_AUDIENCE`: Zitadel client ID

**Frontend** ([deploy/knative-service-frontend.yaml](deploy/knative-service-frontend.yaml)):
- `NEXT_PUBLIC_API_URL`: `https://api.diktator.fn.flaatten.org`
- `NEXT_PUBLIC_AUTH_MODE`: `oidc`

### Google Cloud Text-to-Speech

Required for audio pronunciation. Credentials are automatically provisioned and deployed by mise tasks.

**Initial setup:**

```bash
# 1. Provision service account in Google Cloud
cd terraform
tofu apply
cd ..

# 2. Credentials are automatically exported and deployed as part of homelab:deploy
mise run homelab:full-deploy
```

**Manual credential management (if needed):**

```bash
# Export credentials from Terraform
mise run homelab:gcp-export-credentials

# Create/update Kubernetes secret
mise run homelab:gcp-create-secret
```

The backend deployment is already configured to use these credentials. See [deploy/knative-service-backend.yaml](deploy/knative-service-backend.yaml) for volume mount and environment variable configuration.

**Cost:** First 4M characters/month FREE. Typical family usage (~30k chars/month) stays well within free tier.

## Database

PostgreSQL via CloudNativePG:
- 1 instance, 5Gi storage
- Credentials: secret `diktator-db-app`

```bash
# Check database
kubectl get cluster -n diktator

# Connect to database
kubectl exec -it -n diktator diktator-db-1 -- psql -U diktator diktator
```

## Management

```bash
# Status
mise run homelab:status

# Logs
mise run homelab:logs-backend
mise run homelab:logs-frontend

# URLs
mise run homelab:url-backend
mise run homelab:url-frontend

# Delete
mise run homelab:delete          # Services only
kubectl delete ns diktator       # Everything
```

## Troubleshooting

**Backend can't connect to database:**
```bash
kubectl get cluster -n diktator diktator-db
```

**Auth issues:**
```bash
curl https://zitadel.zitadel.fn.flaatten.org/.well-known/openid-configuration
mise run homelab:logs-backend | grep -i oidc
```

**Network policy issues:**
```bash
kubectl describe cnp -n diktator
```

## Development

For local development, see the [upstream README](README.md).

Update submodule:
```bash
cd apps/diktator
git pull origin main
cd ../..
git add apps/diktator
git commit -m "Update diktator submodule"
```
