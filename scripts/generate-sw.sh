#!/bin/bash

# Generate service worker with version based on git commit or timestamp
# Git-based versioning ensures same code = same cache version (reproducible builds)
# Falls back to timestamp if not in a git repository

if git rev-parse --git-dir > /dev/null 2>&1; then
  # Use short git commit SHA for reproducible builds
  CACHE_VERSION=$(git rev-parse --short HEAD)
  echo "Using git-based version: $CACHE_VERSION"
else
  # Fallback to timestamp if not in git
  CACHE_VERSION=$(date +%Y%m%d-%H%M%S)
  echo "Git not available, using timestamp: $CACHE_VERSION"
fi

TEMPLATE_FILE="public/sw.template.js"
OUTPUT_FILE="public/sw.js"

echo "Generating service worker with cache version: $CACHE_VERSION"

# Replace template placeholder with actual cache version
sed "s/{{CACHE_VERSION}}/$CACHE_VERSION/g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "✅ Service worker generated at $OUTPUT_FILE"
