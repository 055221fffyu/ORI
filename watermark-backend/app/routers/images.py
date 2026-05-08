import hashlib
import traceback
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models import Image, User
from app.schemas import ImageRead
from app.services.storage import upload_image

router = APIRouter(prefix="/images", tags=["images"])

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


@router.post("/upload", response_model=ImageRead, status_code=status.HTTP_201_CREATED)
async def upload(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # 1. 檢查檔案類型
        if file.content_type not in ALLOWED_MIME:
            raise HTTPException(status_code=415, detail="僅支援 JPEG, PNG, WEBP 格式")

        # 2. 讀取並檢查大小
        data = await file.read()
        if len(data) > MAX_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="檔案不能超過 20 MB")

        # 3. 產生雜湊值
        sha256 = hashlib.sha256(data).hexdigest()

        existing_img = await db.execute(
            select(Image).where(Image.sha256 == sha256, Image.user_id == current_user.id)
        )
        duplicate = existing_img.scalar_one_or_none()
        
        if duplicate:
            # 這裡就不會報 NameError 了
            raise HTTPException(
                status_code=409, 
                detail={
                    "message": "這張圖片已經上傳過了！",
                    "existing_id": duplicate.id
                }
            )
        
        safe_filename = file.filename if file.filename else f"{sha256[:10]}.png"
        
        blob_result = await upload_image(
            data=data,
            filename=safe_filename,
            content_type=file.content_type,
            folder="uploads", # 暫時用固定資料夾，避開 current_user.id 可能的空值問題
        )

        # 5. 寫入資料庫
        new_image = Image(
            user_id=current_user.id,
            original_filename=safe_filename,
            blob_url=blob_result["url"],
            blob_pathname=blob_result["pathname"],
            file_size=len(data),
            mime_type=file.content_type,
            sha256=sha256
        )
        
        db.add(new_image)
        await db.commit()
        await db.refresh(new_image)

        return new_image

    except Exception as e:
        # 這行超重要！它會把錯誤印在你的 Uvicorn 黑視窗裡
        print("=== 偵測到後端崩潰 ===")
        print(traceback.format_exc()) 
        # 回傳錯誤給前端
        raise HTTPException(
            status_code=500, 
            detail=f"內部伺服器錯誤: {str(e)}"
        )



@router.get("/", response_model=list[ImageRead])
async def list_images(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Image).where(Image.user_id == current_user.id).order_by(Image.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{image_id}", response_model=ImageRead)
async def get_image(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Image).where(Image.id == image_id, Image.user_id == current_user.id)
    )
    image = result.scalar_one_or_none()
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return image
