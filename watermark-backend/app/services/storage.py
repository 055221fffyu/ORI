"""
Vercel Blob REST API wrapper.
Docs: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#upload-a-blob
"""
import os
import mimetypes
import uuid
import aiofiles

import httpx

from app.config import settings

BLOB_API_VERSION = "7"
BLOB_BASE_URL = "https://blob.vercel-storage.com"


def _auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
        "x-api-version": BLOB_API_VERSION,
    }

""" 
async def upload_image(
    data: bytes,
    filename: str,
    content_type: str | None = None,
    folder: str = "images",
) -> dict:
    if content_type is None:
        content_type = mimetypes.guess_type(filename)[0] or "image/png"

    # Build a unique pathname to avoid collisions
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "png"
    unique_name = f"{folder}/{uuid.uuid4().hex}.{ext}"

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.put(
            f"{BLOB_BASE_URL}/{unique_name}",
            content=data,
            headers={
                **_auth_headers(),
                "Content-Type": content_type,
                "x-content-type": content_type,
            },
        )
        resp.raise_for_status()
        return resp.json()

 """

STATIC_DIR = "static"
UPLOAD_DIR = os.path.join(STATIC_DIR, "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

async def upload_image(data: bytes, filename: str, content_type: str, folder: str = "uploads"):
    # 1. 準備資料夾
    target_dir = os.path.join(STATIC_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    # 2. 生成唯一檔名
    ext = filename.split(".")[-1] if "." in filename else "png"
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(target_dir, unique_name)
    
    # 3. 非同步寫入本地硬碟
    async with aiofiles.open(file_path, mode="wb") as f:
        await f.write(data)
    
    # 4. 回傳本地 URL (讓前端能看到圖)
    return {
        #"url": f"http://127.0.0.1:8000/static/{folder}/{unique_name}",
        "url": f"/static/{folder}/{unique_name}",
        "pathname": f"{folder}/{unique_name}"
    }

async def delete_blob(url: str) -> None:
    """Delete a blob by its public URL."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.delete(
            f"{BLOB_BASE_URL}/delete",
            json={"urls": [url]},
            headers=_auth_headers(),
        )
        resp.raise_for_status()
