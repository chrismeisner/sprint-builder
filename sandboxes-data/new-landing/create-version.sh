#!/bin/bash

# Landing Page Version Manager
# Creates a new version snapshot of the current landing page

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Landing Page Version Manager${NC}"
echo "========================================"
echo ""

# Get version number
read -p "Version number (e.g., 2, 3, 4): v" version_num

# Get description
read -p "Brief description (e.g., services-redesign, new-projects): " description

# Get long description
read -p "Full description (what changed in this version): " full_description

# Get date
current_date=$(date +%Y-%m-%d)
current_date_formatted=$(date "+%B %d, %Y")

# Create version name
version_name="v${version_num}-${description}-${current_date}"
version_dir="versions/${version_name}"

echo ""
echo -e "${YELLOW}Creating version: ${version_name}${NC}"

# Check if directory already exists
if [ -d "$version_dir" ]; then
    echo "Error: Version directory already exists!"
    exit 1
fi

# Create directory
mkdir -p "$version_dir"

# Copy files
echo "Copying files..."
cp index.html "$version_dir/"
cp -r src "$version_dir/"
cp -r images "$version_dir/"

# Create VERSION-INFO.md template
cat > "$version_dir/VERSION-INFO.md" << EOF
# Version ${version_num} - ${description^} (${current_date})

## Overview
[Describe what changed in this version]

## Changes from Previous Version
- [Change 1]
- [Change 2]
- [Change 3]

## What's in this version

### Key Features
- [Feature 1]
- [Feature 2]

### Technical Details
- Built with: HTML, Tailwind CSS, Vite
- [Other technical notes]

## Use Cases for This Version
- [Use case 1]
- [Use case 2]

---

**Snapshot Date:** ${current_date}  
**Status:** [Draft / Review / Production-ready]
EOF

# Add to versions-data.js
echo ""
echo "Adding version to versions-data.js..."

# Format description for JavaScript (escape quotes and newlines)
js_description=$(echo "$full_description" | sed "s/'/\\\\'/g")
title_case=$(echo "$description" | sed 's/-/ /g; s/\b\(.\)/\u\1/g')

# Create the new version entry
new_entry="  {
    name: \"${version_name}\",
    version: \"${version_num}\",
    title: \"${title_case}\",
    date: \"${current_date_formatted}\",
    dateValue: \"${current_date}\",
    description: \"${js_description}\",
    features: [
      \"Feature 1 - update in VERSION-INFO.md\",
      \"Feature 2 - update in VERSION-INFO.md\",
      \"Feature 3 - update in VERSION-INFO.md\"
    ],
    status: \"archived\",
    path: \"${version_name}/index.html\"
  }"

# Insert the new entry after the opening bracket of VERSIONS array
# Using awk to find the first [ after "const VERSIONS" and insert after it
awk -v entry="$new_entry" '
/const VERSIONS = \[/ {
    print $0;
    getline;
    print entry ",";
    print $0;
    next;
}
{print}
' versions/versions-data.js > versions/versions-data.js.tmp

mv versions/versions-data.js.tmp versions/versions-data.js

echo -e "${GREEN}✓ Version created successfully!${NC}"
echo ""
echo "Location: $version_dir"
echo ""
echo "Next steps:"
echo "1. Edit $version_dir/VERSION-INFO.md with details about this version"
echo "2. Edit versions/versions-data.js to update the features array for this version"
echo "3. Update versions/README.md with version history entry"
echo "4. View all versions at: versions/index.html"
echo ""
echo -e "${BLUE}Continue working on your landing page - you now have a bookmark!${NC}"
