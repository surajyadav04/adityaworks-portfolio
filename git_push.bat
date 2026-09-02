@echo off
set PATH=C:\Program Files\Git\cmd;C:\Program Files\nodejs;%PATH%
git config user.name "Aditya Kumar"
git config user.email "mustbeaditya.kumar@gmail.com"
git add .
git commit -m "feat: use real live screenshot for PlacePrep AI across card and case study"
git push origin main
