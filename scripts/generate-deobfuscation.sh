#!/bin/bash

# Deobfuscation Script for Porsche E-Claims
# Generates mapping files and prepares crash report analysis tools

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build"
MAPPING_DIR="$BUILD_DIR/mapping"
DIST_DIR="$PROJECT_ROOT/dist"

echo "🔧 Starting deobfuscation setup for Porsche E-Claims..."

# Create directories
mkdir -p "$MAPPING_DIR"
mkdir -p "$DIST_DIR/sourcemaps"

# Function to generate source maps for JavaScript
generate_js_sourcemaps() {
    echo "📍 Generating JavaScript source maps..."
    
    # For Expo/React Native, source maps are generated during metro bundling
    if command -v npx >/dev/null 2>&1; then
        echo "  Creating source map for main bundle..."
        
        # Generate source map for production bundle
        npx expo export --platform all --output-dir "$DIST_DIR" --source-maps
        
        # Copy source maps to mapping directory
        find "$DIST_DIR" -name "*.map" -exec cp {} "$MAPPING_DIR/" \;
        
        echo "  ✅ JavaScript source maps generated"
    else
        echo "  ⚠️ NPX not found, skipping JavaScript source maps"
    fi
}

# Function to process Android mapping
process_android_mapping() {
    echo "🤖 Processing Android obfuscation mapping..."
    
    ANDROID_MAPPING="$PROJECT_ROOT/android/app/build/outputs/mapping"
    
    if [ -d "$ANDROID_MAPPING" ]; then
        # Find the latest mapping file
        LATEST_MAPPING=$(find "$ANDROID_MAPPING" -name "mapping.txt" | head -1)
        
        if [ -f "$LATEST_MAPPING" ]; then
            cp "$LATEST_MAPPING" "$MAPPING_DIR/android-mapping.txt"
            
            # Generate symbol lookup file
            echo "  Creating Android symbol lookup..."
            python3 - << 'EOF'
import sys
import json
import os

mapping_file = sys.argv[1]
output_file = sys.argv[2]

symbols = {}
try:
    with open(mapping_file, 'r') as f:
        for line in f:
            line = line.strip()
            if ' -> ' in line and ':' in line:
                # Parse ProGuard mapping format
                parts = line.split(' -> ')
                if len(parts) == 2:
                    original = parts[0].strip()
                    obfuscated = parts[1].strip().rstrip(':')
                    
                    # Extract class and method names
                    if '(' in original:  # Method mapping
                        method_part = original.split()[-1]
                        if '.' in method_part:
                            class_name = '.'.join(method_part.split('.')[:-1])
                            method_name = method_part.split('.')[-1].split('(')[0]
                            symbols[obfuscated] = f"{class_name}.{method_name}"
                        else:
                            symbols[obfuscated] = method_part.split('(')[0]
                    else:  # Class mapping
                        symbols[obfuscated] = original
    
    with open(output_file, 'w') as f:
        json.dump(symbols, f, indent=2)
    
    print(f"Generated {len(symbols)} symbol mappings")
    
except Exception as e:
    print(f"Error processing mapping: {e}")
EOF

            python3 - "$LATEST_MAPPING" "$MAPPING_DIR/android-symbols.json"
            echo "  ✅ Android mapping processed"
        else
            echo "  ⚠️ Android mapping file not found"
        fi
    else
        echo "  ⚠️ Android mapping directory not found"
    fi
}

# Function to process iOS dSYM files
process_ios_dsym() {
    echo "🍎 Processing iOS dSYM files..."
    
    IOS_BUILD="$PROJECT_ROOT/ios/build"
    
    if [ -d "$IOS_BUILD" ]; then
        # Find dSYM files
        find "$IOS_BUILD" -name "*.dSYM" -type d | while read dsym_file; do
            dsym_name=$(basename "$dsym_file" .dSYM)
            echo "  Found dSYM: $dsym_name"
            
            # Copy dSYM file
            cp -r "$dsym_file" "$MAPPING_DIR/"
            
            # Extract symbols if dsymutil is available
            if command -v dsymutil >/dev/null 2>&1; then
                dsymutil -dump-debug-map "$dsym_file" > "$MAPPING_DIR/${dsym_name}-symbols.txt" 2>/dev/null || true
            fi
        done
        
        echo "  ✅ iOS dSYM files processed"
    else
        echo "  ⚠️ iOS build directory not found"
    fi
}

