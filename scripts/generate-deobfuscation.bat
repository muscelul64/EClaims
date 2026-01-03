@echo off
REM Deobfuscation Script for Porsche E-Claims (Windows)
REM Generates mapping files and prepares crash report analysis tools

setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0.."
set "BUILD_DIR=%PROJECT_ROOT%\build"
set "MAPPING_DIR=%BUILD_DIR%\mapping"
set "DIST_DIR=%PROJECT_ROOT%\dist"

echo 🔧 Starting deobfuscation setup for Porsche E-Claims...

REM Create directories
if not exist "%MAPPING_DIR%" mkdir "%MAPPING_DIR%"
if not exist "%DIST_DIR%\sourcemaps" mkdir "%DIST_DIR%\sourcemaps"

REM Generate JavaScript source maps
echo 📍 Generating JavaScript source maps...
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo   Creating source map for main bundle...
    npx expo export --platform all --output-dir "%DIST_DIR%" --source-maps
    
    REM Copy source maps to mapping directory
    for /r "%DIST_DIR%" %%f in (*.map) do (
        copy "%%f" "%MAPPING_DIR%\" >nul
    )
    
    echo   ✅ JavaScript source maps generated
) else (
    echo   ⚠️ NPX not found, skipping JavaScript source maps
)

REM Process Android mapping
echo 🤖 Processing Android obfuscation mapping...
set "ANDROID_MAPPING=%PROJECT_ROOT%\android\app\build\outputs\mapping"

if exist "%ANDROID_MAPPING%" (
    for /r "%ANDROID_MAPPING%" %%f in (mapping.txt) do (
        copy "%%f" "%MAPPING_DIR%\android-mapping.txt" >nul
        echo   Found and copied Android mapping file
        goto :android_done
    )
    echo   ⚠️ Android mapping file not found
) else (
    echo   ⚠️ Android mapping directory not found
)
:android_done

REM Create crash analysis tools
echo 🔍 Creating crash analysis tools...

REM Create Python analysis script
(
echo #!/usr/bin/env python3
echo """
echo Crash Analysis Tool for Porsche E-Claims
echo Usage: python analyze-crash.py ^<crash_report.json^>
echo """
echo.
echo import json
echo import sys
echo import re
echo import os
echo.
echo def load_symbol_map^(symbols_file^):
echo     """Load symbol mapping from JSON file"""
echo     try:
echo         with open^(symbols_file, 'r'^) as f:
echo             return json.load^(f^)
echo     except:
echo         return {}
echo.
echo def analyze_crash_report^(crash_file^):
echo     """Analyze crash report and provide deobfuscated output"""
echo     try:
echo         with open^(crash_file, 'r'^) as f:
echo             crash_data = json.load^(f^)
echo.
echo         print^("=" * 60^)
echo         print^("CRASH REPORT ANALYSIS"^)
echo         print^("=" * 60^)
echo.
echo         print^(f"App: {crash_data.get^('deviceInfo', {}^).get^('appVersion', 'Unknown'^)}"^)
echo         print^(f"Platform: {crash_data.get^('platform', 'Unknown'^)}"^)
echo         print^(f"Error: {crash_data.get^('error', {}^).get^('message', 'Unknown'^)}"^)
echo         print^(f"Time: {crash_data.get^('timestamp', 'Unknown'^)}"^)
echo.
echo         print^("\\n" + "=" * 60^)
echo         print^("STACK TRACE"^)
echo         print^("=" * 60^)
echo.
echo         stack = crash_data.get^('error', {}^).get^('stack', ''^)
echo         print^(stack^)
echo.
echo         context = crash_data.get^('context', {}^)
echo         if context:
echo             print^("\\n" + "=" * 60^)
echo             print^("CONTEXT"^)
echo             print^("=" * 60^)
echo             for key, value in context.items^(^):
echo                 print^(f"{key}: {value}"^)
echo.
echo     except Exception as e:
echo         print^(f"Error analyzing crash report: {e}"^)
echo.
echo if __name__ == "__main__":
echo     if len^(sys.argv^) != 2:
echo         print^("Usage: python analyze-crash.py ^<crash_report.json^>"^)
echo         sys.exit^(1^)
echo.
echo     analyze_crash_report^(sys.argv[1]^)
) > "%MAPPING_DIR%\analyze-crash.py"

