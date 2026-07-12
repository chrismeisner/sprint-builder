#!/bin/bash
# Double-click to test the printer connection (and print a test receipt).
cd "$(dirname "$0")" || exit 1
NODE="$(command -v node || echo /opt/homebrew/bin/node)"
if [ ! -x "$NODE" ]; then
  echo "Node.js not found. Install it from https://nodejs.org and try again."
  read -r -p "Press Return to close."
  exit 1
fi
"$NODE" test-connection.mjs --print
echo
read -r -p "Press Return to close."
