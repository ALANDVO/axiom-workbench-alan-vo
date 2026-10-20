# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-20

### Added
- FastAPI backend with model registry API (CRUD + versioning)
- React + TypeScript + Vite frontend with model registry page
- SQLite database with SQLAlchemy async ORM
- Docker Compose with backend, frontend, and Keycloak
: Pytest test suite (24 backend tests)
: Vitest test suite (6 frontend tests)
- GitHub Actions CI workflow
- Portfolio.json manifest
- Comprehensive README with API docs

### Security
- No hardcoded secrets; all credentials via environment variables
- Input validation via Pydantic/Zod schemas
- CORS configured for local development

### Known Limitations
- Authentication not yet implemented (planned for auth-oidc feature)
- Workflow graph editor not yet implemented (planned for workflow-graph feature)
- Inference engine not yet implemented (planned for inference-engine feature)
- LLM adapters not yet implemented (planned for llm-adapters feature)