# Frontend Global External Application Load Balancer Setup

## Overview

The frontend is now served through a Google Cloud Global external Application Load Balancer with Cloud CDN for better performance, advanced features, and proper SPA routing support.

## Architecture

```text
Internet → Global external Application Load Balancer (HTTPS) → Cloud CDN → Cloud Storage Bucket
                              ↓
                    Managed SSL Certificate
```

## Benefits

1. **HTTPS Support**: Managed SSL certificates with automatic renewal
2. **Global CDN**: Enhanced global content delivery network for faster loading
3. **Advanced Features**: Support for advanced routing, security policies, and observability
4. **Better Performance**: Improved latency and throughput compared to classic load balancers
5. **SPA Routing**: Proper URL handling for single-page application routes
6. **Custom Domains**: Full support for custom domain names
7. **HTTP to HTTPS Redirect**: Automatic security redirects
8. **Load Balancing Scheme**: Uses `EXTERNAL_MANAGED` for modern capabilities

## URLs Available

After deployment, you'll have multiple ways to access the frontend:

1. **Load Balancer (Recommended for Production)**:
   - HTTPS: `https://diktator-app.web.app` (or your custom domain)
   - Features: SSL, CDN, SPA routing, custom domains

2. **Cloud Storage Website Hosting**:
   - HTTP: `http://bucket-name.storage.googleapis.com`
   - Features: Basic SPA routing via 404.html fallback

3. **Direct Cloud Storage Access**:
   - HTTPS: `https://storage.googleapis.com/bucket-name/index.html`
   - Features: Direct file access, no SPA routing

## Setup Instructions

### 1. Deploy Infrastructure

```bash
# Apply the terraform configuration
mise run tofu-apply

# Check load balancer status
mise run lb-status
```

### 2. SSL Certificate Provisioning

The SSL certificate will be automatically provisioned, but it can take 10-60 minutes. Check status:

```bash
gcloud compute ssl-certificates describe diktator-app-frontend-ssl --global
```

### 3. Custom Domain (Optional)

If you want to use your own domain:

1. Update the `domain` variable in `terraform/terraform.tfvars`:
   ```hcl
   domain = "your-domain.com"
   ```

2. Apply the changes:
   ```bash
   mise run tofu-apply
   ```

3. Create DNS A record pointing to the load balancer IP:
   ```
   Type: A
   Name: @ (or your subdomain)
   Value: [Load Balancer IP from tofu output]
   ```

### 4. Deploy Frontend

Deploy your frontend files to the bucket:

```bash
mise run deploy-frontend
```

## SSL Certificate Management

The infrastructure uses an improved SSL certificate management pattern with:

- **Random Naming**: Certificates use random IDs to avoid naming conflicts
- **Domain Keepers**: Automatic recreation when domains change
- **Lifecycle Management**: Proper `create_before_destroy` lifecycle
- **Certificate Manager API**: Enhanced certificate provisioning

The certificate will automatically:

- Recreate if you change the domain configuration
- Handle conflicts during updates
- Maintain zero-downtime certificate rotation

Certificate status can be checked with:

```bash
gcloud compute ssl-certificates list --format="table(name,managed.status,managed.domains.list())"
```

## SPA Routing Configuration

The load balancer is configured with URL rewriting rules to handle SPA routing:

- `/`, `/practice`, `/about` → redirected to `/index.html`
- Static assets (`/_next/*`, `*.js`, `*.css`, etc.) → served directly
- 404 errors → served with `/index.html` (SPA takes over routing)

## Global External Application Load Balancer Configuration

### Modern Load Balancer Architecture

The current configuration uses Google Cloud's **Global external Application Load Balancer** (`EXTERNAL_MANAGED`) which provides:

- **Full compatibility** with Google Cloud Console and all features
- **Enhanced performance** with improved global routing
- **Advanced capabilities** like security policies and traffic management
- **Better observability** with detailed metrics and logging

