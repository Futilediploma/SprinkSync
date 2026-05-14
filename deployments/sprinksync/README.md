# SprinkSync Deployment

SprinkSync is the future SaaS/product deployment of the shared repo.

## Standard Names

| Item | Value |
|---|---|
| Domain | `sprinksync.com` |
| Backend service | `sprinksync-backend` |
| Backend port | `8002` |
| nginx site | `sprinksync.conf` |
| App directory | `/opt/sprinksync` |
| Data directory | `/opt/sprinksync/data` |
| Log directory | `/opt/sprinksync/logs` |
| Optional Docker network | `sprinksync-net` |

## Rules

- Use the shared source code; do not fork or copy app folders.
- Use a SprinkSync-specific `.env` on the server.
- Use a SprinkSync-specific database at `/opt/sprinksync/data/`.
- Use SprinkSync-specific secrets and cookie names.
- Real `.env` files are never committed. Only `*.env.example` files are tracked.
