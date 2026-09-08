#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Node.js 22 or newer is required."; exit 1; fi
MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$MAJOR" -lt 22 ]; then echo "Node.js 22 or newer is required. Current major: $MAJOR"; exit 1; fi
[ -f .env ] || cp .env.example .env
[ -d node_modules ] || npm install
printf 'Open http://localhost:3000\n'
npm start