REM Create batch analysis script
(
echo #!/usr/bin/env python3
echo """
echo Batch Crash Analysis Tool for Porsche E-Claims
echo Usage: python batch-analyze.py ^<crashes_directory^>
echo """
echo.
echo import json
echo import sys
echo import os
echo import glob
echo from collections import Counter
echo.
echo def analyze_crash_directory^(crashes_dir^):
echo     """Analyze all crash reports in a directory"""
echo     crash_files = glob.glob^(os.path.join^(crashes_dir, "crash_*.json"^)^)
echo.
echo     if not crash_files:
echo         print^("No crash reports found"^)
echo         return
echo.
echo     errors = []
echo     platforms = Counter^(^)
echo     screens = Counter^(^)
echo.
echo     print^(f"Found {len^(crash_files^)} crash reports"^)
echo     print^("=" * 60^)
echo.
echo     for crash_file in sorted^(crash_files^):
echo         try:
echo             with open^(crash_file, 'r'^) as f:
echo                 crash_data = json.load^(f^)
echo.
echo             error_msg = crash_data.get^('error', {}^).get^('message', 'Unknown'^)
echo             platform = crash_data.get^('platform', 'unknown'^)
echo             screen = crash_data.get^('context', {}^).get^('screen', 'unknown'^)
echo.
echo             errors.append^(error_msg^)
echo             platforms[platform] += 1
echo             screens[screen] += 1
echo.
echo         except Exception as e:
echo             print^(f"Error processing {crash_file}: {e}"^)
echo.
echo     print^("TOP ERRORS:"^)
echo     error_counts = Counter^(errors^)
echo     for error, count in error_counts.most_common^(10^):
echo         print^(f"  {count}: {error}"^)
echo.
echo     print^(f"\\nPLATFORM BREAKDOWN:"^)
echo     for platform, count in platforms.most_common^(^):
echo         print^(f"  {platform}: {count}"^)
echo.
echo     print^(f"\\nSCREEN BREAKDOWN:"^)
echo     for screen, count in screens.most_common^(^):
echo         print^(f"  {screen}: {count}"^)
echo.
echo if __name__ == "__main__":
echo     if len^(sys.argv^) != 2:
echo         print^("Usage: python batch-analyze.py ^<crashes_directory^>"^)
echo         sys.exit^(1^)
echo.
echo     analyze_crash_directory^(sys.argv[1]^)
) > "%MAPPING_DIR%\batch-analyze.py"

echo   ✅ Analysis tools created

REM Create README
(
echo # Deobfuscation Files for Porsche E-Claims
echo.
echo This directory contains mapping files and tools for debugging production crashes.
echo.
echo ## Files
echo.
echo - `android-mapping.txt` - ProGuard mapping file for Android
echo - `*.map` - JavaScript source maps
echo - `analyze-crash.py` - Single crash report analyzer
echo - `batch-analyze.py` - Batch crash analysis tool
echo.
echo ## Usage
echo.
echo ### Analyze Single Crash Report
echo ```bash
echo python analyze-crash.py path/to/crash_report.json
echo ```
echo.
echo ### Analyze Multiple Crash Reports
echo ```bash
echo python batch-analyze.py path/to/crashes/directory
echo ```
echo.
echo ### Windows Commands
echo ```cmd
echo python "%MAPPING_DIR%\analyze-crash.py" "C:\path\to\crash_report.json"
echo python "%MAPPING_DIR%\batch-analyze.py" "C:\path\to\crashes\"
echo ```
echo.
echo ## Integration
echo.
echo The deobfuscation manager is automatically initialized in the app.
echo See the main deobfuscation documentation for details.
) > "%MAPPING_DIR%\README.md"

echo   ✅ README created

echo.
echo 🎉 Deobfuscation setup complete!
echo 📂 Mapping files location: %MAPPING_DIR%
echo 🔍 Analysis tools available:
echo    - Single crash: python "%MAPPING_DIR%\analyze-crash.py" ^<crash_file^>
echo    - Batch analysis: python "%MAPPING_DIR%\batch-analyze.py" ^<crashes_dir^>
echo.
echo 📖 See %MAPPING_DIR%\README.md for detailed usage instructions

pause