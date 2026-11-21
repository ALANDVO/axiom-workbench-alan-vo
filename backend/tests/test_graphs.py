"""Backend tests for graph/workflow editor."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestGraphRoutes:
    """Graph/workflow editor API tests."""

    def test_create_workflow(self):
        """Test creating a new workflow graph."""
        response = client.post(
            "/api/v1/graphs/",
            json={
                "name": "Test Workflow",
                "nodes": [
                    {
                        "id": "node1",
                        "type": "model",
                        "position": {"x": 100, "y": 100},
                        "data": {},
                    }
                ],
                "edges": [],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Workflow"
        assert len(data["nodes"]) == 1
        assert data["nodes"][0]["type"] == "model"

    def test_list_workflows(self):
        """Test listing workflows."""
        response = client.get("/api/v1/graphs/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_workflow_not_found(self):
        """Test getting a non-existent workflow."""
        response = client.get("/api/v1/graphs/nonexistent")
        assert response.status_code == 404

    def test_update_workflow(self):
        """Test updating a workflow."""
        # First create
        create_resp = client.post(
            "/api/v1/graphs/",
            json={
                "name": "Updatable",
                "nodes": [],
                "edges": [],
            },
        )
        workflow_id = create_resp.json()["id"]

        # Then update
        response = client.patch(
            f"/api/v1/graphs/{workflow_id}",
            json={
                "name": "Updated",
                "nodes": [
                    {
                        "id": "node1",
                        "type": "model",
                        "position": {"x": 200, "y": 200},
                        "data": {},
                    }
                ],
                "edges": [],
            },
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated"

    def test_workflow_with_model_references(self):
        """Test workflow validation with model references."""
        from app.tests.test_models import TEST_DATABASE_URL, test_engine, Base, override_get_session
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy import inspect
        
        # This tests that workflow nodes reference existing models
        response = client.post(
            "/api/v1/graphs/",
            json={
                "name": "Invalid Model Ref",
                "nodes": [
                    {
                        "id": "nonexistent-model-id",
                        "type": "model",
                        "position": {"x": 100, "y": 100},
                        "data": {},
                        "model_id": "nonexistent-uuid",
                    }
                ],
                "edges": [],
            },
        )
        # Should fail validation since the model doesn't exist
        assert response.status_code == 400
