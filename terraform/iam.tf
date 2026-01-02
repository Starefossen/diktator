# Service Account for CI/CD
resource "google_service_account" "cicd" {
  account_id   = "diktator-cicd"
  display_name = "Diktator CI/CD Service Account"
  description  = "Service account for GitHub Actions CI/CD"

  depends_on = [google_project_service.required_apis]
}

# IAM roles for the CI/CD service account
resource "google_project_iam_member" "cicd_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/storage.admin",
    "roles/iam.serviceAccountUser",
    "roles/cloudbuild.builds.builder"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cicd.email}"
}

# Create service account key for GitHub Actions
resource "google_service_account_key" "cicd_key" {
  service_account_id = google_service_account.cicd.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Service Account for Diktator Application (TTS and Storage)
resource "google_service_account" "app" {
  account_id   = "diktator-app"
  display_name = "Diktator Application Service Account"
  description  = "Service account for Diktator app runtime (TTS, Storage)"

  depends_on = [google_project_service.required_apis]
}

# IAM roles for the application service account
# Note: Text-to-Speech API access is granted through API enablement, no additional IAM role needed
resource "google_project_iam_member" "app_roles" {
  for_each = toset([
    "roles/storage.objectUser",  # Cloud Storage read/write
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.app.email}"
}

# Create service account key for Kubernetes deployment
resource "google_service_account_key" "app_key" {
  service_account_id = google_service_account.app.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}
