# Service Account for Diktator Application (TTS-only)
resource "google_service_account" "app" {
  account_id   = "diktator-app"
  display_name = "Diktator Application Service Account"
  description  = "Service account for Diktator app runtime (TTS, Storage)"

  depends_on = [google_project_service.required_apis]
}

# Create service account key for Kubernetes deployment
resource "google_service_account_key" "app_key" {
  service_account_id = google_service_account.app.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}
