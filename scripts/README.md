# Operational Scripts

These scripts are intentionally small and explicit. They are for operational safety, not application runtime behavior.

## Backup SQLite

```bash
bash scripts/backup_sqlite_db.sh /opt/sprinksync/data/manpower_forecast.db /opt/sprinksync/backups
```

## Clone SQLite Once

```bash
bash scripts/clone_sqlite_db.sh \
  /opt/sprinksync/data/manpower_forecast.db \
  /opt/bfpetools/data/manpower_forecast.db
```

If the destination already exists, the script backs it up and refuses to replace it unless `--overwrite` is passed.

```bash
bash scripts/clone_sqlite_db.sh \
  /opt/sprinksync/data/manpower_forecast.db \
  /opt/bfpetools/data/manpower_forecast.db \
  --overwrite
```

After cloning, there is no sync logic. Each deployment must point at its own `DATABASE_URL`.
