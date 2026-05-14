# Deployment Architecture

This repo stays as one shared codebase for two isolated deployments:

- BFPE Tools: internal company operations at `bfpetools.com`
- SprinkSync: future SaaS/product direction at `sprinksync.com`

Do not create a second repo, duplicate app source, add tenant tables, or introduce SaaS multi-tenancy for this phase.

## Standard Deployment Names

| Item | BFPE Tools | SprinkSync |
|---|---|---|
| Domain | `bfpetools.com` | `sprinksync.com` |
| systemd backend service | `bfpetools-backend` | `sprinksync-backend` |
| Backend port | `8001` | `8002` |
| nginx site config | `bfpetools.conf` | `sprinksync.conf` |
| App directory | `/opt/bfpetools` | `/opt/sprinksync` |
| Data directory | `/opt/bfpetools/data` | `/opt/sprinksync/data` |
| Log directory | `/opt/bfpetools/logs` | `/opt/sprinksync/logs` |
| Optional Docker network | `bfpetools-net` | `sprinksync-net` |

## Routing

New deployments should set:

```env
VITE_API_BASE_URL=/api
```

The reverse proxy should route `/api` to the deployment's backend service. Keep app source shared; let deployment config decide where requests go.

## Secrets And Env Files

Real `.env` files are never committed. Only `*.env.example` files are tracked.

Each deployment must use separate values for:

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `SESSION_SECRET`
- `COOKIE_NAME`
- provider/API tokens
- `DATABASE_URL`

Before committing, check for accidentally staged secrets:

```bash
git status --short
git diff --cached --name-only
```

## Compatibility Rule

Use config-driven defaults and preserve current behavior when env values are missing. This keeps the current production deployment stable while adding BFPE Tools/SprinkSync separation.

## Hardcoded Value Review

Some old values remain as compatibility defaults, not fixed deployment behavior:

- `EXPORT_COMPANY_NAME` defaults to `BFPE International` until each deployment overrides it.
- `VITE_AUTH_STORAGE_KEY` defaults to `sprinksync_token` until each deployment overrides it.
- Existing Vite public path behavior remains in place until reverse proxy routing is updated.

When a value affects branding, auth isolation, domains, email, ports, logs, or database paths, prefer deployment env config instead of editing source per website.
