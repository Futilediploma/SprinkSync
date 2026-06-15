#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/SprinkSync}"
FRONTEND_DIR="$REPO_DIR/fieldfab"
BACKEND_DIR="$FRONTEND_DIR/backend"
SERVICE_NAME="${SERVICE_NAME:-fieldfab}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8002}"
WEB_ROOT="${WEB_ROOT:-/var/www/sprinksync.com/fieldfab}"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "Deploying FieldFab from $REPO_DIR"

cd "$REPO_DIR"
git fetch --all --prune

if [[ -n "${DEPLOY_BRANCH:-}" ]]; then
  git checkout "$DEPLOY_BRANCH"
  git pull --ff-only origin "$DEPLOY_BRANCH"
else
  git pull --ff-only
fi

cd "$BACKEND_DIR"
if [[ ! -d venv ]]; then
  echo "Creating backend virtual environment"
  python3 -m venv venv
fi

./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r requirements.txt

cd "$FRONTEND_DIR"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run build

if [[ -d "$WEB_ROOT" ]]; then
  echo "Publishing frontend to $WEB_ROOT"
  if command_exists rsync; then
    sudo rsync -av --delete dist/ "$WEB_ROOT/"
  else
    sudo mkdir -p "$WEB_ROOT"
    sudo find "$WEB_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    sudo cp -R dist/. "$WEB_ROOT/"
  fi
else
  echo "Web root $WEB_ROOT not found; skipping frontend publish."
  echo "Set WEB_ROOT=/path/to/site if nginx serves FieldFab from another folder."
fi

if command_exists systemctl && systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
  echo "Restarting systemd service: $SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl --no-pager --full status "$SERVICE_NAME" || true
else
  echo "No ${SERVICE_NAME}.service found; using nohup fallback"
  if command_exists lsof; then
    pids="$(lsof -ti TCP:"$BACKEND_PORT" -sTCP:LISTEN || true)"
    if [[ -n "$pids" ]]; then
      echo "Stopping existing listener(s) on port $BACKEND_PORT: $pids"
      kill $pids || true
      sleep 1
    fi
  fi
  cd "$BACKEND_DIR"
  nohup ./venv/bin/uvicorn main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" > backend.log 2>&1 &
  sleep 1
  tail -20 backend.log || true
fi

if command_exists systemctl; then
  sudo -n systemctl reload nginx 2>/dev/null || echo "Skipped nginx reload. Run 'sudo systemctl reload nginx' if needed."
fi

echo "FieldFab deploy complete."
