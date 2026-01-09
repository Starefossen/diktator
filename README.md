# Diktator

![App Preview](./docs/diktator-preview.png)

Diktator is a Norwegian vocabulary learning app for children featuring gamified spelling tests, practice modes, and real-time feedback. Built with Next.js, TypeScript, Go, and PostgreSQL.

## Features

- 🌍 **Multilingual**: English and Norwegian (🇬🇧/🇳🇴)
- 🔐 **OIDC Authentication**: Flexible provider support with mock mode for development
- 👨‍👩‍👧‍👦 **Family Management**: Parent registration flow, child invitations, family-scoped data
- ✍️ **Spelling Analysis**: Norwegian Bokmål-aware feedback with visual error highlighting
- 🎯 **Test Modes**: Standard, Dictation, Translation with real-time validation
- 🎤 **Text-to-Speech**: On-demand audio generation for all words
- 📊 **Progress Tracking**: Detailed test results and performance analytics

## Architecture

**Frontend**: Next.js 16 + TypeScript + Tailwind CSS | **Backend**: Go + Gin | **Database**: PostgreSQL | **Auth**: OIDC (mock/production) | **Deployment**: Knative | **Dev Tools**: Mise + Docker Compose

## Quick Start

### 1. Prerequisites

- Node.js 24+
- Go 1.25+
- Docker & Docker Compose
- [mise](https://mise.jdx.dev/) (recommended for tool management)

### 2. One-Command Setup

```bash
# Clone the repository
git clone https://github.com/starefossen/diktator.git
cd diktator

# Install mise if you haven't already
curl https://mise.run | sh

# Complete setup (tools, dependencies, PostgreSQL)
mise run setup
```

### 3. Start Development

```bash
# Start full development environment (PostgreSQL + frontend + backend)
mise run dev

# Or start components individually:
mise run frontend:dev     # Frontend only (:3000)
mise run backend:dev      # Backend only (:8080)
mise run backend:start    # Backend in background
mise run db:start         # PostgreSQL only
```

### 4. Quality Assurance

```bash
# Run all quality checks
mise run test              # Lint + typecheck + tests

# Individual checks
mise run lint             # ESLint (frontend) + go vet (backend)
mise run format           # Format all code (prettier + go fmt + tofu fmt)
mise run typecheck        # TypeScript check + Go build check
```

### 5. Access the Application

| Service     | URL                          | Credentials       |
| ----------- | ---------------------------- | ----------------- |
| Frontend    | <http://localhost:3000>      | (mock auth)       |
| Backend API | <http://localhost:8080>      | -                 |
| API Docs    | <http://localhost:8080/docs> | Swagger UI        |
| PostgreSQL  | localhost:5432               | postgres/postgres |

## Available Tasks

### Core Development

- `mise run dev` - Start full development environment
- `mise run frontend:dev` - Frontend development server only
- `mise run backend:dev` - Backend with hot reload (air)
- `mise run backend:start` - Start backend in background
- `mise run backend:stop` - Stop background backend
- `mise run backend:restart` - Restart background backend
- `mise run backend:logs` - View backend logs
- `mise run backend:status` - Check backend status

### Database Management

- `mise run db:start` - Start PostgreSQL
- `mise run db:stop` - Stop PostgreSQL
- `mise run db:reset` - Reset database (destroy and recreate)
- `mise run db:shell` - Open PostgreSQL shell
- `mise run db:seed` - Seed database with test data
- `mise run db:reset-seed` - Reset database and seed with fresh test data

**Note:** Database migrations run automatically on backend startup.

### Testing

- `mise run test` - All tests (lint + typecheck + unit tests)
- `mise run test:all` - Complete suite including E2E tests
- `mise run backend:test` - Backend tests (requires PostgreSQL)
- `mise run frontend:test` - Frontend unit tests (Vitest)
- `mise run frontend:test-e2e` - E2E tests with Playwright

### Quality Assurance

- `mise run lint` - Lint all code (ESLint + go vet)
- `mise run format` - Format all code (prettier + go fmt + tofu fmt)
- `mise run typecheck` - Type checking (TypeScript + Go build check)

### API Documentation

- `mise run backend:swagger-gen` - Generate OpenAPI spec from Go code
- `mise run frontend:client-gen` - Generate TypeScript client from OpenAPI

## Configuration

**Development**: `AUTH_MODE=mock` (no OIDC needed), PostgreSQL in Docker
**Production**: `AUTH_MODE=oidc`, configure `OIDC_ISSUER_URL`, `OIDC_AUDIENCE`, `DATABASE_URL`

## Project Structure

```text
.
├── backend/                 # Go API server
│   ├── cmd/server/         # Application entrypoint
│   ├── handlers/           # HTTP handlers
│   ├── internal/           # Private application code
│   │   ├── middleware/     # HTTP middleware (auth)
│   │   ├── migrate/        # Database migrations (embedded)
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic (db, tts, storage)
│   ├── docs/               # Swagger documentation
│   └── Dockerfile          # Backend container
├── frontend/               # Next.js application
│   ├── src/               # Source code
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # Auth context (OIDC)
│   │   └── lib/           # Utilities and API clients
│   └── public/            # Static assets
├── terraform/             # Infrastructure as Code (OpenTofu)
├── docs/                  # Documentation
├── docker-compose.dev.yml # Local development services
├── mise.toml              # Task runner configuration
└── .github/workflows/     # CI/CD pipelines
```

## Authentication

**Mock Mode** (dev): Any credentials work → mock session
**OIDC Mode** (prod): Frontend redirects to provider → backend validates JWT

## Deployment

See [deploy/HOMELAB.md](deploy/HOMELAB.md) for Knative deployment instructions.

**Infrastructure**: OpenTofu (`mise run tofu:init/plan/apply`)
**Secrets**: `GCP_SA_KEY`, `GCP_PROJECT_ID` (TTS service)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `mise run test`
4. Submit a pull request

## License

MIT
