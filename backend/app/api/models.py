"""Model registry API endpoints."""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.model import DiffusionModel, ModelVersion, ModelArchitecture, ModelFormat
from app.api.schemas import (
    ModelCreate,
    ModelUpdate,
    ModelResponse,
    ModelListResponse,
    ModelVersionCreate,
    ModelVersionResponse,
    ModelArchitectureSchema,
    ModelFormatSchema,
)

router = APIRouter(prefix="/api/v1/models", tags=["models"])


def _to_arch(arch: ModelArchitectureSchema) -> ModelArchitecture:
    return ModelArchitecture(arch.value)


def _to_format(fmt: ModelFormatSchema) -> ModelFormat:
    return ModelFormat(fmt.value)


def _to_schema_arch(arch: ModelArchitecture) -> ModelArchitectureSchema:
    return ModelArchitectureSchema(arch.value)


def _to_schema_format(fmt: ModelFormat) -> ModelFormatSchema:
    return ModelFormatSchema(fmt.value)


def model_to_response(model: DiffusionModel) -> ModelResponse:
    """Convert ORM model to response schema."""
    return ModelResponse(
        id=model.id,
        name=model.name,
        display_name=model.display_name,
        description=model.description,
        architecture=_to_schema_arch(model.architecture),
        format=_to_schema_format(model.format),
        file_path=model.file_path,
        file_size=model.file_size,
        hash_sha256=model.hash_sha256,
        config_json=model.config_json,
        is_active=model.is_active,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


@router.post("", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def create_model(
    model_data: ModelCreate,
    session: AsyncSession = Depends(get_session),
) -> ModelResponse:
    """Register a new diffusion model."""
    # Check for duplicate name + architecture
    existing = await session.execute(
        select(DiffusionModel).where(
            DiffusionModel.name == model_data.name,
            DiffusionModel.architecture == _to_arch(model_data.architecture),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Model '{model_data.name}' with architecture '{model_data.architecture}' already exists",
        )

    model = DiffusionModel(
        name=model_data.name,
        display_name=model_data.display_name,
        description=model_data.description,
        architecture=_to_arch(model_data.architecture),
        format=_to_format(model_data.format),
        file_path=model_data.file_path,
        file_size=model_data.file_size,
        hash_sha256=model_data.hash_sha256,
        config_json=model_data.config_json,
    )
    session.add(model)
    await session.flush()
    await session.refresh(model)
    return model_to_response(model)


@router.get("", response_model=ModelListResponse)
async def list_models(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    architecture: Optional[ModelArchitectureSchema] = Query(None, description="Filter by architecture"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name/display_name"),
    session: AsyncSession = Depends(get_session),
) -> ModelListResponse:
    """List diffusion models with pagination and filtering."""
    query = select(DiffusionModel)

    if architecture:
        query = query.where(DiffusionModel.architecture == _to_arch(architecture))
    if is_active is not None:
        query = query.where(DiffusionModel.is_active == is_active)
    if search:
        query = query.where(
            or_(
                DiffusionModel.name.ilike(f"%{search}%"),
                DiffusionModel.display_name.ilike(f"%{search}%"),
            )
        )

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.scalar(count_query) or 0

    # Pagination
    query = query.order_by(DiffusionModel.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await session.execute(query)
    models = result.scalars().all()

    return ModelListResponse(
        items=[model_to_response(m) for m in models],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ModelResponse:
    """Get a model by ID."""
    model = await session.get(DiffusionModel, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model_to_response(model)


@router.patch("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: UUID,
    model_data: ModelUpdate,
    session: AsyncSession = Depends(get_session),
) -> ModelResponse:
    """Update a model."""
    model = await session.get(DiffusionModel, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    update_data = model_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "architecture" and value is not None:
            setattr(model, field, _to_arch(value))
        elif field == "format" and value is not None:
            setattr(model, field, _to_format(value))
        else:
            setattr(model, field, value)

    await session.flush()
    await session.refresh(model)
    return model_to_response(model)


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    model_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a model."""
    model = await session.get(DiffusionModel, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    await session.delete(model)


# Model Versions
@router.post("/{model_id}/versions", response_model=ModelVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_model_version(
    model_id: UUID,
    version_data: ModelVersionCreate,
    session: AsyncSession = Depends(get_session),
) -> ModelVersionResponse:
    """Add a version to a model."""
    model = await session.get(DiffusionModel, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # If this is default, unset other defaults
    if version_data.is_default:
        await session.execute(
            select(ModelVersion).where(ModelVersion.model_id == model_id, ModelVersion.is_default == True)
        )
        for v in (await session.execute(
            select(ModelVersion).where(ModelVersion.model_id == model_id, ModelVersion.is_default == True)
        )).scalars():
            v.is_default = False

    version = ModelVersion(
        model_id=model_id,
        version=version_data.version,
        file_path=version_data.file_path,
        file_size=version_data.file_size,
        hash_sha256=version_data.hash_sha256,
        changelog=version_data.changelog,
        is_default=version_data.is_default,
    )
    session.add(version)
    await session.flush()
    await session.refresh(version)

    return ModelVersionResponse(
        id=version.id,
        model_id=version.model_id,
        version=version.version,
        file_path=version.file_path,
        file_size=version.file_size,
        hash_sha256=version.hash_sha256,
        changelog=version.changelog,
        is_default=version.is_default,
        created_at=version.created_at,
    )


@router.get("/{model_id}/versions", response_model=list[ModelVersionResponse])
async def list_model_versions(
    model_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> list[ModelVersionResponse]:
    """List versions for a model."""
    model = await session.get(DiffusionModel, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    result = await session.execute(
        select(ModelVersion).where(ModelVersion.model_id == model_id).order_by(ModelVersion.created_at.desc())
    )
    versions = result.scalars().all()

    return [
        ModelVersionResponse(
            id=v.id,
            model_id=v.model_id,
            version=v.version,
            file_path=v.file_path,
            file_size=v.file_size,
            hash_sha256=v.hash_sha256,
            changelog=v.changelog,
            is_default=v.is_default,
            created_at=v.created_at,
        )
        for v in versions
    ]