# Function to create crash analysis tools
create_analysis_tools() {
    echo "🔍 Creating crash analysis tools..."
    
    cat > "$MAPPING_DIR/analyze-crash.py" << 'EOF'
#!/usr/bin/env python3
"""
Crash Analysis Tool for Porsche E-Claims
Usage: python3 analyze-crash.py <crash_report.json>
"""

import json
import sys
import re
import os

def load_symbol_map(symbols_file):
    """Load symbol mapping from JSON file"""
    try:
        with open(symbols_file, 'r') as f:
            return json.load(f)
    except:
        return {}

def deobfuscate_stack_trace(stack_trace, symbol_map):
    """Deobfuscate stack trace using symbol mapping"""
    lines = stack_trace.split('\n')
    deobfuscated = []
    
    for line in lines:
        deobfuscated_line = line
        
        # Replace obfuscated symbols
        for obfuscated, original in symbol_map.items():
            if obfuscated in line:
                deobfuscated_line = deobfuscated_line.replace(obfuscated, original)
        
        deobfuscated.append(deobfuscated_line)
    
    return '\n'.join(deobfuscated)

def analyze_crash_report(crash_file):
    """Analyze crash report and provide deobfuscated output"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    android_symbols = load_symbol_map(os.path.join(script_dir, 'android-symbols.json'))
    
    try:
        with open(crash_file, 'r') as f:
            crash_data = json.load(f)
        
        print("=" * 60)
        print("CRASH REPORT ANALYSIS")
        print("=" * 60)
        
        print(f"App: {crash_data.get('deviceInfo', {}).get('appVersion', 'Unknown')}")
        print(f"Platform: {crash_data.get('platform', 'Unknown')}")
        print(f"Error: {crash_data.get('error', {}).get('message', 'Unknown')}")
        print(f"Time: {crash_data.get('timestamp', 'Unknown')}")
        
        print("\n" + "=" * 60)
        print("DEOBFUSCATED STACK TRACE")
        print("=" * 60)
        
        original_stack = crash_data.get('error', {}).get('stack', '')
        if android_symbols and crash_data.get('platform') == 'android':
            deobfuscated_stack = deobfuscate_stack_trace(original_stack, android_symbols)
            print(deobfuscated_stack)
        else:
            print(original_stack)
        
        # Show context if available
        context = crash_data.get('context', {})
        if context:
            print("\n" + "=" * 60)
            print("CONTEXT")
            print("=" * 60)
            for key, value in context.items():
                print(f"{key}: {value}")
        
    except Exception as e:
        print(f"Error analyzing crash report: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 analyze-crash.py <crash_report.json>")
        sys.exit(1)
    
    analyze_crash_report(sys.argv[1])
EOF

    chmod +x "$MAPPING_DIR/analyze-crash.py"
    
    # Create batch analyzer for multiple crashes
    cat > "$MAPPING_DIR/batch-analyze.py" << 'EOF'
#!/usr/bin/env python3
"""
Batch Crash Analysis Tool for Porsche E-Claims
Usage: python3 batch-analyze.py <crashes_directory>
"""

import json
import sys
import os
import glob
from collections import Counter

def analyze_crash_directory(crashes_dir):
    """Analyze all crash reports in a directory"""
    crash_files = glob.glob(os.path.join(crashes_dir, "crash_*.json"))
    
    if not crash_files:
        print("No crash reports found")
        return
    
    errors = []
    platforms = Counter()
    screens = Counter()
    
    print(f"Found {len(crash_files)} crash reports")
    print("=" * 60)
    
    for crash_file in sorted(crash_files):
        try:
            with open(crash_file, 'r') as f:
                crash_data = json.load(f)
            
            error_msg = crash_data.get('error', {}).get('message', 'Unknown')
            platform = crash_data.get('platform', 'unknown')
            screen = crash_data.get('context', {}).get('screen', 'unknown')
            
            errors.append(error_msg)
            platforms[platform] += 1
            screens[screen] += 1
            
        except Exception as e:
            print(f"Error processing {crash_file}: {e}")
    
    print("TOP ERRORS:")
    error_counts = Counter(errors)
    for error, count in error_counts.most_common(10):
        print(f"  {count}: {error}")
    
    print(f"\nPLATFORM BREAKDOWN:")
    for platform, count in platforms.most_common():
        print(f"  {platform}: {count}")
    
    print(f"\nSCREEN BREAKDOWN:")
    for screen, count in screens.most_common():
        print(f"  {screen}: {count}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 batch-analyze.py <crashes_directory>")
        sys.exit(1)
    
    analyze_crash_directory(sys.argv[1])
EOF

    chmod +x "$MAPPING_DIR/batch-analyze.py"
    
    echo "  ✅ Analysis tools created"
}

# Function to create README
create_readme() {
    cat > "$MAPPING_DIR/README.md" << 'EOF'
# Deobfuscation Files for Porsche E-Claims

This directory contains mapping files and tools for debugging production crashes.

## Files

- `android-mapping.txt` - ProGuard mapping file for Android
- `android-symbols.json` - Symbol lookup table for Android crashes
- `*.dSYM/` - iOS debug symbol files
- `*.map` - JavaScript source maps
- `analyze-crash.py` - Single crash report analyzer
- `batch-analyze.py` - Batch crash analysis tool

## Usage

### Analyze Single Crash Report
```bash
python3 analyze-crash.py path/to/crash_report.json
```

### Analyze Multiple Crash Reports
```bash
python3 batch-analyze.py path/to/crashes/directory
```

### Manual Deobfuscation

For Android stack traces, use the mapping file with ReTrace:
```bash
retrace.sh android-mapping.txt stacktrace.txt
```

For JavaScript errors, use the source maps with source-map libraries.

## Integration

The deobfuscation manager is automatically initialized in the app:

```typescript
import { initializeDeobfuscation, logError } from '@/utils/deobfuscation';

// Initialize on app start
await initializeDeobfuscation();

// Log errors with context
logError(new Error('Something went wrong'), {
  screen: 'VehicleList',
  action: 'deleteVehicle'
});
```

## Production Setup

1. Ensure mapping files are generated during build
2. Upload mapping files to crash reporting service
3. Set up automated crash analysis pipeline
4. Configure alerts for critical errors

EOF
    
    echo "  ✅ README created"
}

# Main execution
main() {
    echo "Starting deobfuscation setup..."
    
    # Generate source maps
    generate_js_sourcemaps
    
    # Process platform-specific mappings
    process_android_mapping
    process_ios_dsym
    
    # Create analysis tools
    create_analysis_tools
    create_readme
    
    echo ""
    echo "🎉 Deobfuscation setup complete!"
    echo "📂 Mapping files location: $MAPPING_DIR"
    echo "🔍 Analysis tools available:"
    echo "   - Single crash: python3 $MAPPING_DIR/analyze-crash.py <crash_file>"
    echo "   - Batch analysis: python3 $MAPPING_DIR/batch-analyze.py <crashes_dir>"
    echo ""
    echo "📖 See $MAPPING_DIR/README.md for detailed usage instructions"
}

# Run main function
main "$@"