#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    # Kill all background jobs started by this script
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT

echo "🚀 Starting QA Learning Program..."

PROJECT_ROOT="/Users/tej/Developer/AI-tutoring"

echo "📡 Starting Backend (Port 3001)..."
cd "$PROJECT_ROOT/backend" && npm run dev &
BACKEND_PID=$!

echo "💻 Starting Frontend (Port 5173)..."
cd "$PROJECT_ROOT/frontend" && npm run dev

wait
