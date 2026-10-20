"""API schemas for model registry."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from enum import Enum

from app.models.model import ModelArchitecture, ModelFormat


class ModelArchitectureSchema(str, Enum):
    SDXL = "sdxl"
    FLUX = "flux"
    SD15 = "sd15"
    SD3 = "sd3"
    HUNYUAN = "hunyuan"
    LTX = "ltx"
    WAN = "wan"
    OTHER = "other"


class ModelFormatSchema(str, Enum):
    SAFETENSORS = "safetensors"
    CKPT = "ckpt"
    PT = "pt"
    BIN = "bin"
    GGUF = "gguf"


class ModelBase(BaseModel):
    """Base model schema."""
    name: str = Field(..., min_length=1, max_length=255, pattern=r"^[a-zA-Z0-9_-]+$")
    display_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    architecture: ModelArchitectureSchema = ModelArchitectureSchema.OTHER
    format: ModelFormatSchema = ModelFormatSchema.SAFETENSORS


class ModelCreate(ModelBase):
    """Schema for creating a model."""
    file_path: Optional[str] = None
    file_size: Optional[int] = Field(None, ge=0)
    hash_sha256: Optional[str] = Field(None, pattern=r"^[a-fA-F0-9]{64}$")
    config_json: Optional[str] = None


class ModelUpdate(BaseModel):
    """Schema for updating a model."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    architecture: Optional[ModelArchitectureSchema] = None
    format: Optional[ModelFormatSchema] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = Field(None, ge=0)
    hash_sha256: Optional[str] = Field(None, pattern=r"^[a-fA-F0-9]{64}$")
    config_json: Optional[str] = None
    is_active: Optional[bool] = None


class ModelResponse(ModelBase):
    """Schema for model response."""
    id: UUID
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    hash_sha256: Optional[str] = None
    config_json: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ModelListResponse(BaseModel):
    """Paginated model list response."""
    items: list[ModelResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ModelVersionBase(BaseModel):
    """Base model version schema."""
    version: str = Field(..., min_length=1, max_length=100)
    file_path: str = Field(..., min_length=1, max_length=1024)
    file_size: int = Field(..., ge=0)
    hash_sha256: str = Field(..., pattern=r"^[a-fA-F0-9]{64}$")
    changelog: Optional[str] = None
    is_default: bool = False


class ModelVersionCreate(ModelVersionBase):
    """Schema for creating a model version."""
    pass


class ModelVersionResponse(ModelVersionBase):
    """Schema for model version response."""
    id: UUID
    model_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    environment: str