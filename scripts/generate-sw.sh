#!/bin/bash

# Generate service worker with current timestamp version
CACHE_VERSION=$(date +%Y%m%d-%H%M%S)
TEMPLATE_FILE="public/sw.template.js"
OUTPUT_FILE="public/sw.js"

echo "Generating service worker with cache version: $CACHE_VERSION"

# Replace template placeholder with actual cache version
sed "s/{{CACHE_VERSION}}/$CACHE_VERSION/g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Service worker generated at $OUTPUT_FILE"
