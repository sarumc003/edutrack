#!/bin/bash
echo ""
echo " ====================================="
echo "  EduTrack School Attendance System"
echo " ====================================="
echo ""

cd "$(dirname "$0")/backend"

if [ ! -d "node_modules" ]; then
  echo "[1/2] Installing packages (first time only)..."
  npm install
  echo ""
fi

if [ ! -f "db/edutrack.db" ]; then
  echo "[2/2] Setting up database with sample data..."
  npm run seed
  echo ""
fi

echo " Starting EduTrack server..."
echo " Open your browser at: http://localhost:3000"
echo ""
echo " Login: principal / admin123"
echo ""
echo " Press Ctrl+C to stop the server."
echo ""

npm start
