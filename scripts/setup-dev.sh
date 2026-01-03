#!/bin/bash

# Diktator Local Development Setup Script
# This script sets up the complete development environment with PostgreSQL

set -e

echo "🚀 Setting up Diktator for local development..."

# Check if mise is installed
if ! command -v mise &> /dev/null; then
    echo "❌ Error: mise is not installed. Please install mise first:"
    echo "   curl https://mise.run | sh"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📦 Installing tools and dependencies..."
mise install

echo "📚 Installing frontend dependencies..."
cd frontend && pnpm install && cd ..

echo "🗃️ Installing backend dependencies..."
cd backend && go mod tidy && cd ..

echo "⚙️ Setting up development configuration..."
mise run config:dev

echo "🐘 Starting PostgreSQL..."
mise run db:start

echo "🗄️ Database migrations will run automatically on first backend start..."

echo "✅ Setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  Start full dev environment:  mise run dev"
echo "  Start frontend only:         mise run frontend:dev"
echo "  Start backend only:          mise run backend:dev"
echo "  Start backend in background: mise run backend:start"
echo ""
echo "🌐 Development URLs:"
echo "  Frontend:         http://localhost:3000"
echo "  Backend API:      http://localhost:8080"
echo "  PostgreSQL:       localhost:5432"
echo ""
echo "🔧 Auth is configured in 'mock' mode - no OIDC provider needed."
