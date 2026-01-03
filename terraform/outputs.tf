# Project and infrastructure outputs
output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

# Application runtime outputs
output "app_service_account_email" {
  description = "Application service account email for TTS and Storage"
  value       = google_service_account.app.email
}

output "app_service_account_key" {
  description = "Application service account key (base64 encoded, JSON format)"
  value       = google_service_account_key.app_key.private_key
  sensitive   = true
}
