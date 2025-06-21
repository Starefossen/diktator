#!/bin/bash
set -e

echo "Setting up Docker buildx for cross-platform builds..."

# Create a new buildx builder instance if it doesn't exist
if ! docker buildx ls | grep -q "diktator-builder"; then
    echo "Creating new buildx builder..."
    docker buildx create --name diktator-builder --use --platform linux/amd64,linux/arm64
else
    echo "Using existing buildx builder..."
    docker buildx use diktator-builder
fi

# Bootstrap the builder
docker buildx inspect --bootstrap

echo "Buildx setup complete!"
