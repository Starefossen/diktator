# Firebase project configuration
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project_service.required_apis]
}

# Enable Firebase Authentication
resource "google_identity_platform_config" "auth_config" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = true
      password_required = true
    }
  }

  depends_on = [
    google_firebase_project.default,
    google_project_service.required_apis
  ]
}

# Firebase Web App
resource "google_firebase_web_app" "default" {
  provider        = google-beta
  project         = var.project_id
  display_name    = "Diktator Web App"
  deletion_policy = "DELETE"

  depends_on = [
    google_firebase_project.default,
    google_project_service.required_apis
  ]
}

# Firebase Web App configuration
data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.default.app_id

  depends_on = [google_firebase_web_app.default]
}

# Firestore database
resource "google_firestore_database" "default" {
  provider    = google-beta
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [
    google_firebase_project.default,
    google_project_service.required_apis
  ]
}

# Firestore composite indexes
# Index for wordsets collection: familyId + createdAt (descending)
resource "google_firestore_index" "wordsets_family_created" {
  provider = google-beta
  project  = var.project_id
  database = google_firestore_database.default.name

  collection = "wordsets"

  fields {
    field_path = "familyId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.default]
}

# Index for results collection: userId + completedAt (descending)
resource "google_firestore_index" "results_user_completed" {
  provider = google-beta
  project  = var.project_id
  database = google_firestore_database.default.name

  collection = "results"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "completedAt"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.default]
}

# Index for users collection: familyId + role (for backward compatibility)
resource "google_firestore_index" "users_family_role" {
  provider = google-beta
  project  = var.project_id
  database = google_firestore_database.default.name

  collection = "users"

  fields {
    field_path = "familyId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }

  depends_on = [google_firestore_database.default]
}
