# ORI Project - 前後端整合

## 專案結構
- `watermark-frontend/` : 前端程式碼 (React, Tailwind CSS, Vite)
- `watermark-backend/` : 後端程式碼 (FastAPI, Alembic, SQLite)

---
## 如何執行

在終端機輸入 
```
.\run_project.bat
```
## 開發注意事項

1. **API 連線設定**：
* 前端若要呼叫後端 API，請確認 `src/api.js` 或相關設定檔中的 `baseURL` 是否指向正確的後端位址。


2. **資料庫遷移 (Alembic)**：
* 若有修改資料庫 Model，請執行：
```bash
alembic revision --autogenerate -m "描述變更"
alembic upgrade head
```