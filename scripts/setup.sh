#!/usr/bin/env bash
# One-time developer setup: env files and dependencies for both apps.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Creating .env files from templates (if missing)"
[ -f "$ROOT_DIR/.env" ] || cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
[ -f "$ROOT_DIR/backend/.env" ] || cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"

echo "==> Installing frontend dependencies"
(cd "$ROOT_DIR/frontend" && npm install)

echo "==> Creating backend virtual environment"
if [ ! -d "$ROOT_DIR/backend/.venv" ]; then
  python -m venv "$ROOT_DIR/backend/.venv"
fi

echo "==> Installing backend dependencies"
"$ROOT_DIR/backend/.venv/Scripts/python.exe" -m pip install --upgrade pip -q 2>/dev/null \
  || "$ROOT_DIR/backend/.venv/bin/python" -m pip install --upgrade pip -q
"$ROOT_DIR/backend/.venv/Scripts/python.exe" -m pip install -r "$ROOT_DIR/backend/requirements.txt" 2>/dev/null \
  || "$ROOT_DIR/backend/.venv/bin/python" -m pip install -r "$ROOT_DIR/backend/requirements.txt"

echo "==> Setup complete"
echo "    Start the stack:   scripts/dev.sh"
echo "    Or via Docker:     docker compose up --build"
