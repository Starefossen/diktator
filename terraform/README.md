# Infrastructure Setup with OpenTofu

## Prerequisites

1. **Google Cloud Account**: Ensure you have a GCP account and billing enabled
2. **OpenTofu**: Install OpenTofu >= 1.6 (https://opentofu.org/docs/intro/install/)
3. **Google Cloud CLI**: Install and authenticate with `gcloud auth login`

## Setup Instructions

### 1. Create GCP Project (if needed)

```bash
# Create a new project
gcloud projects create your-unique-project-id

# Set the project
gcloud config set project your-unique-project-id

# Enable billing (replace BILLING_ACCOUNT_ID with your billing account)
gcloud billing projects link your-unique-project-id --billing-account=BILLING_ACCOUNT_ID
```

### 2. Configure OpenTofu

```bash
cd terraform

# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your project details
# Set your project_id and optionally region/domain
```

### 3. Deploy Infrastructure

```bash
# Initialize OpenTofu
tofu init

# Plan the deployment
tofu plan

# Apply the infrastructure
tofu apply
```

### 4. Configure GitHub Secrets

After successful deployment, set up these GitHub repository secrets:

```bash
# Get the service account key (this will be base64 encoded)
tofu output -raw cicd_service_account_key

# Get other required values
tofu output project_id
tofu output frontend_bucket
tofu output region
```

Add these to your GitHub repository secrets:

- `GCP_SA_KEY`: The output from `cicd_service_account_key`
- `GCP_PROJECT_ID`: The output from `project_id`
- `GCP_FRONTEND_BUCKET`: The output from `frontend_bucket`
- `GCP_REGION`: The output from `region` (optional, defaults to eu-north1)

## Infrastructure Overview

This OpenTofu configuration creates the infrastructure needed for the Diktator application:

- **Service Account**: For CI/CD with appropriate permissions
- **Storage bucket location**: Storage bucket will be created in the EU region by default for compliance, but can be configured via `bucket_location` variable
- **Random suffix**: Bucket names include a random suffix to ensure global uniqueness
- **Cloud Run Service**: For the backend API (with placeholder image)
- **IAM Policies**: Public access for frontend, CI/CD permissions
- **API Enablement**: Required Google Cloud APIs
- **Billing Alerts**: Optional budget monitoring with configurable thresholds
- **Load Balancer**: HTTPS-enabled load balancer with CDN for frontend delivery
- **SSL Certificate**: Managed Google SSL certificate for custom domain
- **DNS Configuration**: A record setup for custom domain routing

**Important**: This only sets up the infrastructure. The actual application deployment (Docker images, static files) is handled separately via CI/CD or manual deployment commands.

## Outputs

After deployment, you'll have the infrastructure ready:

- **Infrastructure**: Cloud Run service, Storage bucket, IAM roles
- **Deployment Ready**: Use `mise run deploy-backend` and `mise run deploy-frontend` to deploy applications
- **CI/CD Ready**: GitHub Actions can deploy automatically to the provisioned infrastructure

## Billing Alerts (Optional)

To enable billing budget alerts, you need to:

1. Find your billing account ID:

   ```bash
   gcloud billing accounts list
   ```

2. Add billing configuration to your `terraform.tfvars`:

   ```hcl
   billing_account_id = "ABCDEF-123456-ABCDEF"  # Your billing account ID
   budget_amount      = 50                      # Monthly budget in USD
   alert_email        = "admin@example.com"     # Email for notifications
   ```

3. Apply the configuration:

   ```bash
   mise run tofu-apply
   ```

The budget will create alerts at 50%, 80%, and 100% of your monthly budget.

**Note**: Email notifications require additional setup of notification channels in Google Cloud Monitoring. The budget alerts will appear in the Google Cloud Console billing section.

## Cleanup

To destroy the infrastructure:

```bash
tofu destroy
```

**Note**: This will delete all resources and data. Make sure to backup any important data first.
