# Service Account for Text-to-Speech API access
# Note: Application is self-hosted; this is only for TTS service integration
resource "google_service_account" "app" {
  account_id   = "diktator-app"
  display_name = "Diktator TTS Service Account"
  description  = "Service account for Text-to-Speech API access (app is self-hosted)"

  depends_on = [google_project_service.required_apis]
}

# Grant Service Usage Consumer role to allow API usage
resource "google_project_iam_member" "app_service_usage_consumer" {
  project = var.project_id
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = "serviceAccount:${google_service_account.app.email}"

  depends_on = [google_service_account.app]
}

# Create service account key for Kubernetes deployment
resource "google_service_account_key" "app_key" {
  service_account_id = google_service_account.app.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}
