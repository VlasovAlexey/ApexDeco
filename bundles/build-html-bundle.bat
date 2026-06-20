@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_FILE=%SCRIPT_DIR%build-html-bundle.js"
set "NODE_EXE="

where node >nul 2>nul
if not errorlevel 1 (
    set "NODE_EXE=node"
    goto run
)

if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
    goto run
)

if exist "%LocalAppData%\Programs\nodejs\node.exe" (
    set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
    goto run
)

if exist "%USERPROFILE%\scoop\apps\nodejs\current\node.exe" (
    set "NODE_EXE=%USERPROFILE%\scoop\apps\nodejs\current\node.exe"
    goto run
)

if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    goto run
)

echo node.exe not found. Install Node.js or edit this file with the correct path.
exit /b 1

:run
"%NODE_EXE%" "%SCRIPT_FILE%" %*
exit /b %errorlevel%
