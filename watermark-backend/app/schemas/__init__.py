from datetime import datetime
from typing import Any
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


# ─────────────────────────────────────────────
# Auth / User
# ─────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: str
    username: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


# ─────────────────────────────────────────────
# Image
# ─────────────────────────────────────────────
class ImageRead(BaseModel):
    id: str
    original_filename: str
    blob_url: str
    file_size: int | None
    mime_type: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# EmbedTask
# ─────────────────────────────────────────────
class EmbedTaskCreate(BaseModel):
    image_id: str
    editguard_bits: str
    stegastamp_secret: str

    @field_validator("editguard_bits")
    @classmethod
    def validate_bits(cls, v: str) -> str:
        if len(v) != 64 or not all(c in "01" for c in v):
            raise ValueError("editguard_bits must be a 64-character binary string")
        return v

    @field_validator("stegastamp_secret")
    @classmethod
    def validate_secret(cls, v: str) -> str:
        if len(v.encode()) > 7:
            raise ValueError("stegastamp_secret must be <= 7 UTF-8 bytes")
        return v


class EmbedTaskRead(BaseModel):
    id: str
    status: str
    editguard_bits: str
    stegastamp_secret: str
    metadata_json: str | None
    result_image_url: str | None
    stegastamp_image_url: str | None
    residual_image_url: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# VerifyLog
# ─────────────────────────────────────────────
class VerifyRequest(BaseModel):
    metadata_json: str
    image_id: Optional[str] = None   
    image_url: Optional[str] = None  
    embed_task_id: Optional[str] = None

class VerifyLogRead(BaseModel):
    id: str
    # 修正點：確保這些欄位都允許 | None，否則回傳時會噴 422
    embed_task_id: str | None = None  
    model_config = {"extra": "allow"}
    image_url: str | None = None
    stegastamp_found_codes: Any = None
    editguard_recovered_bits: str | None = None
    editguard_accuracy: str | None = None
    mask_url: str | None = None
    summary: Any = None
    overall_pass: bool | None = None
    created_at: datetime

    model_config = {"from_attributes": True}