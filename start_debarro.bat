@echo off
start "De Barro API" cmd /k "cd /d C:\projektek\debarro\DEBARRO-PYTHON && uvicorn main:app --reload"
timeout /t 3 /nobreak
start "De Barro Frontend" cmd /k "cd /d C:\projektek\debarro\debarro-frontend && npm start"
