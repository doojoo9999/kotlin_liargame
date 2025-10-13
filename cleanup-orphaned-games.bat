@echo off
REM Script to clean up orphaned games on Windows
REM Usage: cleanup-orphaned-games.bat [game_number]

set API_BASE_URL=http://218.150.3.77:20021/api/v1/game

if "%1"=="" (
    echo Cleaning up all orphaned games...
    curl -X POST "%API_BASE_URL%/admin/cleanup/orphaned" -H "Content-Type: application/json"
) else (
    echo Attempting to force cleanup game #%1...
    curl -X DELETE "%API_BASE_URL%/admin/cleanup/game/%1" -H "Content-Type: application/json"
)

echo.
echo Cleanup completed.