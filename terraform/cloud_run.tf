# Cloud Run service for backend API
resource "google_cloud_run_service" "api" {
  name     = "diktator-api"
  location = var.region

  template {
    spec {
      containers {
        # Use a minimal placeholder image for initial creation only
        # The actual application image will be deployed via CI/CD and should not be overwritten
        image = "gcr.io/cloudrun/hello"

        ports {
          container_port = 8080
        }

        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"  = "10"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  # Ignore changes to the image to prevent overwriting CI/CD deployments
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image,
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
    ]
  }

  depends_on = [google_project_service.required_apis]
}

# Make Cloud Run service publicly accessible
resource "google_cloud_run_service_iam_member" "api_public" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
