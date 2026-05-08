# ORI Project - 前後端整合

## 專案結構
- `watermark-frontend/` : 前端程式碼 (React, Tailwind CSS, Vite)
- `watermark-backend/` : 後端程式碼 (FastAPI, Alembic, SQLite)

---

## 後端啟動步驟 (Python/FastAPI)

### 1. 建立虛擬環境
進入後端目錄並建立虛擬環境：
```bash
cd watermark-backend
python -m venv .venv
```

### 2. 啟動虛擬環境

* **Windows:**
```bash
.venv\Scripts\activate
```


* **macOS/Linux:**
```bash
source .venv/bin/activate
```



### 3. 安裝套件

```bash
pip install -r requirements.txt
```

### 4. 環境變數設定

請手動建立 `.env` 檔案（參考 `.env.example`），並填入必要的 Secret Key 或資料庫連線資訊。

### 5. 啟動後端伺服器

```bash
uvicorn app.main:app --reload
```

預設 API 文件地址：[http://127.0.0.1:8000/docs](https://www.google.com/search?q=http://127.0.0.1:8000/docs)

---

## 前端啟動步驟 (React/Vite)

### 1. 進入目錄並安裝套件

```bash
cd watermark-frontend
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

啟動後請訪問終端機顯示的網址（通常是 [http://localhost:5173]()）。

---

## 開發注意事項

1. **API 連線設定**：
* 前端若要呼叫後端 API，請確認 `src/api.js` 或相關設定檔中的 `baseURL` 是否指向正確的後端位址。


2. **資料庫遷移 (Alembic)**：
* 若有修改資料庫 Model，請執行：
```bash
alembic revision --autogenerate -m "描述變更"
alembic upgrade head
```