@echo off
REM autostart.bat — Windows auto-start script for the Stash Scheduler.
REM
REM Usage:
REM   autostart.bat [STASH_URL] [API_KEY]
REM
REM Examples:
REM   autostart.bat
REM   autostart.bat http://localhost:9999
REM   autostart.bat http://localhost:9999 your-api-key-here
REM
REM To run automatically on Windows startup, place a shortcut to this
REM script in:  shell:startup  (press Win+R, type shell:startup, hit Enter)

setlocal

SET STASH_URL=%~1
IF "%STASH_URL%"=="" SET STASH_URL=http://localhost:9999

SET API_KEY=%~2
SET GRAPHQL=%STASH_URL%/graphql
SET MUTATION={"query":"mutation { runPluginTask(plugin_id: \"stash-scheduler\", task_name: \"Start Scheduler\") }"}
SET MAX_WAIT=120
SET INTERVAL=5
SET ELAPSED=0

echo [Stash Scheduler] Waiting for Stash at %STASH_URL% ...

:WAIT_LOOP
curl -sf --max-time 5 %GRAPHQL% -d "{\"query\":\"{health}\"}" >nul 2>&1
IF %ERRORLEVEL% EQU 0 GOTO STASH_UP

IF %ELAPSED% GEQ %MAX_WAIT% (
  echo [Stash Scheduler] ERROR: Stash not available after %MAX_WAIT%s. Aborting.
  exit /b 1
)

timeout /t %INTERVAL% /nobreak >nul
SET /A ELAPSED=%ELAPSED%+%INTERVAL%
GOTO WAIT_LOOP

:STASH_UP
echo [Stash Scheduler] Stash is up. Starting scheduler task...
timeout /t 3 /nobreak >nul

IF "%API_KEY%"=="" (
  curl -sf --max-time 30 -H "Content-Type: application/json" -d "%MUTATION%" %GRAPHQL%
) ELSE (
  curl -sf --max-time 30 -H "Content-Type: application/json" -H "ApiKey: %API_KEY%" -d "%MUTATION%" %GRAPHQL%
)

IF %ERRORLEVEL% EQU 0 (
  echo [Stash Scheduler] Scheduler task started successfully.
) ELSE (
  echo [Stash Scheduler] ERROR: Failed to start scheduler task.
  exit /b 1
)

endlocal
