#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
python3 -m py_compile server.py
python3 tests/check_routes.py
