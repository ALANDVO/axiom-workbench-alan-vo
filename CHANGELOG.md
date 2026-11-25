# Changelog

## 1.6.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.5.1 — work-in-progress checkpoint
- Fixed model create: added `file_path`, `file_size`, `hash_sha256` to `ModelCreate` schema
- Fixed model response: updated `ModelResponse` schema with all conversion fields
- Fixed model list: renamed `models` to `items` in `ModelListResponse` schema
- Fixed model version create: added `version`, `file_path`, `file_size`, `hash_sha256`, `changelog` to `ModelVersionCreate` schema
- Fixed model version response: updated `ModelVersionResponse` schema with all fields
- Fixed model update: added `display_name`, `description`, `architecture`, `format` to `ModelUpdate` schema
- Added name validation to `create_model` endpoint (alphanumeric + `_` `-`)
- Added hash validation to `create_model_version` endpoint (64 hex characters required)
- All 24 model registry tests pass
- 4/5 graph API tests pass

Partial code published for continued development. Known issues: STATUS.md.

## 1.4.1 — version display correction

Synchronize README, package metadata, API version, and UI footer with the published checkpoint version. Application QA remains unfinished as documented in STATUS.md.

## 1.4.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.3.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.2.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.1.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

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

---

Alan Vo · [alanvo.net](https://alanvo.net) · [X: @alanvoasi](https://x.com/alanvoasi)