### Solution Implementation

```hcl
resource "google_compute_url_map" "frontend" {
  name            = "${var.project_id}-frontend-url-map"
  description     = "Global external Application Load Balancer for frontend SPA"
  default_service = google_compute_backend_bucket.frontend.id
}

resource "google_compute_global_forwarding_rule" "frontend_https" {
  name                  = "${var.project_id}-frontend-https"
  target                = google_compute_target_https_proxy.frontend.id
  port_range            = "443"
  ip_address            = google_compute_global_address.frontend.address
  load_balancing_scheme = "EXTERNAL_MANAGED"  # Global external Application Load Balancer
}
```

### How SPA Routing Works Now

1. **All requests** go to the Cloud Storage backend bucket
2. **Static files** (like `index.html`, `/_next/*`, etc.) are served directly
3. **Non-existent paths** (like `/practice`, `/about`) trigger a 404
4. **Cloud Storage** serves `index.html` for 404s (configured with `not_found_page = "index.html"`)
5. **React Router** takes over and handles client-side routing

### Benefits of This Approach

- **Fully supported** by Google Cloud Console
- **Simpler configuration** with fewer moving parts
- **Standard practice** for SPA hosting on Cloud Storage
- **Better compatibility** with Google Cloud tools and monitoring

### Load Balancer Features Retained

- ✅ HTTPS with managed SSL certificates
- ✅ Global CDN caching
- ✅ HTTP to HTTPS redirects
- ✅ Custom domain support (`diktator.gc.flaatten.org`)
- ✅ SPA routing support

## Monitoring and Troubleshooting

### Check Load Balancer Status
```bash
mise run lb-status
```

### Check SSL Certificate
```bash
gcloud compute ssl-certificates list
gcloud compute ssl-certificates describe diktator-app-frontend-ssl --global
```

### Check Backend Health
```bash
gcloud compute backend-buckets describe diktator-app-frontend-backend --global
```

### Test URLs
```bash
# Test HTTP redirect
curl -I http://[LOAD_BALANCER_IP]

# Test HTTPS
curl -I https://your-domain.com

# Test SPA routing
curl -I https://your-domain.com/practice
```

## Performance Benefits

- **Global CDN**: Content served from edge locations worldwide
- **Caching**: Static assets cached with appropriate TTL
- **Compression**: Automatic gzip compression for text files
- **HTTP/2**: Modern protocol support for faster loading

## Security Features

- **HTTPS Only**: All traffic redirected to secure connections
- **Managed SSL**: Google-managed certificates with auto-renewal
- **CORS Support**: Configured for API access
- **Security Headers**: Standard security headers applied

## Migration to Global External Application Load Balancer

### What Changed

We've migrated from the classic HTTP(S) load balancer to the **Global external Application Load Balancer** which provides:

- **Enhanced Performance**: Better global routing and reduced latency
- **Advanced Features**: Support for advanced traffic management and security policies
- **Better Observability**: Enhanced monitoring and logging capabilities
- **Future-Ready**: Built on Google's latest load balancing technology
- **Improved CDN**: Better integration with Cloud CDN for optimal caching

### Key Technical Changes

1. **Load Balancing Scheme**: Changed from `EXTERNAL` to `EXTERNAL_MANAGED`
2. **Enhanced CDN Policy**: Improved caching configuration with client TTL
3. **Better SSL Management**: Enhanced certificate provisioning with Certificate Manager API
4. **Modern Architecture**: Aligned with Google Cloud's recommended practices

### Migration Benefits

- ✅ **No downtime**: Migration is handled seamlessly by Google Cloud
- ✅ **Same IP address**: Your DNS records remain unchanged
- ✅ **Better performance**: Improved global routing and caching
- ✅ **Enhanced features**: Access to advanced load balancing capabilities
- ✅ **Future compatibility**: Built on Google's next-generation infrastructure
