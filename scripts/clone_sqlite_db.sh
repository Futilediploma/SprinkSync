#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: clone_sqlite_db.sh <source-db-path> <destination-db-path> [--overwrite]

Copies a SQLite database one time from one deployment to another.
If destination exists without --overwrite, the script creates a timestamped backup and exits without replacing it.
EOF
}

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  usage
  exit 2
fi

SOURCE_DB="$1"
DEST_DB="$2"
OVERWRITE="${3:-}"

if [ "$OVERWRITE" != "" ] && [ "$OVERWRITE" != "--overwrite" ]; then
  usage
  exit 2
fi

if [ ! -f "$SOURCE_DB" ]; then
  echo "Source database does not exist: $SOURCE_DB" >&2
  exit 1
fi

DEST_DIR="$(dirname "$DEST_DB")"
mkdir -p "$DEST_DIR"

echo "Source:      $SOURCE_DB"
echo "Destination: $DEST_DB"

if [ -f "$DEST_DB" ]; then
  STAMP="$(date +%Y%m%d_%H%M%S)"
  BACKUP_PATH="$DEST_DB.$STAMP.bak"
  echo "Destination exists. Backing it up to: $BACKUP_PATH"
  cp -p "$DEST_DB" "$BACKUP_PATH"

  if [ "$OVERWRITE" != "--overwrite" ]; then
    echo "Destination was not replaced. Re-run with --overwrite to clone over it." >&2
    exit 1
  fi
fi

cp -p "$SOURCE_DB" "$DEST_DB"
echo "Clone complete. The source and destination databases are now independent files."
