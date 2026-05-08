@echo off
echo ==========================================
echo    Watermark Project - Auto Start
echo ==========================================

:: 1. Backend check
echo [1/4] Checking Python environment...
cd watermark-backend
if not exist .venv (
    echo Creating .venv...
    python -m venv .venv
)
echo Updating Python packages...
call .venv\Scripts\activate
pip install -r requirements.txt
cd ..

:: 2. Frontend check
echo [2/4] Checking Node.js environment...
cd watermark-frontend
if not exist node_modules (
    echo Installing npm packages...
    call npm install
) else (
    echo Node_modules exist, skipping full install...
)
cd ..

:: 3. Start Backend
echo [3/4] Starting Backend Server...
start "Backend" cmd /k "cd watermark-backend && .venv\Scripts\activate && uvicorn app.main:app --reload"

:: 4. Start Frontend
echo [4/4] Starting Frontend Server...
start "Frontend" cmd /k "cd watermark-frontend && npm run dev"

echo ==========================================
echo    ALL DONE! Please check the two new windows.
echo ==========================================
pause