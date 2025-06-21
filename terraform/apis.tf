# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "containerregistry.googleapis.com",
    "storage.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "billingbudgets.googleapis.com",
    "certificatemanager.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "identitytoolkit.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}
