#!/usr/bin/env bash
# tests/e2e/run-all.sh
# Portable shell runner wrapper for Talha Masood Portfolio E2E test suite.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

NODE_BIN=""
if command -v node >/dev/null 2>&1; then
  NODE_BIN="node"
elif [ -x "/Users/home/Library/Application Support/Antigravity/bin/agy-node" ]; then
  NODE_BIN="/Users/home/Library/Application Support/Antigravity/bin/agy-node"
elif [ -x "/usr/local/bin/node" ]; then
  NODE_BIN="/usr/local/bin/node"
else
  echo "Error: No Node.js runtime found. Please install Node.js (v22+ recommended)." >&2
  exit 1
fi

cd "${ROOT_DIR}"
exec "${NODE_BIN}" tests/e2e/runner.js "$@"
