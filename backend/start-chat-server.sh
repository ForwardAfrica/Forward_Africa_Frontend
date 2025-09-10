#!/bin/bash

echo "========================================"
echo "   Forward Africa Chat Server"
echo "========================================"
echo

echo "Starting chat server..."
echo "Port: 3001"
echo "Health check: http://localhost:3001/health"
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the chat server
npm run chat