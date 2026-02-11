#!/bin/bash

# Quick launcher for the versions browser
# Opens the versions page in your default browser

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Opening Versions Browser...${NC}"

# Check if we're in the project root
if [ ! -f "versions/index.html" ]; then
    echo "Error: Must be run from project root"
    exit 1
fi

# Open in default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open versions/index.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open versions/index.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start versions/index.html
else
    echo "Could not detect OS. Please open versions/index.html manually."
fi

echo "Versions browser opened in your default browser."
echo "Tip: Run 'npm run dev' to view with live reload."
