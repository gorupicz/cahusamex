#!/usr/bin/env bash
# Applies supabase/migrations/*.sql to a throwaway local Postgres and runs supabase/tests.
# Needs initdb, pg_ctl and psql (Postgres 14+). Nothing touches the Supabase project.
#
#   scripts/test-migrations.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
export PGHOST="$TMP" PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres

cleanup() {
  pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

initdb -D "$TMP/data" -U postgres -A trust -E UTF8 --locale=en_US.UTF-8 >/dev/null
pg_ctl -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null

psql -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/tests/supabase_stubs.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "migration: $(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -f "$f"
done
for f in "$ROOT"/supabase/tests/*_test.sql; do
  echo "test: $(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -f "$f"
done
