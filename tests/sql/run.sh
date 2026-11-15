#!/usr/bin/env bash
# Database tests: applies the migrations on top of a small Supabase stand-in and
# runs the row-level-security / RPC scenarios as different users.
#
#   tests/sql/run.sh            uses the Postgres that PGHOST/PGPORT/PGUSER/PGPASSWORD
#                               point to (CI: a postgres:16 service container)
#   tests/sql/run.sh --local    starts a throwaway Postgres 16 cluster with the
#                               binaries in /usr/lib/postgresql/16/bin (needs root)
#
# Every run works in a fresh database and drops it afterwards. Idempotency is part of
# the contract: three of the migration files are applied a second time on purpose.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
PROJECT=$(cd "$HERE/../.." && pwd)
MIGRATIONS="$PROJECT/supabase/migrations"

LOCAL=0
[ "${1:-}" = "--local" ] && LOCAL=1
if [ "$LOCAL" = 1 ]; then
  BIN=/usr/lib/postgresql/16/bin
  DATA=/var/lib/postgresql/hv-test
  SOCK=/var/lib/postgresql/hv-sock
  export PGHOST=$SOCK PGPORT=54329 PGUSER=postgres
  su postgres -s /bin/bash -c "$BIN/pg_ctl -D $DATA stop -m immediate" >/dev/null 2>&1 || true
  rm -rf "$DATA" "$SOCK"
  su postgres -s /bin/bash -c "mkdir -p $SOCK && $BIN/initdb -D $DATA --auth=trust -U postgres -E UTF8 --locale=C.UTF-8" >/dev/null
  su postgres -s /bin/bash -c "$BIN/pg_ctl -D $DATA -l $DATA/log -o \"-k $SOCK -p $PGPORT -c listen_addresses=''\" -w start" >/dev/null
  trap 'su postgres -s /bin/bash -c "$BIN/pg_ctl -D $DATA stop -m fast" >/dev/null' EXIT
fi

DB="hv_test_$(date +%s)_$RANDOM"
psql -d postgres -v ON_ERROR_STOP=1 -q -c "create database $DB"
if [ "$LOCAL" = 0 ]; then trap 'psql -d postgres -q -c "drop database if exists $DB"' EXIT; fi
PSQL=(psql -d "$DB" -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f "$HERE/00_supabase_stub.sql"
for f in "$MIGRATIONS"/*.sql; do
  echo "applying $(basename "$f")"
  # The Supabase SQL editor runs a pasted file as one transaction; do the same here.
  "${PSQL[@]}" -1 -f "$f"
done
# The question-pool file must not duplicate questions when run twice (the scenarios count them).
echo "re-applying 20261110090000_more_questions.sql"
"${PSQL[@]}" -1 -f "$MIGRATIONS/20261110090000_more_questions.sql"

status=0
set +e
for t in "$HERE"/[1-9]*.sql; do
  echo "── $(basename "$t")"
  "${PSQL[@]}" -f "$t" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: NOTICE:  /  /'
  [ "${PIPESTATUS[0]}" -ne 0 ] && status=1
done
# Re-running the comments file with comments present must keep every comment and question.
COUNTS="select (select count(*) from public.comments) || '/' || (select count(*) from public.question_bank)"
before=$("${PSQL[@]}" -tAc "$COUNTS")
"${PSQL[@]}" -1 -f "$MIGRATIONS/20261112090000_comments_and_questions.sql"
after=$("${PSQL[@]}" -tAc "$COUNTS")
if [ "${before%%/*}" -gt 0 ] && [ "$before" = "$after" ]; then
  echo "  ok  re-running the comments+questions SQL keeps comments/questions at $after"
else
  echo "  FAIL comments/questions before/after re-run: $before / $after"; status=1
fi
"${PSQL[@]}" -1 -f "$MIGRATIONS/20261113090000_editors_see_drafts.sql" && echo "  ok  re-running the drafts SQL works" || { echo "  FAIL re-running the drafts SQL"; status=1; }
set -e

if [ "$status" = 0 ]; then echo "SQL tests passed"; else echo "SQL tests FAILED"; fi
exit "$status"
