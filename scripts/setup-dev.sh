#!/bin/bash

# Diktator Local Development Setup Script
# This script sets up the complete development environment with Firebase emulators

set -e

echo "🚀 Setting up Diktator for local development..."

# Check if mise is installed
if ! command -v mise &> /dev/null; then
    echo "❌ Error: mise is not installed. Please install mise first:"
    echo "   curl https://mise.run | sh"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Installing tools and dependencies..."
mise install

echo "🔧 Setting up Firebase for local development..."
mise run firebase-setup

echo "📚 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "🗃️ Installing backend dependencies..."
cd backend && go mod tidy && cd ..

echo "✅ Setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  Start with Firebase emulators: mise run dev-with-firebase"
echo "  Start frontend only:           mise run frontend"
echo "  Start Firebase emulators only: mise run firebase-emulators"
echo ""
echo "🌐 Development URLs:"
echo "  Frontend:         http://localhost:3000"
echo "  Backend API:      http://localhost:8080"
echo "  Firebase UI:      http://localhost:4000"
echo "  Firebase Auth:    http://localhost:9099"
echo "  Firestore:        http://localhost:8088"
echo ""
echo "🔥 The app is configured to use Firebase emulators with demo data."
echo "   No real Firebase project needed for local development!"
