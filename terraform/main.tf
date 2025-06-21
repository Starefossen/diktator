# Main infrastructure configuration for Diktator application
# This file serves as the entry point for the infrastructure setup.
# The actual resources are organized in separate files by logical grouping:
#
# - versions.tf: Terraform version constraints and provider configurations
# - variables.tf: Input variables and local values
# - apis.tf: Google Cloud API enablement
# - iam.tf: Service accounts and IAM permissions
# - storage.tf: Cloud Storage buckets for frontend
# - load_balancer.tf: Load balancer, SSL certificates, and CDN
# - cloud_run.tf: Backend API service on Cloud Run
# - firebase.tf: Firebase and Firestore configuration
# - billing.tf: Budget alerts and cost monitoring
# - outputs.tf: Output values for other systems
