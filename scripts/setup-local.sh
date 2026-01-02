#!/bin/bash
# Local development setup script
# This script sets up the development environment for Diktator

set -e

echo "🚀 Setting up Diktator local development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is required but not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "⚠️  Go is not installed. You'll need Go to run the backend."
fi

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. You'll need Node.js to run the frontend."
fi

echo "✅ Prerequisites check complete"

# Start PostgreSQL
echo ""
echo "🗄️  Starting PostgreSQL..."
docker compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be healthy
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres -d diktator &> /dev/null; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL did not become ready in time"
        exit 1
    fi
    sleep 2
done

# Create database (if not exists - PostgreSQL handles this via env var)
echo ""
echo "📊 Database already created via Docker environment..."
echo "✅ Database ready"

# Run migrations
echo ""
echo "🔄 Running migrations..."
if command -v migrate &> /dev/null; then
    migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/diktator?sslmode=disable" up
    echo "✅ Migrations complete"
else
    echo "⚠️  golang-migrate not installed. Running migrations manually..."
    docker compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d diktator < migrations/000001_initial_schema.up.sql
    echo "✅ Migrations complete"
fi

# Setup backend environment
echo ""
echo "⚙️  Setting up backend environment..."
if [ ! -f backend/.env ]; then
    echo "   Creating backend/.env from example..."
    cp backend/env.example backend/.env 2>/dev/null || cat backend/env.example > backend/.env
    echo "   ⚠️  Please update backend/.env with your Google Cloud credentials"
fi

# Setup frontend environment
echo ""
echo "⚙️  Setting up frontend environment..."
if [ ! -f frontend/.env.local ]; then
    echo "   Creating frontend/.env.local from example..."
    cp frontend/env.example frontend/.env.local 2>/dev/null || cat frontend/env.example > frontend/.env.local
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
go mod download
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
if command -v pnpm &> /dev/null; then
    pnpm install
else
    echo "⚠️  pnpm not found, skipping frontend dependencies"
    echo "   Install pnpm: https://pnpm.io/installation"
fi
cd ..

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Development environment setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update backend/.env with your Google Cloud credentials:"
echo "   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json"
echo "   - GOOGLE_CLOUD_PROJECT=your-project-id"
echo "   - STORAGE_BUCKET=your-bucket.appspot.com"
echo ""
echo "2. Start the backend:"
echo "   cd backend && go run cmd/server/main.go"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd frontend && pnpm dev"
echo ""
echo "4. Access the app at http://localhost:3000"
echo ""
echo "🗄️  PostgreSQL: localhost:5432 (user: postgres, password: postgres)"
echo "═══════════════════════════════════════════════════════════════"
