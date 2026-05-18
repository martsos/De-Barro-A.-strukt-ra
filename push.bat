@echo off
set /p COMMIT="Commit message: "
cd /d C:\projektek\debarro
git add .
git commit -m "%COMMIT%"
git push
echo Done!
pause