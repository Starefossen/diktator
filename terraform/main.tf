# TTS Service Infrastructure for Diktator
# This provisions ONLY the Google Cloud Text-to-Speech service account.
# The application itself is fully self-hosted on homelab infrastructure.
# Resources are organized in separate files by logical grouping:
#
# - versions.tf: Terraform version constraints and provider configurations
# - variables.tf: Input variables and local values
# - apis.tf: Google Cloud TTS API enablement
# - iam.tf: TTS service account and credentials

# - billing.tf: TTS usage budget alerts and cost monitoring
# - outputs.tf: Output values for deployment automation
