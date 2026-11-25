"""API schemas for model registry."""
from datetime import datetime
import uuid
from typing import Optional, List, Any, Union
from enum import Enum as PyEnum
from pydantic import BaseModel, Field, ConfigDict


class ModelArchitecture(PyEnum):
    """Supported diffusion model architectures."""
    SDXL = "sdxl"
    FLUX = "flux"
    SD15 = "sd15"
    SD3 = "sd3"
    HUNYUAN = "hunyuan"
    LTX = "ltx"
    WAN = "wan"
    OTHER = "other"


class ModelFormat(PyEnum):
    """Model file formats."""
    SAFETENSORS = "safetensors"
    CKPT = "ckpt"
    PT = "pt"
    BIN = "bin"
    GGUF = "gguf"


class ModelArchitectureSchema(str, PyEnum):
    SDXL = "sdxl"
    FLUX = "flux"
    SD15 = "sd15"
    SD3 = "sd3"
    HUNYUAN = "hunyuan"
    LTX = "ltx"
    WAN = "wan"
    OTHER = "other"


class ModelFormatSchema(str, PyEnum):
    SAFETENSORS = "safetensors"
    CKPT = "ckpt"
    PT = "pt"
    BIN = "bin"
    GGUF = "gguf"


class ModelBase(BaseModel):
    """Base model schema."""
    name: str
    display_name: str
    description: Optional[str] = None
    architecture: ModelArchitectureSchema
    format: ModelFormatSchema = ModelFormatSchema.SAFETENSORS


class ModelCreate(ModelBase):
    """Schema for creating a model."""
    config_json: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    hash_sha256: Optional[str] = None


class ModelUpdate(BaseModel):
    """Schema for updating a model."""
    is_active: Optional[bool] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    architecture: Optional[ModelArchitectureSchema] = None
    format: Optional[ModelFormatSchema] = None


class ModelResponse(BaseModel):
    """Schema for model response."""
    id: uuid.UUID
    name: str
    display_name: str
    description: Optional[str] = None
    architecture: ModelArchitectureSchema
    format: ModelFormatSchema = ModelFormatSchema.SAFETENSORS
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    hash_sha256: Optional[str] = None
    config_json: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class ModelListResponse(BaseModel):
    """Paginated model list response."""
    items: List[ModelResponse] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0


class ModelVersionBase(BaseModel):
    """Base model version schema."""
    is_default: bool = False


class ModelVersionCreate(ModelVersionBase):
    """Schema for creating a model version."""
    version: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    hash_sha256: Optional[str] = None
    changelog: Optional[str] = None


class ModelVersionResponse(BaseModel):
    """Schema for model version response."""
    id: uuid.UUID
    model_id: uuid.UUID
    version: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    hash_sha256: Optional[str] = None
    changelog: Optional[str] = None
    is_default: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    environment: str


"""Graph workflow schemas."""

from enum import Enum
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class GraphNodeType(str, Enum):
    """Types of graph nodes for workflow editing."""
    MODEL = "model"
    SAMPLER = "sampler"
    SCHEDULER = "scheduler"
    SAVER = "saver"
    UTILITY = "utility"


class GraphEdgeType(str, Enum):
    """Types of edges connecting graph nodes."""
    NEXT = "next"
    CONDITIONAL = "conditional"
    DATA = "data"


class GraphNode(BaseModel):
    """A node in the workflow graph."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique node identifier")
    type: GraphNodeType = Field(description="Node type/Category")
    position: dict = Field(default_factory=dict, description="Canvas position {x, y}")
    data: dict = Field(default_factory=dict, description="Node-specific data/props")
    model_id: Optional[str] = Field(default=None, description="Associated diffusion model ID")


class GraphEdge(BaseModel):
    """An edge connecting two graph nodes."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique edge identifier")
    source: str = Field(description="Source node ID")
    target: str = Field(description="Target node ID")
    type: GraphEdgeType = Field(default=GraphEdgeType.NEXT, description="Edge relationship type")
    data: dict = Field(default_factory=dict, description="Edge-specific data")


class GraphWorkflow(BaseModel):
    """A complete workflow graph with nodes and edges."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Workflow unique identifier")
    name: str = Field(default="Untitled Workflow", description="Human-readable workflow name")
    description: Optional[str] = Field(default=None, description="Workflow description")
    nodes: List[GraphNode] = Field(default_factory=list, description="Graph nodes")
    edges: List[GraphEdge] = Field(default_factory=list, description="Graph edges")
    node_ids: List[str] = Field(default_factory=list, description="Referenced model IDs")
    created_at: Any = Field(default_factory=lambda: __import__("datetime").datetime.utcnow(), description="Creation timestamp")
    updated_at: Any = Field(default_factory=lambda: __import__("datetime").datetime.utcnow(), description="Last update timestamp")


class GraphNodeCreate(BaseModel):
    """Schema for creating a graph node."""
    type: GraphNodeType
    position: Optional[dict] = Field(default=None, description="Canvas position {x, y}")
    data: Optional[dict] = Field(default=None, description="Node-specific data/props")
    model_id: Optional[str] = Field(default=None, description="Associated diffusion model ID")


class GraphEdgeCreate(BaseModel):
    """Schema for creating a graph edge."""
    source: str = Field(description="Source node ID")
    target: str = Field(description="Target node ID")
    type: GraphEdgeType = Field(default=GraphEdgeType.NEXT, description="Edge relationship type")
    data: Optional[dict] = Field(default=None, description="Edge-specific data")
