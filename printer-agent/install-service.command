#!/bin/bash
# Double-click to install the studio print agent as an always-on background
# service (launchd). Generates the launchd plist with the correct node path +
# this folder's path, loads it, and starts the agent now. Re-running re-installs
# cleanly.
set -e
cd "$(dirname "$0")" || exit 1
DIR="$(pwd)"
NODE="$(command -v node || echo /opt/homebrew/bin/node)"

if [ ! -x "$NODE" ]; then
  echo "Node.js not found. Install it from https://nodejs.org and try again."
  read -r -p "Press Return to close."
  exit 1
fi

LABEL="com.studio.printagent"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>$LABEL</string>
    <key>ProgramArguments</key>
    <array><string>$NODE</string><string>agent.js</string></array>
    <key>WorkingDirectory</key><string>$DIR</string>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>StandardOutPath</key><string>/tmp/studio-printagent.out.log</string>
    <key>StandardErrorPath</key><string>/tmp/studio-printagent.err.log</string>
</dict>
</plist>
PLISTEOF

# Reload if already installed.
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "Installed and started the studio print agent service."
echo "  plist: $PLIST"
echo "  logs:  /tmp/studio-printagent.out.log  (and .err.log)"
echo
echo "TIP: set this Mac to never sleep so it can print 24/7."
echo "To remove the service later, double-click uninstall-service.command."
echo
read -r -p "Press Return to close."
