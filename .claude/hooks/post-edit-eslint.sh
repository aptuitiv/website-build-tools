#!/bin/bash
# Hook: Run ESLint after editing JS/JSX/TS/TSX files
# This hook runs automatically after file edits

# Get the file path from the hook environment variable
FILE_PATH="$HOOK_FILE_PATH"

# Check if file path is set
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Check if file is a JavaScript/TypeScript file
if [[ "$FILE_PATH" =~ \.(js|jsx|ts|tsx)$ ]]; then
    # Check if file is in ui-src directory
    if [[ "$FILE_PATH" =~ ui-src/js/ ]]; then
        echo "🔍 Running ESLint on $(basename "$FILE_PATH")..."

        # Change to ui-src directory and run eslint
        cd "$(dirname "$0")/../../ui-src" || exit 0

        # Run eslint on the specific file (capture exit code; grep -v would invert it)
        eslint_output=$(npm run eslint -- "$FILE_PATH" 2>&1)
        eslint_exit=$?
        if [ "$eslint_exit" -eq 0 ]; then
            echo "✅ ESLint passed for $(basename "$FILE_PATH")"
        else
            echo "⚠️  ESLint found issues in $(basename "$FILE_PATH")"
            echo "$eslint_output" | grep -v "npm WARN" || true
            echo "Run 'cd ui-src && npm run eslint' to see all issues"
        fi
    fi
fi

exit 0
