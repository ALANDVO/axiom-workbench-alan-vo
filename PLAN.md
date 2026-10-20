# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

core-skeleton

## Roadmap

### core-skeleton — FastAPI/React skeleton with model registry workflow

Status: done

Acceptance:
- Backend FastAPI app starts and serves /health endpoint
- Frontend React + Vite + TypeScript builds and loads
- Model registry API: POST /api/v1/models registers a diffusion model, GET /api/v1/models lists them
- Frontend model registry page shows list and allows adding models
- Docker compose with backend, frontend, and Keycloak starts
- Backend tests pass (pytest)
- Frontend typecheck, build, and tests pass
- CI workflow runs backend and frontend tests

Implementation: `backend/app/main.py`, `backend/app/api/models.py`, `backend/app/api/schemas.py`, `backend/app/models/model.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/requirements.txt`, `backend/Dockerfile`, `backend/tests/test_models.py`, `frontend/package.json`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/styles/global.css`, `frontend/src/api/client.ts`, `frontend/src/types/models.ts`, `frontend/src/pages/ModelRegistry.tsx`, `frontend/src/components/ModelForm.tsx`, `frontend/src/components/ModelList.tsx`, `frontend/Dockerfile`, `frontend/nginx.conf`, `compose.yaml`, `.github/workflows/ci.yml`, `portfolio.json`, `README.md`, `LICENSE`, `CHANGELOG.md`, `pyproject.toml`, `.gitignore`, `.env.example`

Tests: `backend/tests/test_models.py`, `frontend/src/__tests__/ModelRegistry.test.tsx`, `frontend/src/__tests__/setup.ts`

### workflow-graph — Graph/nodes workflow editor

Status: planned

Acceptance:
- Canvas with draggable nodes
- Nodes connect via edges
- Workflow serializes to JSON
- Backend validates and executes workflow DAG

### inference-engine — Local diffusion inference engine

Status: planned

Acceptance:
- Loads safetensors checkpoints
- Runs denoising loop with Euler sampler
- Supports FLUX and SDXL architectures
- VRAM-aware offloading

### auth-oidc — OIDC/Keycloak authentication

Status: planned

Acceptance:
- Login redirects to Keycloak
- Callback exchanges code for tokens
- HttpOnly cookies with CSRF protection
- Role-based access control

### llm-adapters — LLM provider adapters

Status: planned

Acceptance:
- OpenAI-compatible adapter
- Anthropic messages adapter
- Gemini generateContent adapter
- Ollama adapter

