@echo off
setlocal enabledelayedexpansion

echo ===================================================================
echo  REALISTIC ANACONDA: AMAZON RAINFOREST SURVIVAL
echo  Compiling Java Source Files...
echo ===================================================================

if not exist bin mkdir bin

:: Find all java files and compile
dir /s /b src\main\java\*.java src\test\java\*.java > sources.txt
javac -d bin -encoding UTF-8 @sources.txt
del sources.txt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Compilation failed. Please check JDK installation.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Compilation complete. Launching game...
echo ===================================================================
java -cp bin Main

endlocal
