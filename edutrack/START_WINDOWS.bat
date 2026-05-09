@echo off
echo.
echo  =====================================
echo   EduTrack School Attendance System
echo  =====================================
echo.

cd /d "%~dp0backend"

IF NOT EXIST "node_modules" (
  echo [1/2] Installing packages (first time only)...
  npm install
  echo.
)

IF NOT EXIST "db\edutrack.db" (
  echo [2/2] Setting up database with sample data...
  npm run seed
  echo.
)

echo  Starting EduTrack server...
echo  Open your browser at: http://localhost:3000
echo.
echo  Login: principal / admin123
echo.
echo  Press Ctrl+C to stop the server.
echo.

npm start
pause
