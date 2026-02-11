#!/bin/bash

# Version Comparison Tool
# Helps you compare different versions of your landing page

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Landing Page Version Comparison${NC}"
echo "========================================"
echo ""

# List available versions
echo "Available versions:"
echo ""
ls -1 versions/ | grep -v README.md | nl
echo ""

# Get version selections
read -p "Enter first version number to compare: " ver1_num
read -p "Enter second version number to compare (or press Enter for current): " ver2_num

# Get version names
versions=($(ls -1 versions/ | grep -v README.md))
ver1_name="${versions[$ver1_num-1]}"

if [ -z "$ver2_num" ]; then
    ver2_path="."
    ver2_display="Current (working directory)"
else
    ver2_name="${versions[$ver2_num-1]}"
    ver2_path="versions/${ver2_name}"
    ver2_display="${ver2_name}"
fi

echo ""
echo -e "${YELLOW}Comparing:${NC}"
echo "  1: versions/${ver1_name}"
echo "  2: ${ver2_display}"
echo ""

# Show comparison options
echo "Choose comparison type:"
echo "  1) View line count differences"
echo "  2) Show side-by-side diff (requires diff tool)"
echo "  3) Open in VS Code diff viewer"
echo "  4) Show HTML structure diff only"
echo ""
read -p "Selection: " choice

case $choice in
    1)
        echo -e "\n${GREEN}Line Count Comparison:${NC}"
        echo "Version 1:"
        wc -l "versions/${ver1_name}/index.html"
        echo ""
        echo "Version 2:"
        wc -l "${ver2_path}/index.html"
        ;;
    2)
        diff -y "versions/${ver1_name}/index.html" "${ver2_path}/index.html" | less
        ;;
    3)
        if command -v code &> /dev/null; then
            code --diff "versions/${ver1_name}/index.html" "${ver2_path}/index.html"
            echo -e "${GREEN}Opened in VS Code${NC}"
        else
            echo "VS Code not found. Install VS Code or use another option."
        fi
        ;;
    4)
        echo -e "\n${GREEN}HTML Structure Diff:${NC}\n"
        diff -u "versions/${ver1_name}/index.html" "${ver2_path}/index.html" | grep -E '^\+|^\-|^@@' | head -50
        echo ""
        echo "(Showing first 50 differences)"
        ;;
    *)
        echo "Invalid selection"
        exit 1
        ;;
esac
