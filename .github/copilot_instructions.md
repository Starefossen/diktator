# GitHub Copilot Instructions

## Project Overview

Diktator is a Norwegian vocabulary learning app for children with gamified tests and practice modes.

**Stack**: Next.js 14 + TypeScript + Tailwind CSS (frontend) | Go + Gin (backend) | Firebase Auth + Firestore | Google Cloud (Cloud Run + Storage)

## Code Style & Conventions

### General

- Keep responses **short and concise** - this is a personal fun project
- Prefer functional programming patterns
- Use descriptive variable names
- Always include error handling
- Write tests for new features

### Frontend (Next.js + TypeScript)

- Use **App Router** (not Pages Router)
- **Server Components** by default, use `'use client'` only when needed
- **Tailwind CSS** for styling - mobile-first responsive design
- TypeScript: strict mode, explicit types, no `any`
- React patterns: custom hooks, context for global state
- Form handling: React Hook Form + Zod validation
- Firebase SDK v9+ modular imports

### Backend (Go)

- **Gin framework** for HTTP routing
- Standard Go project layout: `cmd/`, `handlers/`, `models/`
- Error handling: explicit errors, structured logging
- JSON responses: consistent structure
- Environment variables for configuration
- Graceful shutdown handling

### Infrastructure & DevOps

- **OpenTofu/Terraform**: modular files, proper resource naming
- **Google Cloud**: Cloud Run, Storage, IAM least privilege
- **mise** for tool management and task automation
- **Firebase Emulators** for local development
- Docker: multi-stage builds, minimal base images

## Development Workflow

### Available Commands

Always use the `mise` tool for running commands in this project. It manages dependencies and scripts.

```bash
mise run dev              # Full dev environment
mise run frontend         # Frontend only (:3000)
mise run backend         # Backend only (:8080)
mise run test            # All quality checks
mise run format          # Format all code
mise run deploy-frontend # Deploy to Cloud Storage
mise run deploy-backend  # Deploy to Cloud Run
```

### File Structure

```
frontend/src/
  app/           # Next.js App Router pages
  components/    # Reusable UI components
  lib/          # Utilities, Firebase config
backend/
  cmd/server/   # Application entrypoint
  handlers/     # HTTP route handlers
terraform/      # Infrastructure (modular files)
```

## Firebase Integration

- **Auth**: Email/password, user profiles
- **Firestore**: User data, test results, vocabulary
- **Emulators**: Use for local development
- **Config**: Environment-specific Firebase config

## Code Generation Preferences

### When suggesting code:

1. **Be concise** - minimal working examples
2. **Include imports** - show exact import statements
3. **Error handling** - always include proper error handling
4. **TypeScript** - provide full type definitions
5. **Testing** - suggest test patterns when relevant

### For React components:

- Functional components with hooks
- TypeScript interface for props
- Tailwind for styling
- Server Components when possible

### For Go code:

- Proper error handling with structured responses
- Context usage for request handling
- Clean separation of concerns
- Standard library first, minimal dependencies

### For Infrastructure:

- Reference existing modular Terraform structure
- Follow Google Cloud best practices
- Include proper resource dependencies
- Use local values for repeated configurations

## Project-Specific Context

- **Target audience**: Children learning Norwegian
- **UI/UX**: Simple, colorful, gamified interface
- **Performance**: Fast loading, offline-capable
- **Security**: Firebase Auth, proper CORS, input validation
- **Deployment**: Automated via GitHub Actions
- **Monitoring**: Google Cloud monitoring, optional budget alerts

## Don't Suggest

- Complex state management (keep it simple)
- Over-engineering solutions
- Deprecated Firebase v8 syntax
- Pages Router patterns (use App Router)
- Verbose documentation (keep it concise)
- Additional summary documents

Focus on practical, working code that fits this educational app's simple, fun nature.
