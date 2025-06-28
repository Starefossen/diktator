# Enable required APIs
# Note: All Google Cloud APIs are now managed through Terraform for consistent infrastructure as code.
# This includes the Text-to-Speech API required for audio generation features.
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",                  # Cloud Run for backend deployment
    "containerregistry.googleapis.com",    # Container Registry for Docker images
    "storage.googleapis.com",              # Cloud Storage for audio files and static assets
    "iam.googleapis.com",                  # Identity and Access Management
    "cloudresourcemanager.googleapis.com", # Project management
    "compute.googleapis.com",              # Compute Engine for load balancer
    "billingbudgets.googleapis.com",       # Billing and budget management
    "certificatemanager.googleapis.com",   # SSL certificate management
    "firebase.googleapis.com",             # Firebase services
    "firestore.googleapis.com",            # Firestore database
    "identitytoolkit.googleapis.com",      # Firebase Authentication
    "texttospeech.googleapis.com"          # Text-to-Speech API for audio generation
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}
