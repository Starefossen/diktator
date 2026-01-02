# Documentation

This folder contains high-level documentation for the Diktator project. Implementation details should be discovered by reading the code.

## Documents

| Document                           | Purpose                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data model, security model, key decisions        |
| [USER-STORIES.md](USER-STORIES.md) | Product specification, personas, user journeys, feature backlog |

## What's NOT Documented Here

The following are intentionally **not** documented because they change frequently or are better understood by reading the code:

- **Environment variables** → See `mise.toml` and `.env.example` files
- **Configuration** → Run `mise run --help` for available tasks
- **API endpoints** → Run the server and visit `/docs` for Swagger UI
- **Infrastructure details** → See `/terraform` directory
- **Component implementation** → Read the source code in `/frontend` and `/backend`

## Documentation Principles

1. **Document the why, not the how** - Code shows how; docs explain why
2. **Keep it stable** - Only document things that don't change often
3. **Single source of truth** - Don't duplicate what's in code or config files
4. **High-level focus** - Architecture and product decisions, not implementation details
