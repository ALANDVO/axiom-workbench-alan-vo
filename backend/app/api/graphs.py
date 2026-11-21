"""Graph/nodes workflow editor API endpoints."""
from typing import Any, Optional, List
import uuid
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import GraphNode, GraphEdge, GraphWorkflow
from app.core.database import get_session
from app.models.model import DiffusionModel


router = APIRouter(prefix="/api/v1/graphs", tags=["graphs"])


def _extract_node_model_ids(workflow: GraphWorkflow) -> list:
    """Extract model UUIDs from workflow node model_id fields."""
    ids = []
    for node in workflow.nodes:
        if node.model_id is not None:
            mid = node.model_id
            if isinstance(mid, str):
                try:
                    mid = uuid.UUID(mid)
                except ValueError:
                    pass
            ids.append(mid)
    return ids


async def _validate_model_ids_exist(model_ids: list, session: AsyncSession) -> list[str]:
    """Validate that model UUIDs exist in the database. Returns existing IDs string list."""
    if not model_ids:
        return []
    
    existing = []
    for mid in model_ids:
        # session.get returns the model or None
        result = await session.get(DiffusionModel, mid)
        if result is not None:
            existing.append(str(result.id))
    return existing


@router.post("", response_model=GraphWorkflow, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: GraphWorkflow = Body(...),
    session: AsyncSession = Depends(get_session),
) -> GraphWorkflow:
    """Create a new workflow graph."""
    # Validate that all referenced models exist
    node_model_ids = _extract_node_model_ids(workflow_data)
    if node_model_ids:
        existing_ids = await _validate_model_ids_exist(node_model_ids, session)
        missing = [mid for mid in [str(m) for m in node_model_ids] if mid not in existing_ids]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Models not found: {missing}",
            )
    
    # Ensure unique ID
    workflow_id = str(uuid.uuid4())
    
    # Serialize workflow to dict and return with ID
    workflow_dict = workflow_data.model_dump()
    workflow_dict["id"] = workflow_id
    return GraphWorkflow(**workflow_dict)


@router.get("", response_model=list[GraphWorkflow])
async def list_workflows(
    session: AsyncSession = Depends(get_session),
) -> list[GraphWorkflow]:
    """List all workflows."""
    # Placeholder - in full impl would query workflow table
    return []


@router.get("/{workflow_id}", response_model=GraphWorkflow)
async def get_workflow(
    workflow_id: str,
    session: AsyncSession = Depends(get_session),
) -> GraphWorkflow:
    """Get a specific workflow by ID."""
    # Placeholder - would query DB
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Workflow not found",
    )


@router.patch("/{workflow_id}", response_model=GraphWorkflow)
async def update_workflow(
    workflow_id: str,
    workflow_data: GraphWorkflow = Body(...),
    session: AsyncSession = Depends(get_session),
) -> GraphWorkflow:
    """Update a workflow graph."""
    # Validate node references
    node_model_ids = _extract_node_model_ids(workflow_data)
    if node_model_ids:
        existing_ids = await _validate_model_ids_exist(node_model_ids, session)
        missing = [mid for mid in [str(m) for m in node_model_ids] if mid not in existing_ids]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Models not found: {missing}",
            )
    
    return workflow_data


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a workflow graph."""
    pass
