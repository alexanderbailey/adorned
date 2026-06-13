#!/usr/bin/env bash
# Run the billing RPC tests against a throwaway Postgres container.
# Applies _bootstrap.sql -> migrations/0007_billing.sql -> billing_rpcs.test.sql.
# No Supabase stack required; just Docker. Exits non-zero on the first failure.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE="postgres:16"
CONTAINER="adorned-pgtest-$$"

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "Starting $IMAGE ($CONTAINER)…"
docker run -d --rm --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=test "$IMAGE" >/dev/null

# Wait for readiness over TCP. The image runs a temporary init-phase server on
# the unix socket only, so a TCP connect (-h 127.0.0.1) succeeds solely once the
# real server is accepting connections — avoiding the init/restart race.
# (sleep runs inside the container, not the host shell.)
docker exec -e PGPASSWORD=postgres "$CONTAINER" bash -c \
  'for i in $(seq 1 60); do psql -h 127.0.0.1 -U postgres -d test -c "select 1" >/dev/null 2>&1 && exit 0; sleep 0.5; done; exit 1'

psql() { docker exec -e PGPASSWORD=postgres -i "$CONTAINER" psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -U postgres -d test "$@"; }

echo "Applying bootstrap + migrations…"
psql -q < "$DIR/_bootstrap.sql"
psql -q < "$DIR/../migrations/0007_billing.sql"
psql -q < "$DIR/../migrations/0008_checkout_sessions.sql"

echo "Running tests…"
psql < "$DIR/billing_rpcs.test.sql"

echo "OK — billing RPC tests passed."
