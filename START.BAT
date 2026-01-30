@echo off
set  REPO=C:\github\hotel-frontend
call %REPO%\venv\Scripts\activate.bat
pushd %REPO%
python -m http.server 5175
popd
