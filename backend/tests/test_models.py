"""Backend tests for model registry."""
import pytest
from httpx import AsyncClient, ASGITransport
from uuid import uuid4

from app.main import app
from app.core.database import init_db, close_db, get_session, Base
from app.models.model import DiffusionModel, ModelVersion, ModelArchitecture, ModelFormat
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool


# Test database (in-memory SQLite with StaticPool for isolation)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestAsyncSessionMaker = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_session() -> AsyncSession:
    async with TestAsyncSessionMaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="function", autouse=True)
async def setup_test_db():
    """Initialize test database for each test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def test_session():
    """Get test database session."""
    async with TestAsyncSessionMaker() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client():
    """Create test client with dependency override."""
    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


class TestHealth:
    """Health endpoint tests."""

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "environment" in data


class TestModelRegistry:
    """Model registry API tests."""

    @pytest.mark.asyncio
    async def test_create_model(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/models",
            json={
                "name": "flux-dev",
                "display_name": "FLUX.1 Dev",
                "description": "FLUX.1 Dev model",
                "architecture": "flux",
                "format": "safetensors",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "flux-dev"
        assert data["display_name"] == "FLUX.1 Dev"
        assert data["architecture"] == "flux"
        assert data["format"] == "safetensors"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_model_duplicate_fails(self, client: AsyncClient):
        await client.post(
            "/api/v1/models",
            json={"name": "test-model", "display_name": "Test", "architecture": "sdxl"},
        )
        response = await client.post(
            "/api/v1/models",
            json={"name": "test-model", "display_name": "Test 2", "architecture": "sdxl"},
        )
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_create_model_different_arch_ok(self, client: AsyncClient):
        await client.post(
            "/api/v1/models",
            json={"name": "test-model", "display_name": "Test SDXL", "architecture": "sdxl"},
        )
        response = await client.post(
            "/api/v1/models",
            json={"name": "test-model", "display_name": "Test FLUX", "architecture": "flux"},
        )
        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_list_models_empty(self, client: AsyncClient):
        response = await client.get("/api/v1/models")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["page_size"] == 20

    @pytest.mark.asyncio
    async def test_list_models_with_data(self, client: AsyncClient):
        await client.post("/api/v1/models", json={"name": "m1", "display_name": "M1", "architecture": "sdxl"})
        await client.post("/api/v1/models", json={"name": "m2", "display_name": "M2", "architecture": "flux"})
        await client.post("/api/v1/models", json={"name": "m3", "display_name": "M3", "architecture": "sdxl"})

        response = await client.get("/api/v1/models")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    @pytest.mark.asyncio
    async def test_list_models_pagination(self, client: AsyncClient):
        for i in range(25):
            await client.post("/api/v1/models", json={"name": f"m{i}", "display_name": f"M{i}", "architecture": "sdxl"})

        response = await client.get("/api/v1/models?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["page"] == 1
        assert data["total_pages"] == 3

        response = await client.get("/api/v1/models?page=2&page_size=10")
        data = response.json()
        assert len(data["items"]) == 10
        assert data["page"] == 2

    @pytest.mark.asyncio
    async def test_list_models_filter_architecture(self, client: AsyncClient):
        await client.post("/api/v1/models", json={"name": "sdxl-1", "display_name": "SDXL 1", "architecture": "sdxl"})
        await client.post("/api/v1/models", json={"name": "flux-1", "display_name": "FLUX 1", "architecture": "flux"})

        response = await client.get("/api/v1/models?architecture=sdxl")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["architecture"] == "sdxl"

    @pytest.mark.asyncio
    async def test_list_models_filter_active(self, client: AsyncClient):
        await client.post("/api/v1/models", json={"name": "active", "display_name": "Active", "architecture": "sdxl"})
        resp = await client.post("/api/v1/models", json={"name": "inactive", "display_name": "Inactive", "architecture": "sdxl"})
        model_id = resp.json()["id"]
        await client.patch(f"/api/v1/models/{model_id}", json={"is_active": False})

        response = await client.get("/api/v1/models?is_active=true")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "active"

    @pytest.mark.asyncio
    async def test_list_models_search(self, client: AsyncClient):
        await client.post("/api/v1/models", json={"name": "flux-dev", "display_name": "FLUX Dev", "architecture": "flux"})
        await client.post("/api/v1/models", json={"name": "flux-schnell", "display_name": "FLUX Schnell", "architecture": "flux"})
        await client.post("/api/v1/models", json={"name": "sdxl-base", "display_name": "SDXL Base", "architecture": "sdxl"})

        response = await client.get("/api/v1/models?search=flux")
        data = response.json()
        assert data["total"] == 2
        for item in data["items"]:
            assert "flux" in item["name"].lower()

    @pytest.mark.asyncio
    async def test_get_model(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        response = await client.get(f"/api/v1/models/{model_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == model_id
        assert data["name"] == "test"

    @pytest.mark.asyncio
    async def test_get_model_not_found(self, client: AsyncClient):
        response = await client.get(f"/api/v1/models/{uuid4()}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_model(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        response = await client.patch(f"/api/v1/models/{model_id}", json={"display_name": "Updated", "description": "New desc"})
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Updated"
        assert data["description"] == "New desc"
        assert data["name"] == "test"  # unchanged

    @pytest.mark.asyncio
    async def test_update_model_architecture(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        response = await client.patch(f"/api/v1/models/{model_id}", json={"architecture": "flux"})
        assert response.status_code == 200
        assert response.json()["architecture"] == "flux"

    @pytest.mark.asyncio
    async def test_update_model_not_found(self, client: AsyncClient):
        response = await client.patch(f"/api/v1/models/{uuid4()}", json={"display_name": "X"})
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_model(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        response = await client.delete(f"/api/v1/models/{model_id}")
        assert response.status_code == 204

        get_resp = await client.get(f"/api/v1/models/{model_id}")
        assert get_resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_model_not_found(self, client: AsyncClient):
        response = await client.delete(f"/api/v1/models/{uuid4()}")
        assert response.status_code == 404


class TestModelVersions:
    """Model version tests."""

    @pytest.mark.asyncio
    async def test_create_version(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        response = await client.post(
            f"/api/v1/models/{model_id}/versions",
            json={
                "version": "1.0.0",
                "file_path": "/models/test.safetensors",
                "file_size": 123456789,
                "hash_sha256": "a" * 64,
                "changelog": "Initial release",
                "is_default": True,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["version"] == "1.0.0"
        assert data["is_default"] is True
        assert data["model_id"] == model_id

    @pytest.mark.asyncio
    async def test_list_versions(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        await client.post(f"/api/v1/models/{model_id}/versions", json={"version": "1.0.0", "file_path": "/a", "file_size": 1, "hash_sha256": "a" * 64})
        await client.post(f"/api/v1/models/{model_id}/versions", json={"version": "2.0.0", "file_path": "/b", "file_size": 2, "hash_sha256": "b" * 64})

        response = await client.get(f"/api/v1/models/{model_id}/versions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["version"] == "2.0.0"  # newest first

    @pytest.mark.asyncio
    async def test_version_default_exclusivity(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        await client.post(f"/api/v1/models/{model_id}/versions", json={"version": "1.0.0", "file_path": "/a", "file_size": 1, "hash_sha256": "a" * 64, "is_default": True})
        await client.post(f"/api/v1/models/{model_id}/versions", json={"version": "2.0.0", "file_path": "/b", "file_size": 2, "hash_sha256": "b" * 64, "is_default": True})

        response = await client.get(f"/api/v1/models/{model_id}/versions")
        data = response.json()
        defaults = [v for v in data if v["is_default"]]
        assert len(defaults) == 1
        assert defaults[0]["version"] == "2.0.0"

    @pytest.mark.asyncio
    async def test_create_version_model_not_found(self, client: AsyncClient):
        response = await client.post(
            f"/api/v1/models/{uuid4()}/versions",
            json={"version": "1.0.0", "file_path": "/a", "file_size": 1, "hash_sha256": "a" * 64},
        )
        assert response.status_code == 404


class TestValidation:
    """Input validation tests."""

    @pytest.mark.asyncio
    async def test_create_model_invalid_name(self, client: AsyncClient):
        response = await client.post("/api/v1/models", json={"name": "invalid name!", "display_name": "Test", "architecture": "sdxl"})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_model_missing_required(self, client: AsyncClient):
        response = await client.post("/api/v1/models", json={"display_name": "Test"})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_version_invalid_hash(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/models", json={"name": "test", "display_name": "Test", "architecture": "sdxl"})
        model_id = create_resp.json()["id"]

        response = await client.post(
            f"/api/v1/models/{model_id}/versions",
            json={"version": "1.0.0", "file_path": "/a", "file_size": 1, "hash_sha256": "invalid"},
        )
        assert response.status_code == 422