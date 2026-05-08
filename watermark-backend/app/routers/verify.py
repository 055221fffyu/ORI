import base64
import os
import aiofiles
import json

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models import EmbedTask, Image, User, VerifyLog
from app.schemas import VerifyLogRead, VerifyRequest
from app.services import storage, watermark_api

router = APIRouter(prefix="/verify", tags=["verify"])


""" 
async def _get_image_bytes(
    body: VerifyRequest,
    current_user: User,
    db: AsyncSession,
) -> tuple[bytes, str | None]:
"""
"""
    Resolve image bytes from DB image_id or external URL.
""" 
"""
    if body.image_id:
        img_result = await db.execute(
            select(Image).where(Image.id == body.image_id, Image.user_id == current_user.id)
        )
        image = img_result.scalar_one_or_none()
        if image is None:
            raise HTTPException(status_code=404, detail="Image not found")
        url = image.blob_url
    elif body.image_url:
        url = body.image_url
    else:
        raise HTTPException(status_code=422, detail="Provide either image_id or image_url")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    return resp.content, url
"""

async def _get_image_bytes(
    body: VerifyRequest,
    current_user: User,
    db: AsyncSession,
    manual_id: str = None,
    manual_url: str = None
) -> tuple[bytes, str | None]:
    """優先讀取嵌入後的結果圖，若無則讀取原始圖。"""
    
    # 優先順序：手動傳入的 URL (結果圖) > 請求中的 URL > 手動傳入的 ID > 請求中的 ID
    target_url = manual_url or body.image_url
    target_id = manual_id or body.image_id

    # 如果有 URL (通常是自動匹配到的 task.result_image_url)
    if target_url:
        print(f">>> 正在讀取圖片 URL: {target_url}")
        # 如果是本地開發環境的 URL，直接轉為實體路徑讀取最穩
        if "http://127.0.0.1" in target_url or "localhost" in target_url:
            from urllib.parse import urlparse
            path = urlparse(target_url).path.lstrip('/')
            if os.path.exists(path):
                async with aiofiles.open(path, mode='rb') as f:
                    return await f.read(), target_url

        # 否則使用 HTTP 請求抓取
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(target_url)
            resp.raise_for_status()
            return resp.content, target_url

    # 如果只有 ID (通常是原圖)
    elif target_id:
        img_result = await db.execute(
            select(Image).where(Image.id == target_id, Image.user_id == current_user.id)
        )
        image = img_result.scalar_one_or_none()
        if image is None:
            raise HTTPException(status_code=404, detail="找不到該圖片紀錄")

        file_path = os.path.join("static", image.blob_pathname)
        async with aiofiles.open(file_path, mode='rb') as f:
            content = await f.read()
        return content, image.blob_url
    
    else:
        raise HTTPException(status_code=422, detail="必須提供 image_id 或 image_url")
    
async def _get_task_result_bytes(task: EmbedTask) -> tuple[bytes, str]:
    """專門讀取嵌入任務產出的結果圖 (通常在 static/tasks/...)"""
    # 從 URL 解析出路徑，例如 http://.../static/tasks/xxx/final.png -> static/tasks/xxx/final.png
    from urllib.parse import urlparse
    parsed_url = urlparse(task.result_image_url)
    # 去掉開頭的斜線
    file_path = parsed_url.path.lstrip('/') 
    
    if not os.path.exists(file_path):
        print(f"找不到結果圖檔案: {file_path}")
        raise HTTPException(status_code=404, detail="找不到加過水印的結果圖，請確認檔案是否存在")

    async with aiofiles.open(file_path, mode='rb') as f:
        content = await f.read()
    return content, task.result_image_url

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form

@router.post("/", response_model=VerifyLogRead, status_code=status.HTTP_201_CREATED)
async def run_verify(
    metadata_json: str = Form(...),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import json, base64, traceback, uuid
    from sqlalchemy import select

    try:
        # 1. 圖片讀取 (保持原樣)
        if file:
            image_bytes = await file.read()
            final_url = f"file://{file.filename}"
        else:
            meta_obj = json.loads(metadata_json)
            target_sha = meta_obj.get("final_image_sha256", "").strip()
            task_result = await db.execute(select(EmbedTask).where(EmbedTask.metadata_json.contains(target_sha)).order_by(EmbedTask.created_at.desc()))
            task = task_result.scalars().first()
            if not task: raise HTTPException(status_code=404, detail="找不到匹配圖片")
            image_bytes, final_url = await _get_task_result_bytes(task)

        # 2. 呼叫 AI 驗證
        verify_result = await watermark_api.verify(image_bytes=image_bytes, metadata_json=metadata_json)
        summary = verify_result.get("summary", {})
        
        # --- 關鍵修正：讓 overall_pass 更有彈性 ---
        # 只要準確度 > 70% 且金鑰匹配，就算身分符合
        accuracy_str = verify_result.get("editguard_accuracy", "0")
        acc_val = float(accuracy_str.replace('%', ''))
        is_owner = summary.get("copyright_match", False)
        
        # 重新定義整體的通過狀態
        final_pass = bool(acc_val > 70.0 and is_owner)

        # 3. 處理 Mask：不論成敗，只要有數據就產出 URL
        mask_url = None
        mask_base64 = verify_result.get("editguard_mask_base64")
        if mask_base64:
            mask_data = base64.b64decode(mask_base64)
            blob = await storage.upload_image(
                data=mask_data,
                filename=f"v_mask_{uuid.uuid4().hex[:6]}.png",
                content_type="image/png",
                folder=f"verify/{current_user.id}"
            )
            mask_url = blob["url"]

        # 4. 存入 Log
        log = VerifyLog(
            user_id=current_user.id,
            embed_task_id=task.id if 'task' in locals() and task else None,
            image_url=final_url,
            stegastamp_found_codes=json.dumps(verify_result.get("stegastamp_found_codes", [])),
            editguard_recovered_bits=verify_result.get("editguard_recovered_bits"),
            editguard_accuracy=accuracy_str,
            mask_url=mask_url, 
            summary=json.dumps(summary),
            overall_pass=final_pass, # 使用我們重新定義的狀態
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
                    
@router.get("/", response_model=list[VerifyLogRead])
async def list_verify_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VerifyLog)
        .where(VerifyLog.user_id == current_user.id)
        .order_by(VerifyLog.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{log_id}", response_model=VerifyLogRead)
async def get_verify_log(
    log_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VerifyLog).where(VerifyLog.id == log_id, VerifyLog.user_id == current_user.id)
    )
    log = result.scalar_one_or_none()
    if log is None:
        raise HTTPException(status_code=404, detail="Verify log not found")
    return log
