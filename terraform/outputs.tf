# Project and infrastructure outputs
output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

# Storage and frontend outputs
output "frontend_bucket_name" {
  description = "Frontend storage bucket name"
  value       = google_storage_bucket.frontend.name
}

output "frontend_bucket" {
  description = "Frontend storage bucket name (alias for compatibility)"
  value       = google_storage_bucket.frontend.name
}

output "frontend_url" {
  description = "Frontend URL (Cloud Storage direct)"
  value       = "https://storage.googleapis.com/${google_storage_bucket.frontend.name}/index.html"
}

output "frontend_website_url" {
  description = "Frontend website URL (Cloud Storage hosting)"
  value       = "http://${google_storage_bucket.frontend.name}.storage.googleapis.com"
}

output "frontend_lb_ip" {
  description = "Frontend load balancer IP address - use this for DNS A record"
  value       = google_compute_global_address.frontend.address
}

output "frontend_lb_url" {
  description = "Frontend load balancer URL (HTTPS)"
  value       = "https://${var.domain}"
}

output "dns_setup_instructions" {
  description = "DNS setup instructions"
  value       = <<EOT
Create the following DNS A record:
  Name: ${var.domain}
  Type: A
  Value: ${google_compute_global_address.frontend.address}
  TTL: 300 (or your preferred value)
EOT
}

# Backend API outputs
output "api_url" {
  description = "Backend API URL"
  value       = google_cloud_run_service.api.status[0].url
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

# Firebase outputs
output "firebase_config" {
  description = "Firebase configuration for frontend"
  value = {
    apiKey            = data.google_firebase_web_app_config.default.api_key
    authDomain        = data.google_firebase_web_app_config.default.auth_domain
    projectId         = var.project_id
    storageBucket     = "${var.project_id}.appspot.com"
    messagingSenderId = data.google_firebase_web_app_config.default.messaging_sender_id
    appId             = google_firebase_web_app.default.app_id
  }
  sensitive = true
}

output "firebase_web_app_id" {
  description = "Firebase Web App ID"
  value       = google_firebase_web_app.default.app_id
}
