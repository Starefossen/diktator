# Diktator

A project management application built with Next.js and Go.

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS (SPA Mode)
- **Backend**: Go with Gin HTTP framework
- **Deployment**: Google Cloud (Cloud Run for backend, Cloud Storage for frontend)
- **Configuration**: Centralized management using mise environments

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

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.21+
- Docker (for backend deployment)
- [mise](https://mise.jdx.dev/) (recommended for local development)
- [OpenTofu](https://opentofu.org/) (for infrastructure setup)

## Getting Started

### Quick Start with mise (Recommended)

```bash
# Install dependencies and start development servers
mise install
mise run install
mise run dev
```

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
```

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

Set up the Google Cloud infrastructure using OpenTofu:

**Option A - Automatic setup (recommended):**

```bash
mise run tofu-auto-setup    # Uses your current gcloud project
mise run tofu-init
mise run tofu-apply
```

**Option B - Manual setup:**

```bash
mise run tofu-setup         # Creates terraform.tfvars template
# Edit terraform/terraform.tfvars with your project details
mise run tofu-init
mise run tofu-apply
```

This will create the infrastructure (Cloud Run service, Cloud Storage bucket, IAM roles) but won't deploy the application code.

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
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD pipelines
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

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