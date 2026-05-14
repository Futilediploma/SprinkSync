# Database Operations

BFPE Tools and SprinkSync must use separate databases.

## Required Rules

- Never delete or overwrite the current SprinkSync production database.
- Clone the SprinkSync production database into BFPE Tools one time only if needed.
- After cloning, the two database files are independent.
- Do not add sync logic between BFPE Tools and SprinkSync.
- Keep using the `DATABASE_URL` contract so the deployment can move from SQLite to Postgres later without rewriting application code.

## One-Time Clone Flow

1. Stop or quiet writes briefly if needed.
2. Back up the SprinkSync database.
3. Clone SprinkSync DB to the BFPE Tools DB path.
4. Point BFPE Tools backend to the cloned DB.
5. Verify SprinkSync and BFPE Tools use different `DATABASE_URL` values.
6. Create a test record in BFPE Tools and confirm it does not appear in SprinkSync.

Example:

```bash
bash scripts/backup_sqlite_db.sh \
  /opt/sprinksync/data/manpower_forecast.db \
  /opt/sprinksync/backups

bash scripts/clone_sqlite_db.sh \
  /opt/sprinksync/data/manpower_forecast.db \
  /opt/bfpetools/data/manpower_forecast.db
```

## Isolation Check

Confirm these values are different:

```bash
grep DATABASE_URL /opt/bfpetools/.env
grep DATABASE_URL /opt/sprinksync/.env
```
