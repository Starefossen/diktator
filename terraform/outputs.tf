# Project and infrastructure outputs
output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

# CI/CD outputs
output "cicd_service_account_email" {
  description = "CI/CD service account email"
  value       = google_service_account.cicd.email
}

output "cicd_service_account_key" {
  description = "CI/CD service account key (base64 encoded)"
  value       = google_service_account_key.cicd_key.private_key
  sensitive   = true
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
