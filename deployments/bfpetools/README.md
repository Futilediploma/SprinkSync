# BFPE Tools Deployment

BFPE Tools is the internal/company deployment of the shared repo.

## Standard Names

| Item | Value |
|---|---|
| Domain | `bfpetools.com` |
| Backend service | `bfpetools-backend` |
| Backend port | `8001` |
| nginx site | `bfpetools.conf` |
| App directory | `/opt/bfpetools` |
| Data directory | `/opt/bfpetools/data` |
| Log directory | `/opt/bfpetools/logs` |
| Optional Docker network | `bfpetools-net` |

## Rules

- Use the shared source code; do not fork or copy app folders.
- Use a BFPE-specific `.env` on the server.
- Use a BFPE-specific database at `/opt/bfpetools/data/`.
- Use BFPE-specific secrets and cookie names.
- Real `.env` files are never committed. Only `*.env.example` files are tracked.
