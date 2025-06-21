# Random ID for SSL certificate management
resource "random_id" "certificate" {
  byte_length = 4
  prefix      = "${var.project_id}-ssl-"

  keepers = {
    domains = join(",", local.managed_domains)
  }
}

# Create a backend bucket for the Global external Application Load Balancer
resource "google_compute_backend_bucket" "frontend" {
  name        = "${var.project_id}-frontend-backend"
  description = "Backend bucket for frontend static files - Global external Application Load Balancer"
  bucket_name = google_storage_bucket.frontend.name
  enable_cdn  = true

  cdn_policy {
    cache_mode       = "CACHE_ALL_STATIC"
    default_ttl      = 3600  # 1 hour
    max_ttl          = 86400 # 24 hours
    client_ttl       = 3600  # 1 hour
    negative_caching = true

    negative_caching_policy {
      code = 404
      ttl  = 60 # Cache 404s for 1 minute
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
