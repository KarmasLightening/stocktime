#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting StockTime Application...${NC}"

# Kill existing processes
echo -e "${BLUE}Checking for existing processes...${NC}"
FRONTEND_PORT=3000
BACKEND_PORT=5000

kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo -e "${RED}Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid
    fi
}

kill_port $FRONTEND_PORT
kill_port $BACKEND_PORT

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
pip install -r requirements.txt

# Start backend server in the background
echo -e "${GREEN}Starting backend server...${NC}"
python app.py &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Change to frontend directory
cd ../frontend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend development server on port 3000
echo -e "${GREEN}Starting frontend development server on port ${FRONTEND_PORT}...${NC}"
PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo -e "${RED}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

# Keep script running
echo -e "${GREEN}Both services are running!${NC}"
echo -e "${BLUE}Access the application at: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${BLUE}Backend API is running at: ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

# Wait for both processes
wait
