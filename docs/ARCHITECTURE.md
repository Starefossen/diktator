# Diktator - Architecture Overview

## Purpose

Diktator helps children learn vocabulary through audio-based spelling tests. Parents create word sets, children practice spelling by listening and typing, and the system tracks progress over time.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│    (Next.js)    │     │    (Go/Gin)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Cloud Storage  │
                        │  + TTS API      │
                        └─────────────────┘
```

| Component | Technology           | Hosting             | Purpose                       |
| --------- | -------------------- | ------------------- | ----------------------------- |
| Frontend  | Next.js + TypeScript | Cloud Storage + CDN | User interface                |
| Backend   | Go + Gin             | Cloud Run           | API, business logic           |
| Database  | PostgreSQL           | Cloud SQL           | User data, word sets, results |
| Storage   | Cloud Storage        | GCS                 | Audio files                   |
| Audio     | Text-to-Speech API   | GCP                 | Generate word pronunciations  |
| Auth      | OIDC                 | Zitadel             | User authentication           |

## Data Model

### Core Entities

```
Family (1) ─────────┬──────── (*) User
                    │              │
                    │              │ role: parent | child
                    │              │
                    └──── (*) WordSet ──── (*) Word
                                              │
                                              └── audio, translations

User (1) ──── (*) TestResult ──── (*) WordAnswer
```

**Family**: Groups users together. Word sets and data are family-scoped.

**User**: Either a parent (can manage family, create content) or child (can take tests, view own progress).

**WordSet**: A collection of words for testing. Has a language, optional translations, and test configuration.

**TestResult**: Record of a completed test with score, mode used, and per-word answers.

## Security Model

### Authentication & Authorization

```
User ──▶ OIDC Provider ──▶ JWT Token ──▶ Backend validates ──▶ PostgreSQL (family-scoped)
```

1. **Authentication**: OIDC (Zitadel) issues JWT tokens
2. **Authorization**: Backend validates JWT, extracts user identity
3. **Data Isolation**: All queries scoped to user's family ID

### Security Boundaries

| Boundary | Protection                                                    |
| -------- | ------------------------------------------------------------- |
| Public   | API URLs, static assets (harmless to expose)                  |
| Session  | JWT tokens (expire, revocable)                                |
| Data     | Family-scoped queries (parents see family, children see self) |
| Secrets  | Database credentials (backend only, never exposed)            |

### Role-Based Access

| Resource              | Parent | Child |
| --------------------- | ------ | ----- |
| Create/edit word sets | ✅      | ❌     |
| Create child accounts | ✅      | ❌     |
| View family progress  | ✅      | ❌     |
| Take tests            | ✅      | ✅     |
| View own results      | ✅      | ✅     |

## Key Design Decisions

### Why Static Frontend?
- Simple, cheap hosting on Cloud Storage
- Global CDN for fast loading
- No server-side rendering needed for this use case

### Why Go Backend?
- Fast, low memory footprint ideal for Cloud Run
- Strong typing catches errors early
- Excellent for API servers

### Why Family-Scoped Data?
- Parents need visibility into children's progress
- Children shouldn't see other families' data
- Simplifies authorization logic

### Why OIDC?
- Industry standard, battle-tested security
- Separates auth concerns from application
- Supports multiple identity providers

## API Design Principles

1. **RESTful**: Standard HTTP verbs and status codes
2. **Family-scoped**: Most endpoints filter by authenticated user's family
3. **Validated**: All input validated before processing
4. **Documented**: OpenAPI/Swagger specification generated from code

## Infrastructure

Managed via Terraform in `/terraform`. Key resources:

- Cloud Run service (backend)
- Cloud Storage buckets (frontend, audio)
- Cloud SQL instance (PostgreSQL)
- Load balancer with managed SSL
- IAM service accounts

## For More Information

- **User stories & features**: See [USER-STORIES.md](USER-STORIES.md)
- **Development setup**: See [README.md](../README.md)
- **API documentation**: Run `mise run dev` then visit http://localhost:8080/docs
- **Configuration**: Run `mise run --help` for available tasks
