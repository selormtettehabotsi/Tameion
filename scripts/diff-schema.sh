#!/usr/bin/env bash
# Proves server/src/db/schema.sql and server/migrations/*.js define the same
# schema, by applying each to a scratch database and diffing the live catalogs.
#
# Neither file is treated as the source of truth: any difference is reported and
# the script exits non-zero.
#
# Requires the compose db service to be up. Usage: bash scripts/diff-schema.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SQL_DB=diff_from_sql
MIG_DB=diff_from_migration
PSQL=(docker compose exec -T db psql -U postgres -v ON_ERROR_STOP=1 -q)

echo "==> Rebuilding scratch databases"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS $SQL_DB" >/dev/null
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS $MIG_DB" >/dev/null
"${PSQL[@]}" -d postgres -c "CREATE DATABASE $SQL_DB" >/dev/null
"${PSQL[@]}" -d postgres -c "CREATE DATABASE $MIG_DB" >/dev/null

echo "==> Applying server/src/db/schema.sql to $SQL_DB"
"${PSQL[@]}" -d "$SQL_DB" -f - < server/src/db/schema.sql >/dev/null

echo "==> Running node-pg-migrate into $MIG_DB"
( cd server && DATABASE_URL="postgres://postgres:postgres@localhost:5432/$MIG_DB" \
    npm run --silent migrate:up >/dev/null )

# Columns: name, type, nullability, default. Defaults are normalised because
# node-pg-migrate and raw DDL spell identical defaults differently
# (e.g. nextval quoting, now() vs NOW()).
COLUMN_SQL="
SELECT table_name || '.' || column_name || ' | ' || data_type
       || COALESCE('(' || character_maximum_length || ')', '')
       || ' | null=' || is_nullable
       || ' | default=' || COALESCE(
            regexp_replace(lower(column_default), '[\"'']', '', 'g'), '-')
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name <> 'pgmigrations'
ORDER BY table_name, column_name;"

# Check constraints, excluding the NOT NULL rows Postgres generates internally.
CHECK_SQL="
SELECT rel.relname || ' | ' || regexp_replace(
         lower(pg_get_constraintdef(con.oid)), '[\"'' ]', '', 'g')
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE ns.nspname = 'public' AND con.contype = 'c'
  AND rel.relname <> 'pgmigrations'
ORDER BY 1;"

# Unique / primary key / foreign key constraints.
KEY_SQL="
SELECT rel.relname || ' | ' || con.contype::text || ' | ' || regexp_replace(
         lower(pg_get_constraintdef(con.oid)), '[\"'' ]', '', 'g')
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE ns.nspname = 'public' AND con.contype IN ('p','u','f')
  AND rel.relname <> 'pgmigrations'
ORDER BY 1;"

INDEX_SQL="
SELECT tablename || ' | ' || regexp_replace(lower(indexdef), '[\"'' ]', '', 'g')
FROM pg_indexes
WHERE schemaname = 'public' AND tablename <> 'pgmigrations'
ORDER BY 1;"

status=0
for part in COLUMN CHECK KEY INDEX; do
  case $part in
    COLUMN) q="$COLUMN_SQL" ;;
    CHECK)  q="$CHECK_SQL" ;;
    KEY)    q="$KEY_SQL" ;;
    INDEX)  q="$INDEX_SQL" ;;
  esac
  "${PSQL[@]}" -d "$SQL_DB" -At -c "$q" | sed 's/\r$//' | sort > "/tmp/${part}_sql.txt"
  "${PSQL[@]}" -d "$MIG_DB" -At -c "$q" | sed 's/\r$//' | sort > "/tmp/${part}_mig.txt"

  if diff -u "/tmp/${part}_sql.txt" "/tmp/${part}_mig.txt" > "/tmp/${part}.diff"; then
    echo "OK    $part: identical ($(wc -l < "/tmp/${part}_sql.txt") rows)"
  else
    echo "FAIL  $part differs:"
    sed -n '1,60p' "/tmp/${part}.diff"
    status=1
  fi
done

echo
if [ "$status" -eq 0 ]; then
  echo "RESULT: schema.sql and migrations define an IDENTICAL schema."
else
  echo "RESULT: SCHEMA DRIFT DETECTED (see diffs above)."
fi
exit "$status"
