#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <source-db-path> <backup-directory>" >&2
}

if [ "$#" -ne 2 ]; then
  usage
  exit 2
fi

SOURCE_DB="$1"
BACKUP_DIR="$2"

if [ ! -f "$SOURCE_DB" ]; then
  echo "Source database does not exist: $SOURCE_DB" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

BASE_NAME="$(basename "$SOURCE_DB")"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/${BASE_NAME}.${STAMP}.bak"

echo "Source: $SOURCE_DB"
echo "Backup: $BACKUP_PATH"

cp -p "$SOURCE_DB" "$BACKUP_PATH"
echo "Backup complete."
