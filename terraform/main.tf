terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "europe-north1"
}

variable "bucket_location" {
  description = "The location for the storage bucket (e.g., EU, US, or specific region)"
  type        = string
  default     = "EU"
}

variable "domain" {
  description = "The domain for the application"
  type        = string
  default     = "diktator.gc.flaatten.org"
}

variable "billing_account_id" {
  description = "The billing account ID for budget alerts (optional)"
  type        = string
  default     = ""
}

variable "budget_amount" {
  description = "Monthly budget amount in USD for alerts"
  type        = number
  default     = 50
}

variable "alert_email" {
  description = "Email address for billing alerts (optional)"
  type        = string
  default     = ""
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Locals for SSL certificate management
locals {
  managed_domains = tolist([var.domain])
}

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
    "certificatemanager.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}

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

# Random suffix for globally unique bucket name
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Random ID for SSL certificate management
resource "random_id" "certificate" {
  byte_length = 4
  prefix      = "${var.project_id}-ssl-"

  keepers = {
    domains = join(",", local.managed_domains)
  }
}

# Storage bucket for frontend
resource "google_storage_bucket" "frontend" {
  name     = "${var.project_id}-diktator-frontend-${random_id.bucket_suffix.hex}"
  location = var.bucket_location

  uniform_bucket_level_access = true
  force_destroy              = true

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

# Create a backend bucket for the Global external Application Load Balancer
resource "google_compute_backend_bucket" "frontend" {
  name        = "${var.project_id}-frontend-backend"
  description = "Backend bucket for frontend static files - Global external Application Load Balancer"
  bucket_name = google_storage_bucket.frontend.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600    # 1 hour
    max_ttl           = 86400   # 24 hours
    client_ttl        = 3600    # 1 hour
    negative_caching  = true

    negative_caching_policy {
      code = 404
      ttl  = 60  # Cache 404s for 1 minute
    }
  }

  depends_on = [google_project_service.required_apis]
}

# URL map for routing - Global external Application Load Balancer
resource "google_compute_url_map" "frontend" {
  name            = "${var.project_id}-frontend-url-map"
  description     = "Global external Application Load Balancer for frontend SPA"
  default_service = google_compute_backend_bucket.frontend.id
}

# HTTPS proxy - Global external Application Load Balancer
resource "google_compute_target_https_proxy" "frontend" {
  name             = "${var.project_id}-frontend-https-proxy"
  url_map          = google_compute_url_map.frontend.id
  ssl_certificates = [google_compute_managed_ssl_certificate.frontend.id]

  depends_on = [google_project_service.required_apis]
}

# HTTP proxy (redirects to HTTPS) - Global external Application Load Balancer
resource "google_compute_target_http_proxy" "frontend" {
  name    = "${var.project_id}-frontend-http-proxy"
  url_map = google_compute_url_map.frontend_redirect.id

  depends_on = [google_project_service.required_apis]
}

# URL map for HTTP to HTTPS redirect - Global external Application Load Balancer
resource "google_compute_url_map" "frontend_redirect" {
  name = "${var.project_id}-frontend-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

# Managed SSL certificate with improved lifecycle management
resource "google_compute_managed_ssl_certificate" "frontend" {
  name = random_id.certificate.hex

  managed {
    domains = local.managed_domains
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [google_project_service.required_apis]
}

# Global IP address
resource "google_compute_global_address" "frontend" {
  name         = "${var.project_id}-frontend-ip"
  address_type = "EXTERNAL"
}

# Global forwarding rule for HTTPS - Global external Application Load Balancer
resource "google_compute_global_forwarding_rule" "frontend_https" {
  name                  = "${var.project_id}-frontend-https"
  target                = google_compute_target_https_proxy.frontend.id
  port_range            = "443"
  ip_address            = google_compute_global_address.frontend.address
  load_balancing_scheme = "EXTERNAL_MANAGED"

  depends_on = [google_project_service.required_apis]
}

# Global forwarding rule for HTTP (redirect to HTTPS) - Global external Application Load Balancer
resource "google_compute_global_forwarding_rule" "frontend_http" {
  name                  = "${var.project_id}-frontend-http"
  target                = google_compute_target_http_proxy.frontend.id
  port_range            = "80"
  ip_address            = google_compute_global_address.frontend.address
  load_balancing_scheme = "EXTERNAL_MANAGED"

  depends_on = [google_project_service.required_apis]
}

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
        "autoscaling.knative.dev/maxScale" = "10"
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

# Billing budget alert (optional)
resource "google_billing_budget" "monthly_budget" {
  count = var.billing_account_id != "" ? 1 : 0

  display_name = "Monthly Budget Alert - ${var.project_id}"
  billing_account = var.billing_account_id

  amount {
    specified_amount {
      currency_code = "USD"
      units = tostring(var.budget_amount)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis      = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.8
    spend_basis      = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis      = "CURRENT_SPEND"
  }

  # Note: Notification channels require additional setup
  # For email notifications, you'll need to create a notification channel separately
  all_updates_rule {
    monitoring_notification_channels = []
    pubsub_topic = ""
    schema_version = "1.0"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Outputs
output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "frontend_bucket" {
  description = "Frontend storage bucket name"
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
  value = <<EOT
Create the following DNS A record:
  Name: diktator.gc.flaatten.org
  Type: A
  Value: ${google_compute_global_address.frontend.address}
  TTL: 300 (or your preferred value)
EOT
}

output "api_url" {
  description = "Backend API URL"
  value       = google_cloud_run_service.api.status[0].url
}

output "cicd_service_account_email" {
  description = "CI/CD service account email"
  value       = google_service_account.cicd.email
}

output "cicd_service_account_key" {
  description = "CI/CD service account key (base64 encoded)"
  value       = google_service_account_key.cicd_key.private_key
  sensitive   = true
}
