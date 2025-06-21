# Diktator

![Diktator Logo](./docs/diktator-banner.png)

Diktator is a web application designed to help children learn Norwegian vocabulary through gamified tests and practice modes. It features a modern frontend built with Next.js and TypeScript, a backend API in Go, and uses Firebase for authentication and real-time data storage.

## Features

- 🌍 **Multilingual Support**: English and Norwegian (🇬🇧/🇳🇴)
- 🔥 **Firebase Integration**: Authentication and real-time data storage
- 🎮 **Gamification**: Score tracking, progress monitoring, and statistics
- 🎯 **Practice Modes**: Hover-to-reveal word practice with speech synthesis
- 📊 **Analytics**: Detailed test results and performance tracking
- 👥 **User Profiles**: Personal statistics and progress history

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and Firebase SDK
- **Authentication**: Firebase Auth with email/password
- **Database**: Firestore for user data, test results, and analytics
- **Backend**: Go with Gin HTTP framework (for future API features)
- **Deployment**: Google Cloud (Cloud Run + Cloud Storage)
- **Development**: Firebase Emulators for local development

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Go 1.21+
- [mise](https://mise.jdx.dev/) (recommended for tool management)
- Firebase CLI (installed automatically)

### 2. One-Command Setup

```bash
# Clone the repository
git clone https://github.com/starefossen/diktator.git
cd diktator

# Install mise if you haven't already
curl https://mise.run | sh

# Complete setup (tools, dependencies, Firebase emulators)
mise run setup
```

### 3. Start Development

```bash
# Start full development environment (Firebase emulators + frontend + backend)
mise run dev

# Or start components individually:
mise run frontend          # Frontend only (:3000)
mise run backend          # Backend only (:8080)
mise run firebase-emulators # Firebase emulators only
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

- 🌐 **Frontend**: <http://localhost:3000>
- 🔥 **Firebase UI**: <http://localhost:4000>
- 🔧 **Backend API**: <http://localhost:8080>

## Development URLs

| Service       | URL                     | Purpose             |
| ------------- | ----------------------- | ------------------- |
| Frontend App  | <http://localhost:3000> | Main application    |
| Firebase UI   | <http://localhost:4000> | Emulator management |
| Auth Emulator | <http://localhost:9099> | Firebase Auth       |
| Firestore     | <http://localhost:8088> | Database emulator   |
| Backend API   | <http://localhost:8080> | Go API server       |

## Available Tasks

### Core Development

- `mise run dev` - Start full development environment
- `mise run frontend` - Frontend development server only
- `mise run backend` - Backend development server only
- `mise run firebase-emulators` - Firebase emulators only

### Quality Assurance

- `mise run test` - Run all tests and quality checks
- `mise run lint` - Lint all code (ESLint + go vet)
- `mise run format` - Format all code (prettier + go fmt + tofu fmt)
- `mise run typecheck` - Type checking (TypeScript + Go build check)

### Build & Deployment

- `mise run build` - Build all components for production
- `mise run deploy-backend` - Deploy backend to Cloud Run
- `mise run deploy-frontend` - Deploy frontend to Cloud Storage
- `mise run clean` - Clean build artifacts

### Infrastructure (OpenTofu)

- `mise run tofu-init` - Initialize OpenTofu
- `mise run tofu-plan` - Plan infrastructure changes
- `mise run tofu-apply` - Apply infrastructure changes
- `mise run tofu-fmt` - Format Terraform/OpenTofu files

### Utilities

- `mise run setup` - Complete project setup
- `mise run check` - Alias for `test`
- `mise run fmt` - Alias for `format`

## Configuration Management

This project uses a centralized configuration system with mise environments:

- **Static Config**: Application constants defined in `mise.toml`
- **Dynamic Config**: Automatically loaded from terraform outputs
- **Environment Files**: Generated for Next.js production builds

```bash
# Load current configuration
mise run config-load

# Check all configuration values
mise run config-check

# Generate production environment
mise run env-production
```

For detailed information, see [docs/CONFIGURATION.md](docs/CONFIGURATION.md).
mise run dev

````

This will start both frontend (<http://localhost:3000>) and backend (<http://localhost:8080>).

### Google Cloud Setup

```bash
# Authenticate with Google Cloud
mise run gcloud-auth

# Set your project
mise run gcloud-set-project -- your-project-id

# Enable required APIs
mise run gcloud-enable-apis

# Check environment
mise run env-check
````

### Manual Setup

#### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

#### Backend Development

```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

The backend API will be available at `http://localhost:8080`.

### Testing

**With mise:**

```bash
mise run test          # Run all tests
mise run test-frontend # Frontend only
mise run test-backend  # Backend only
```

**Manual:**

**Frontend:**

```bash
cd frontend
npm run lint
npm run type-check
```

**Backend:**

```bash
cd backend
go test ./...
go vet ./...
```

## Deployment

### Infrastructure Setup

The infrastructure uses OpenTofu (open-source Terraform) with a well-organized file structure for maintainability.

**Quick Setup (recommended):**

```bash
# Automatic setup using your current gcloud project
mise run tofu-auto-setup
mise run tofu-init
mise run tofu-apply
```

**Manual Setup:**

```bash
# Create configuration template
mise run tofu-setup
# Edit terraform/terraform.tfvars with your project details
mise run tofu-init
mise run tofu-apply
```

The infrastructure configuration is organized into logical files:

- `versions.tf` - Provider configurations and version constraints
- `variables.tf` - Input variables and configuration
- `apis.tf` - Google Cloud API enablement
- `iam.tf` - Service accounts and permissions
- `storage.tf` - Frontend static file hosting
- `load_balancer.tf` - HTTPS load balancer with CDN
- `cloud_run.tf` - Backend API service
- `firebase.tf` - Authentication and database
- `billing.tf` - Cost monitoring (optional)
- `outputs.tf` - Integration values

For detailed infrastructure documentation, see [terraform/README.md](terraform/README.md).

### Application Deployment

After the infrastructure is set up, deploy the applications:

**Deploy Backend:**

```bash
# Start Docker Desktop (open the Docker Desktop application)
# Verify Docker is running:
docker ps

# Configure Docker for GCR (one-time setup)
gcloud auth configure-docker

# Build and deploy the backend (automatically builds for linux/amd64)
mise run deploy-backend
```

**Deploy Frontend:**

```bash
mise run deploy-frontend
```

See [terraform/README.md](terraform/README.md) for detailed instructions.

### Automated Deployment

Deployment is automated via GitHub Actions using mise tasks:

- Backend deploys to Google Cloud Run on changes to `backend/`
- Frontend deploys to Google Cloud Storage on changes to `frontend/`

### Required Secrets

Configure these secrets in your GitHub repository (get values from `tofu output`):

- `GCP_SA_KEY`: Google Cloud Service Account JSON key
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `GCP_FRONTEND_BUCKET`: Cloud Storage bucket name for frontend

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for detailed environment variable documentation.

## Project Structure

```text
.
├── backend/                 # Go API server
│   ├── cmd/server/         # Application entrypoint
│   ├── handlers/           # HTTP handlers
│   └── Dockerfile          # Backend container
├── frontend/               # Next.js application
│   ├── src/               # Source code
│   └── public/            # Static assets
├── terraform/             # Infrastructure as Code (OpenTofu)
│   ├── main.tf            # Entry point and documentation
│   ├── versions.tf        # Provider configurations
│   ├── variables.tf       # Input variables
│   ├── apis.tf           # API enablement
│   ├── iam.tf            # Service accounts & permissions
│   ├── storage.tf        # Frontend hosting (Cloud Storage)
│   ├── load_balancer.tf  # HTTPS load balancer & CDN
│   ├── cloud_run.tf      # Backend service (Cloud Run)
│   ├── firebase.tf       # Authentication & database
│   ├── billing.tf        # Cost monitoring (optional)
│   └── outputs.tf        # Integration values
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD pipelines
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `mise run test`
4. Submit a pull request

For AI assistance, see [GitHub Copilot Instructions](.github/copilot_instructions.md) for project-specific guidance.

## License

MIT

### Available mise Tasks

**Development:**

```bash
mise run dev                # Start both frontend & backend
mise run dev-frontend-only  # Frontend only
mise run dev-backend-only   # Backend only
mise run install            # Install all dependencies
mise run clean              # Clean build artifacts
```

**Testing & Quality:**

```bash
mise run test               # Run all tests
mise run test-frontend      # Frontend tests only
mise run test-backend       # Backend tests only
mise run check              # All linting and tests
mise run fmt                # Format all code
```

**Google Cloud:**

```bash
mise run gcloud-auth        # Authenticate with Google Cloud
mise run gcloud-set-project # Set GCP project
mise run gcloud-enable-apis # Enable required APIs
mise run env-check          # Check environment variables
```

**Local Deployment:**

```bash
mise run docker-build       # Build Docker image locally
mise run docker-run         # Run backend container
mise run deploy-backend     # Deploy to Cloud Run
mise run deploy-frontend    # Deploy to Cloud Storage
```

**Infrastructure:**

```bash
mise run tofu-setup          # Create terraform.tfvars template
mise run tofu-auto-setup     # Auto-setup using gcloud project
mise run tofu-init           # Initialize OpenTofu
mise run tofu-plan           # Plan infrastructure changes
mise run tofu-apply          # Apply infrastructure
mise run tofu-destroy        # Destroy infrastructure
mise run tofu-output         # Show outputs
mise run tofu-validate       # Validate configuration
```

> **Note**: Infrastructure setup (`tofu apply`) and application deployment are separate steps. The OpenTofu configuration creates the infrastructure with a placeholder image, and then you deploy your actual application code using the mise deployment tasks. Docker images are automatically built for the correct architecture (linux/amd64) for Cloud Run compatibility.
