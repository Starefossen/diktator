# Diktator Infrastructure - OpenTofu Configuration

This directory contains the infrastructure-as-code configuration for the Diktator application using OpenTofu (open-source Terraform fork).

## Architecture Overview

The Diktator application infrastructure consists of:

- **Frontend**: Next.js SPA hosted on Google Cloud Storage with CDN via Global Load Balancer
- **Backend**: Go API service running on Google Cloud Run
- **Database**: PostgreSQL for data storage
- **Authentication**: OIDC for user management
- **CI/CD**: Service account and permissions for GitHub Actions deployment
- **Monitoring**: Optional billing budget alerts

## File Structure

The Terraform configuration is organized into logical files for better maintainability:

```text
terraform/
├── main.tf              # Entry point and documentation
├── versions.tf          # Terraform version constraints and providers
├── variables.tf         # Input variables and local values
├── apis.tf             # Google Cloud API enablement
├── iam.tf              # Service accounts and IAM permissions
├── storage.tf          # Cloud Storage buckets for frontend
├── load_balancer.tf    # Load balancer, SSL certificates, and CDN
├── cloud_run.tf        # Backend API service on Cloud Run

├── billing.tf          # Budget alerts and cost monitoring (optional)
├── outputs.tf          # Output values for integration
├── terraform.tfvars    # Your project configuration (create from .example)
└── terraform.tfvars.example  # Example configuration template
```

## Setup Instructions

## Prerequisites

1. **Google Cloud Account**: Ensure you have a GCP account and billing enabled
2. **OpenTofu**: Install OpenTofu >= 1.6 (https://opentofu.org/docs/intro/install/)
3. **Google Cloud CLI**: Install and authenticate with `gcloud auth login`

## Quick Start

### 1. Project Setup

Create a new GCP project or use an existing one:

```bash
# Create a new project (optional)
gcloud projects create your-unique-project-id

# Set the project
gcloud config set project your-unique-project-id

# Enable billing (replace BILLING_ACCOUNT_ID with your billing account)
gcloud billing projects link your-unique-project-id --billing-account=BILLING_ACCOUNT_ID
```

### 2. Configure Variables

```bash
cd terraform

# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your project details
# Required: project_id
# Optional: region, domain, billing settings
```

### 3. Deploy Infrastructure

```bash
# Initialize OpenTofu (downloads providers)
tofu init

# Review the deployment plan
tofu plan

# Deploy the infrastructure
tofu apply
```

### 4. Configure CI/CD (GitHub Actions)

After successful deployment, configure your GitHub repository with these secrets:

```bash
# Get the required values
tofu output project_id
tofu output frontend_bucket_name
tofu output region
tofu output -raw cicd_service_account_key
```

Add these to your GitHub repository secrets:

- `GCP_SA_KEY`: Output from `cicd_service_account_key`
- `GCP_PROJECT_ID`: Output from `project_id`
- `GCP_FRONTEND_BUCKET`: Output from `frontend_bucket_name`
- `GCP_REGION`: Output from `region`

### 5. DNS Configuration

Set up your domain to point to the load balancer:

```bash
# Get the IP address for your DNS A record
tofu output frontend_lb_ip
tofu output dns_setup_instructions
```

## Development Workflow

Once infrastructure is deployed, you can use mise tasks for development:

```bash
# From the project root directory

# Deploy backend API
mise run deploy-backend

# Deploy frontend
mise run deploy-frontend

# View infrastructure status
cd terraform && tofu show
```

## Infrastructure Components

### Core Services

- **Google Cloud Storage**: Frontend static file hosting with global CDN
- **Google Cloud Run**: Serverless backend API with auto-scaling
- **PostgreSQL**: Relational database for application data
- **OIDC Authentication**: User authentication and management via identity provider

### Networking & Security

- **Global Load Balancer**: HTTPS termination, CDN, and traffic routing
- **Managed SSL Certificate**: Automatic certificate provisioning and renewal
- **IAM Service Account**: Secure CI/CD permissions with least privilege

### Cost Management

- **Budget Alerts**: Optional monitoring with configurable spending thresholds
- **Resource Optimization**: Right-sized instances and auto-scaling policies

## Configuration Variables

| Variable             | Description                | Default                        | Required |
| -------------------- | -------------------------- | ------------------------------ | -------- |
| `project_id`         | GCP project ID             | -                              | ✅        |
| `region`             | GCP region for services    | `europe-north1`                | ❌        |
| `domain`             | Custom domain for frontend | `www.diktator.fn.flaatten.org` | ❌        |
| `bucket_location`    | Storage bucket location    | `EU`                           | ❌        |
| `billing_account_id` | Billing account for alerts | `""`                           | ❌        |
| `budget_amount`      | Monthly budget in USD      | `50`                           | ❌        |

## Important Notes

### Application Deployment

The Terraform configuration provisions infrastructure only. The actual application deployment (Docker images, static files) is handled separately via:

- **CI/CD Pipeline**: GitHub Actions automatically deploy on code changes
- **Manual Deployment**: Use `mise run deploy-backend` and `mise run deploy-frontend`

### Cloud Run Image Management

The Cloud Run service is created with a placeholder image (`gcr.io/cloudrun/hello`). The configuration includes lifecycle rules to prevent Terraform from overwriting images deployed via CI/CD.

### SSL Certificate Provisioning

Google-managed SSL certificates can take 10-60 minutes to provision. The certificate status can be checked in the Google Cloud Console.

## Billing & Budget Alerts

To enable billing monitoring:

1. Find your billing account ID:

   ```bash
   gcloud billing accounts list
   ```

2. Configure in `terraform.tfvars`:

   ```hcl
   billing_account_id = "ABCDEF-123456-ABCDEF"
   budget_amount      = 50
   ```

3. Apply the configuration:

   ```bash
   tofu apply
   ```

Budget alerts trigger at 50%, 80%, and 100% of your monthly limit.

## Troubleshooting

### Common Issues

1. **API Enablement**: If resources fail to create, ensure all required APIs are enabled
2. **Permissions**: Verify your GCP account has sufficient permissions (Project Editor or Owner)
3. **Billing**: Ensure billing is enabled on your GCP project
4. **Domain**: SSL certificate provisioning requires domain verification

### Useful Commands

```bash
# Check resource status
tofu state list
tofu state show google_cloud_run_service.api

# Refresh state from actual infrastructure
tofu refresh

# Import existing resources (if needed)
tofu import google_project_service.required_apis[\"run.googleapis.com\"] your-project-id/run.googleapis.com
```

## Cleanup

To destroy the infrastructure:

```bash
tofu destroy
```

**Note**: This will delete all resources and data. Make sure to backup any important data first.

## Development Support

For AI assistance with infrastructure code, see [GitHub Copilot Instructions](../.github/copilot_instructions.md) for project-specific guidance.
