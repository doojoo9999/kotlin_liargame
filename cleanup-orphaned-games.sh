#!/bin/bash

# Script to clean up orphaned games
# Usage: ./cleanup-orphaned-games.sh [game_number]

API_BASE_URL="http://localhost:20021/api/v1/game"

# Check if game number is provided for specific cleanup
if [ ! -z "$1" ]; then
    echo "Attempting to force cleanup game #$1..."
    curl -X DELETE "${API_BASE_URL}/admin/cleanup/game/$1" \
         -H "Content-Type: application/json" | jq .
else
    echo "Cleaning up all orphaned games..."
    curl -X POST "${API_BASE_URL}/admin/cleanup/orphaned" \
         -H "Content-Type: application/json" | jq .
fi

echo "Cleanup completed."