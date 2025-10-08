#!/bin/bash

echo "========================================"
echo "Among Us Coding Game - LAN Setup"
echo "========================================"

echo ""
echo "Finding your local IP address..."
node get-ip.js

echo ""
echo "Starting backend server..."
cross-env HOST=0.0.0.0 npm run dev:lan &

sleep 5

echo ""
echo "Starting frontend server..."
cd frontend
npm run dev:lan &

echo ""
echo "Setup complete! Check the IP address above to access the game from other devices."
echo "Make sure to create a .env file in the root directory with:"
echo "HOST=0.0.0.0"
echo ""
echo "Press Ctrl+C to stop the servers."
wait