# Shopping List App

## Database Migrations

This project uses Drizzle ORM with Cloudflare D1 for database management.

### Generating Migrations

To generate a new migration after changing the schema:

```sh
# From the project root
pnpm run lib:db:generate

# Or if you're in the lib directory
pnpm db:generate
```

This will:

1. Read your schema from `lib/db/schema.ts`
2. Compare it with your current database schema
3. Generate SQL migration files in `lib/db/migrations/`

### Applying Migrations

#### Local Development

To apply migrations to your local development database:

```sh
# Using the npm script (from project root)
pnpm run db:migrate:local

# Or directly with wrangler (specify the config file)
pnpm exec wrangler d1 migrations apply shopping-list --local --config=server/wrangler.json
```

#### Production

To apply migrations to your production D1 database:

```sh
# Using the npm script (from project root)
pnpm run db:migrate:remote

# Or directly with wrangler (specify the config file)
pnpm exec wrangler d1 migrations apply shopping-list --remote --config=server/wrangler.json
```

### Executing SQL Directly

You can run SQL commands directly against your database:

```sh
# Using npm script (from project root)
pnpm run db:execute:local --command="SELECT * FROM grocery_list;"

# Or directly with wrangler (specify the config file)
pnpm exec wrangler d1 execute shopping-list --local --config=server/wrangler.json --command="SELECT * FROM grocery_list;"

# For production database
pnpm run db:execute:remote --command="SELECT * FROM grocery_list;"
```

### Common Issues

- If you get path errors, make sure you're running commands from the correct directory
- For ESM-related errors, check that your `tsconfig.json` has the correct module settings
- For authentication issues with remote commands, ensure you're logged in with `pnpm exec wrangler login`
- Always specify the config file path with `--config=server/wrangler.json` when using Wrangler directly

### Drizzle Studio Local Wrangler fix

`https://kevinkipp.com/blog/going-full-stack-on-astro-with-cloudflare-d1-and-drizzle/`

### Example SQL Commands

Here are some useful SQL commands for local development:

```sh
# Create a new grocery list
pnpm exec wrangler d1 execute shopping-list --local --config=server/wrangler.json --command="INSERT INTO grocery_list (id, name) VALUES ('test-id-1', 'Min Inköpslista');"

# Add an item with discount price
pnpm exec wrangler d1 execute shopping-list --local --config=server/wrangler.json --command="INSERT INTO grocery_list_item (id, name, grocery_list_id, quantity, unit, discount_price) VALUES (lower(hex(randomblob(16))), 'Mjölk', 'test-id-1', 2, 'st', '{\"quantity\": 3, \"price\": 30, \"currency\": \"kr\"}');"

# Reset tables (useful during development)
pnpm exec wrangler d1 execute shopping-list --local --config=server/wrangler.json --command="DROP TABLE IF EXISTS grocery_list_item; DROP TABLE IF EXISTS grocery_list;"
```

Note: After dropping tables, remember to run migrations again with `pnpm run db:migrate:local`
