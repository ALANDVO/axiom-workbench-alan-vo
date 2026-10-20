"""Model registry database models."""
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import (
    String,
    Text,
    DateTime,
    Enum,
    Index,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ModelArchitecture(str, PyEnum):
    """Supported diffusion model architectures."""
    SDXL = "sdxl"
    FLUX = "flux"
    SD15 = "sd15"
    SD3 = "sd3"
    HUNYUAN = "hunyuan"
    LTX = "ltx"
    WAN = "wan"
    OTHER = "other"


class ModelFormat(str, PyEnum):
    """Model file formats."""
    SAFETENSORS = "safetensors"
    CKPT = "ckpt"
    PT = "pt"
    BIN = "bin"
    GGUF = "gguf"


class DiffusionModel(Base):
    """Diffusion model registry entry."""
    __tablename__ = "diffusion_models"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture: Mapped[ModelArchitecture] = mapped_column(
        Enum(ModelArchitecture), nullable=False, default=ModelArchitecture.OTHER
    )
    format: Mapped[ModelFormat] = mapped_column(
        Enum(ModelFormat), nullable=False, default=ModelFormat.SAFETENSORS
    )
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    file_size: Mapped[int | None] = mapped_column(nullable=True)
    hash_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_diffusion_models_arch_active", "architecture", "is_active"),
        UniqueConstraint("name", "architecture", name="uq_model_name_arch"),
    )

    def __repr__(self) -> str:
        return f"<DiffusionModel(id={self.id}, name={self.name}, arch={self.architecture})>"


class ModelVersion(Base):
    """Model version tracking for checkpoints/LoRAs."""
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    model_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("diffusion_models.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[str] = mapped_column(String(100), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size: Mapped[int] = mapped_column(nullable=False)
    hash_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    changelog: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    model: Mapped["DiffusionModel"] = relationship(back_populates="versions")

    __table_args__ = (
        UniqueConstraint("model_id", "version", name="uq_model_version"),
    )


# Add back-reference
DiffusionModel.versions = relationship(
    "ModelVersion",
    back_populates="model",
    cascade="all, delete-orphan",
    lazy="selectin",
)