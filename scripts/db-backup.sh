#!/usr/bin/env bash
# Backs up the cahusa.mx Supabase database (the public schema: tables, data, functions, grants)
# and the photos of the directory-photos bucket into one encrypted archive.
# Run weekly by .github/workflows/db-backup.yml; restore steps in docs/directory-connect.md.
#
# Needs pg_dump, pg_restore and psql 17 (the server's major version), curl and openssl.
#   SUPABASE_DB_URL    session pooler URI: postgresql://postgres.<ref>:<password>@<host>.pooler.supabase.com:5432/postgres
#   BACKUP_PASSPHRASE  encrypts the archive (AES-256-CBC, PBKDF2); the same one decrypts it
#   VERIFY_DB_URL      optional: an empty Postgres 17 to restore the dump into as a check
#   OUT_DIR            where the encrypted archive goes (default ./backup-out)
#
# It prints totals only: the logs of a public repository are public.
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is not set}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"
PUBLIC_STORAGE="${SUPABASE_URL:-https://xfkicfgxznzvuffnufts.supabase.co}/storage/v1/object/public"
BUCKET=directory-photos
OUT_DIR="${OUT_DIR:-$PWD/backup-out}"
NAME="cahusamex-db-$(date -u +%Y-%m-%dT%H%MZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
DIR="$WORK/$NAME"
mkdir -p "$DIR/photos" "$OUT_DIR"

# Exact row counts of every table in public, as "table<TAB>count".
COUNTS_SQL="select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text
from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1"

# 1. The public schema. Supabase's own schemas (auth, storage, ...) come with any new project.
pg_dump "$SUPABASE_DB_URL" --format=custom --schema=public --file="$DIR/public.dump"
psql "$SUPABASE_DB_URL" -X -A -t -F $'\t' -v ON_ERROR_STOP=1 -c "$COUNTS_SQL" > "$DIR/row-counts.tsv"
tables=$(wc -l < "$DIR/row-counts.tsv" | tr -d ' ')
rows=$(awk -F '\t' '{ s += $2 } END { print s + 0 }' "$DIR/row-counts.tsv")
echo "database: $tables tables, $rows rows"

# 2. The photos. The bucket is public, so they download without a key.
psql "$SUPABASE_DB_URL" -X -A -t -v ON_ERROR_STOP=1 \
  -c "select name from storage.objects where bucket_id = '$BUCKET' order by name" > "$DIR/photos.txt"
got=0
missing=0
while IFS= read -r name; do
  [ -n "$name" ] || continue
  mkdir -p "$(dirname "$DIR/photos/$name")"
  if curl -fsS --retry 3 -o "$DIR/photos/$name" "$PUBLIC_STORAGE/$BUCKET/$name"; then
    got=$((got + 1))
  else
    missing=$((missing + 1))
    echo "$name" >> "$DIR/photos-missing.txt"
  fi
done < "$DIR/photos.txt"
echo "photos: $got downloaded, $missing missing"

# 3. Optional check: restore into an empty Postgres and compare row counts.
if [ -n "${VERIFY_DB_URL:-}" ]; then
  # What a Supabase project has that the dump refers to but does not create.
  psql "$VERIFY_DB_URL" -X -q -v ON_ERROR_STOP=1 <<'SQL'
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role', 'supabase_admin'] loop
    if not exists (select from pg_roles where rolname = r) then execute format('create role %I nologin', r); end if;
  end loop;
end $$;
create schema if not exists extensions;
create extension if not exists pgcrypto schema extensions;
create extension if not exists "uuid-ossp" schema extensions;
SQL
  # Older dumps create the public schema themselves; a fresh database already has it.
  if pg_restore --list "$DIR/public.dump" | grep -q ' SCHEMA - public '; then
    psql "$VERIFY_DB_URL" -X -q -v ON_ERROR_STOP=1 -c 'drop schema public cascade'
  fi
  pg_restore --no-owner --exit-on-error --dbname="$VERIFY_DB_URL" "$DIR/public.dump"
  psql "$VERIFY_DB_URL" -X -A -t -F $'\t' -v ON_ERROR_STOP=1 -c "$COUNTS_SQL" > "$WORK/restored-counts.tsv"
  if ! diff -q "$DIR/row-counts.tsv" "$WORK/restored-counts.tsv" > /dev/null; then
    # Rows written between the dump and the count (a sign-in code, a sync) show up here.
    differing=$(diff "$DIR/row-counts.tsv" "$WORK/restored-counts.tsv" | grep -c '^<' || true)
    echo "::warning::restore check: $differing table(s) with a different row count than the live database"
  fi
  restored_tables=$(wc -l < "$WORK/restored-counts.tsv" | tr -d ' ')
  [ "$restored_tables" = "$tables" ] || { echo "restore check failed: $restored_tables of $tables tables" >&2; exit 1; }
  echo "restore check: $restored_tables tables restored"
fi

# 4. One encrypted archive, decrypted again to be sure the passphrase opens it.
tar -C "$WORK" -czf "$WORK/$NAME.tar.gz" "$NAME"
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE \
  -in "$WORK/$NAME.tar.gz" -out "$OUT_DIR/$NAME.tar.gz.enc"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE \
  -in "$OUT_DIR/$NAME.tar.gz.enc" | cmp -s - "$WORK/$NAME.tar.gz"
echo "archive: $NAME.tar.gz.enc ($(du -h "$OUT_DIR/$NAME.tar.gz.enc" | cut -f1))"
[ -z "${GITHUB_OUTPUT:-}" ] || echo "name=$NAME" >> "$GITHUB_OUTPUT"
