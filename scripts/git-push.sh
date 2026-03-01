#!/bin/bash
# Run this in Terminal.app or iTerm — NOT in Cursor's terminal.
# Cursor's terminal can stall on git commands.
set -e
cd "$(dirname "$0")/.."
echo "Staging changes..."
git add -A
git status
echo ""
echo "Committing..."
git commit --no-verify -m "fix: sandbox npm install, panel resize, folder cleanup"
echo ""
echo "Pushing to origin main..."
git push origin main
echo "Done."
