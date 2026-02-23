#!/bin/bash
# Hook: Run TypeScript type-check after editing TS/TSX files
# This hook runs automatically after file edits

# Get the file path from the hook environment variable
FILE_PATH="$HOOK_FILE_PATH"

# Check if file path is set
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Check if file is a TypeScript file
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
    # Check if file is in ui-src directory
    if [[ "$FILE_PATH" =~ ui-src/js/ ]]; then
        echo "Running type-check..."

        # Change to ui-src directory and run type-check
        cd "$(dirname "$0")/../../ui-src" || exit 0

        # Run type-check on the project
        if npm run type-check 2>&1; then
            echo "Type-check passed"
        else
            echo "Type-check found issues"
            echo "Run 'cd ui-src && npm run type-check' to see all issues"
        fi
    fi
fi

exit 0
