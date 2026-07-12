#!/bin/bash
# Double-click to start the studio print agent in the foreground (close window to
# stop). For always-on operation, double-click install-service.command instead.
cd "$(dirname "$0")" || exit 1
NODE="$(command -v node || echo /opt/homebrew/bin/node)"
if [ ! -x "$NODE" ]; then
  echo "Node.js not found. Install it from https://nodejs.org and try again."
  read -r -p "Press Return to close."
  exit 1
fi
"$NODE" agent.js
read -r -p "Agent stopped. Press Return to close."
