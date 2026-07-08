@echo off
title Web Panel - OneBlock RPG
cd /d "%~dp0"
echo เปิด Web Panel... (http://localhost:8765)
start "" http://localhost:8765
node server.js
pause
