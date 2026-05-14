# Future Postgres Migration

Postgres is a future deployment change, not a reason to introduce SaaS multi-tenancy now.

## Migration Direction

- Keep application code using `DATABASE_URL`.
- Create separate Postgres databases for BFPE Tools and SprinkSync.
- Migrate each deployment independently.
- Keep secrets, logs, services, and cookie names separate.
- Do not introduce tenant tables or org/account abstractions until SprinkSync has a real SaaS requirement.

Example future values:

```env
DATABASE_URL=postgresql://bfpetools_user:<password>@localhost:5432/bfpetools
DATABASE_URL=postgresql://sprinksync_user:<password>@localhost:5432/sprinksync
```

The deployment should change config and run migrations; app features should not need to know which database engine is behind `DATABASE_URL`.
