@IF EXIST "%~dp0node_modules\egret\EgretEngine" (
  FOR /F "usebackq delims=" %%a in ("%~dp0node_modules\egret\EgretEngine") do @(set EGRET=%%a)
) ELSE (
  set EGRET=%~dp0node_modules
)

@IF EXIST "%EGRET%\node.exe" (
  "%EGRET%\node.exe" --no-deprecation --max-old-space-size=8192 "%EGRET%\selector.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node --no-deprecation --max-old-space-size=8192 "%EGRET%\selector.js" %*
)