# Enable required APIs
# Note: All Google Cloud APIs are now managed through Terraform for consistent infrastructure as code.
# This includes the Text-to-Speech API required for audio generation features.
resource "google_project_service" "required_apis" {
  for_each = toset([
    "texttospeech.googleapis.com"          # Text-to-Speech API for audio generation
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}
