# Random suffix for globally unique bucket name
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Storage bucket for frontend
resource "google_storage_bucket" "frontend" {
  name     = "${var.project_id}-diktator-frontend-${random_id.bucket_suffix.hex}"
  location = var.bucket_location

  uniform_bucket_level_access = true
  force_destroy               = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.required_apis]
}

# Make the bucket publicly readable
resource "google_storage_bucket_iam_member" "frontend_public" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
