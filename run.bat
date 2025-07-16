@echo off
echo ========================================
echo  IMPERIAL STAR DESTROYER BRIDGE SIMULATOR
echo ========================================
echo.
echo Starting Bridge Simulator...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Please run this script from the project root directory
    echo Make sure you can see package.json in the current folder
    pause
    exit /b 1
)

REM Clean up any existing containers from old directory paths
echo [1/7] Cleaning up existing containers...
docker-compose down 2>nul
docker system prune -f --volumes 2>nul

REM Check if Docker is running and start database services
echo [2/7] Starting database services...
docker-compose up postgres redis -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start database services. Make sure Docker is running.
    echo You can install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Skip additional docker images - not needed for basic setup
echo [3/7] Skipping additional docker services (not required)...

REM Wait for databases to initialize
echo [4/7] Waiting for databases to initialize...
timeout /t 8 /nobreak >nul

REM Install dependencies if needed
echo [5/7] Checking dependencies...
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
)

if not exist "client\node_modules" (
    echo Installing frontend dependencies...
    cd client
    npm install
    cd ..
)

REM Start the backend server in a new window
echo [6/7] Starting backend server...
start "Bridge Simulator - Backend Server" cmd /k "echo Starting backend server... && npm run server:dev"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start the frontend client in a new window
echo [7/7] Starting frontend client...
start "Bridge Simulator - Frontend Client" cmd /k "echo Starting React frontend... && cd client && npm start"

REM Wait a bit for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  BRIDGE SIMULATOR STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend Server: http://localhost:5000
echo Frontend Client: http://localhost:3000 (or next available port)
echo Test Client: http://localhost:5000/test-client.html
echo.
echo Two new command windows have opened:
echo - Backend Server (Node.js/TypeScript with Socket.IO)
echo - Frontend Client (React with Communications Station)
echo.
echo IMPORTANT: Wait for both servers to fully start before connecting!
echo Look for these messages:
echo - Backend: "WebSocket ready for connections"
echo - Frontend: "webpack compiled successfully"
echo.
echo To stop the simulator:
echo 1. Close both command windows (Ctrl+C in each)
echo 2. Run: docker-compose down
echo.
echo Press any key to open the frontend in your browser...
pause >nul

REM Try different ports in case 3000 is taken
echo Opening browser...
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:3001

echo.
echo ========================================
echo If the browser doesn't open automatically:
echo 1. Go to http://localhost:3000 or http://localhost:3001
echo 2. Select "COMMUNICATIONS" station
echo 3. Enter your name and session ID
echo 4. Click "JOIN AS COMMUNICATIONS"
echo ========================================
echo.
echo Bridge Simulator is now running!
echo Keep this window open. Close it when you're done playing.
pause