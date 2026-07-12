#!/bin/bash
# Double-click to stop and remove the always-on studio print agent service.
cd "$(dirname "$0")" || exit 1
LABEL="com.studio.printagent"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ -f "$PLIST" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Removed the studio print agent service ($PLIST)."
else
  echo "No installed service found."
fi
echo
read -r -p "Press Return to close."
