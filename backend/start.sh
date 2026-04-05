#!/bin/sh
set +e

echo "=== Running Prisma migrations ==="
npx prisma migrate deploy 2>&1
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -ne 0 ]; then
  echo "WARNING: prisma migrate deploy failed (exit $MIGRATE_EXIT). Continuing anyway..."
fi

echo "=== Starting server ==="
exec node dist/index.js
fi

echo "=== Starting server ==="
exec node dist/index.js
