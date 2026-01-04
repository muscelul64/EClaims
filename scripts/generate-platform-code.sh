#!/bin/bash

# Platform Code Generation Script for Porsche E-Claims
# Generates native library code for Master App integration

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/dist/platform-integration"
ANDROID_SRC="$PROJECT_ROOT/platform-integration/android/SecureCommunication.kt"

# Default configuration (will be overridden by .env if present)
SHARED_SECRET=""

# Load environment variables if .env exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    # Read EXPO_PUBLIC_SHARED_SECRET from .env
    # We use grep/cut to avoid sourcing the entire file which might have syntax issues for bash
    ENV_SECRET=$(grep "^EXPO_PUBLIC_SHARED_SECRET=" "$PROJECT_ROOT/.env" | cut -d '=' -f2-)

    # Remove potential surrounding quotes (both single and double)
    ENV_SECRET=$(echo "$ENV_SECRET" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

    if [ -n "$ENV_SECRET" ]; then
        SHARED_SECRET="$ENV_SECRET"
    fi
fi

if [ -z "$SHARED_SECRET" ]; then
    echo "⚠️  Warning: EXPO_PUBLIC_SHARED_SECRET not found in .env"
    echo "   Using default development secret. DO NOT USE IN PRODUCTION."
    SHARED_SECRET="porsche-eclaims-default-key-2026"
fi

# Function to generate Kotlin code
generate_kotlin() {
    echo "🤖 Generating Kotlin library..."

    if [ ! -f "$ANDROID_SRC" ]; then
        echo "❌ Error: Source file $ANDROID_SRC not found!"
        exit 1
    fi

    mkdir -p "$OUTPUT_DIR/android/com/porsche/eclaims/security"
    OUTPUT_FILE="$OUTPUT_DIR/android/com/porsche/eclaims/security/SecureCommunication.kt"

    # Read the template file
    CONTENT=$(cat "$ANDROID_SRC")

    # Replace the shared secret
    # We need to escape special characters for both:
    # 1. The sed command replacement string (escape / and &)
    # 2. The Kotlin string literal (escape " and \)

    # First, escape backslashes and quotes for Kotlin string
    # We use multiple sed passes for clarity
    KOTLIN_SAFE_SECRET=$(printf '%s\n' "$SHARED_SECRET" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')

    # Then escape for sed replacement string (escape / and &)
    SED_SAFE_SECRET=$(printf '%s\n' "$KOTLIN_SAFE_SECRET" | sed 's/[\/&]/\\&/g')

    # Replace the default secret in the Kotlin file
    # Looking for: private val sharedSecret: String = "..."
    UPDATED_CONTENT=$(echo "$CONTENT" | sed "s/private val sharedSecret: String = \".*\"/private val sharedSecret: String = \"$SED_SAFE_SECRET\"/")

    echo "$UPDATED_CONTENT" > "$OUTPUT_FILE"

    echo "✅ Kotlin library generated at: $OUTPUT_FILE"
    echo "🔑 Used Shared Secret: ${SHARED_SECRET:0:5}..."
}

# Function to generate Swift code (placeholder)
generate_swift() {
    echo "🍎 Generating Swift library..."
    echo "⚠️ Swift generation not implemented yet."
}

# Check arguments
if [ "$1" == "kotlin" ]; then
    generate_kotlin
elif [ "$1" == "swift" ]; then
    generate_swift
else
    echo "Usage: $0 [kotlin|swift]"
    exit 1
fi
