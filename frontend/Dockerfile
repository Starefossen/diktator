# Frontend Dockerfile - Ultra-minimal nginx-micro setup for static Next.js export
# Build is done outside Docker for performance

# Use nginx-micro for minimal size (160x smaller than nginx:alpine)
# Using gzip-upx variant for smallest size with gzip support
FROM ghcr.io/johnnyjoy/nginx-micro:1.29.4-gzip-upx

# Copy custom nginx configuration to /conf/nginx.conf
COPY nginx.conf /conf/nginx.conf

# Copy pre-built static files to /www
COPY out/ /www/

# Expose port 8080 (nginx-micro runs as non-root uid 101, cannot bind to port 80)
EXPOSE 8080

# Start nginx (binary is at /nginx)
# Use default CMD from nginx-micro (config path is already set to /conf/nginx.conf during build)
CMD ["/nginx", "-g", "daemon off;"]
