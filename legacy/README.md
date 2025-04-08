# Shopping List

## Database

### Drizzle

```sh
# Generate a migraion file
bun run db:generate
```

### Cloudflare D1 Database

```sh
# Create a new D1 database
bunx wrangler d1 create shopping-list

# Migrate Local D1 Database
bun run d1:local:migrate -- --file=./drizzle/migrations/<migration_filename>.sql

# Migrate Remote D1 Database
bun run d1:remote:migrate -- --file=./drizzle/migrations/<migration_filename>.sql

# Execute Local D1 Database
bun run d1:local:execute -- <args>

# Execute Remote D1 Database
bun run d1:remote:execute -- <args>
```

## Install

```sh
bun install
```

## Developing

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

To create a production version of your app:

```sh
bun run build
```

You can preview the production build with `bun run preview`.
