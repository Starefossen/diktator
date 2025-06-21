# Environment Variables

This document outlines all environment variables used in the Diktator application.

## Local Development

### Required for Local Development

| Variable               | Description                          | Example                 | Where to Set           |
| ---------------------- | ------------------------------------ | ----------------------- | ---------------------- |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID for local development | `diktator-dev`          | `.env.local` or system |
| `NODE_ENV`             | Node.js environment                  | `development`           | Auto-set by mise       |
| `NEXT_PUBLIC_API_URL`  | Backend API URL for frontend         | `http://localhost:8080` | Auto-set by mise       |

### Optional for Local Development

| Variable          | Description                       | Example | Where to Set |
| ----------------- | --------------------------------- | ------- | ------------ |
| `PORT`            | Backend server port               | `8080`  | `.env.local` |
| `FIREBASE_CONFIG` | Firebase configuration (if using) | `{...}` | `.env.local` |

### Setting Up Local Environment

Create `.env.local` files in the respective directories:

#### Backend `.env.local`
```bash
# backend/.env.local
GOOGLE_CLOUD_PROJECT=your-dev-project-id
PORT=8080
```

#### Frontend `.env.local`
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT=your-dev-project-id
```

## CI/CD (GitHub Actions)

### Required GitHub Secrets

| Secret                | Description                       | How to Get                                  |
| --------------------- | --------------------------------- | ------------------------------------------- |
| `GCP_SA_KEY`          | Service Account JSON key (base64) | `tofu output -raw cicd_service_account_key` |
| `GCP_PROJECT_ID`      | GCP Project ID                    | `tofu output project_id`                    |
| `GCP_FRONTEND_BUCKET` | Frontend storage bucket name      | `tofu output frontend_bucket`               |

### Setting GitHub Secrets

1. Navigate to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with the values from OpenTofu outputs

```bash
# After running tofu apply, get the values:
tofu output project_id
tofu output frontend_bucket
tofu output -raw cicd_service_account_key
```

## Production Environment

### Backend (Cloud Run)

Environment variables automatically set by Terraform:

| Variable               | Value      | Source    |
| ---------------------- | ---------- | --------- |
| `GOOGLE_CLOUD_PROJECT` | Project ID | Terraform |
| `PORT`                 | `8080`     | Terraform |

### Frontend (Cloud Storage)

Build-time environment variables:

| Variable              | Value                 | Set During           |
| --------------------- | --------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | Cloud Run service URL | GitHub Actions build |
| `NODE_ENV`            | `production`          | GitHub Actions build |

## Security Notes

1. **Never commit `.env.local` files** - they're already in `.gitignore`
2. **Service Account Keys**: Keep the `GCP_SA_KEY` secret secure
3. **Local Development**: Use a separate GCP project for development
4. **Firebase Config**: If using Firebase, store config in environment variables, not in code

## Troubleshooting

### Common Issues

1. **"Project not found"**: Ensure `GOOGLE_CLOUD_PROJECT` is set correctly
2. **API connection failed**: Check `NEXT_PUBLIC_API_URL` points to running backend
3. **Deployment fails**: Verify all GitHub secrets are set correctly

### Verifying Setup

```bash
# Check mise environment
mise env

# Test backend connection
curl http://localhost:8080/health

# Check frontend environment
cd frontend && npm run dev
# Visit http://localhost:3000 and check browser console for API calls
```
