#!/bin/sh
set +e

echo "=== Running Prisma migrations ==="
npx prisma migrate deploy 2>&1
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -ne 0 ]; then
  echo "WARNING: prisma migrate deploy failed (exit $MIGRATE_EXIT)"
  echo "Ensuring critical tables exist via raw SQL..."
  node -e "
    const { Client } = require('pg');
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    c.connect()
      .then(() => c.query(\`
        CREATE TABLE IF NOT EXISTS \"post_media\" (
          \"id\" TEXT NOT NULL,
          \"url\" TEXT NOT NULL,
          \"type\" TEXT NOT NULL,
          \"filename\" TEXT NOT NULL,
          \"size\" INTEGER NOT NULL,
          \"postId\" TEXT NOT NULL,
          \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \"post_media_pkey\" PRIMARY KEY (\"id\"),
          CONSTRAINT \"post_media_postId_fkey\" FOREIGN KEY (\"postId\") REFERENCES \"posts\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE
        )
      \`))
      .then(() => { console.log('post_media table ensured'); return c.end(); })
      .catch(e => { console.error('Raw SQL fallback failed:', e.message); return c.end(); });
  "
fi

echo "=== Starting server ==="
exec node dist/index.js
