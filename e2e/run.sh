#!/usr/bin/env bash
# End-to-end run: test database, real Laboratory backend, production build of the
# interface, then Playwright. The Administration module and vms_projects are
# answered by the tests (session and project list only); everything the
# Laboratory stores goes through its backend and PostgreSQL.
# Extra arguments go to "playwright test" (e.g. --headed, a test file).
set -euo pipefail

E2E_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONT_DIR="$(dirname "$E2E_DIR")"
cd "$E2E_DIR"

setting() { node -p "require('$E2E_DIR/support/env').$1"; }
BACKEND_DIR="$(setting BACKEND_DIR)"
WORK_DIR="$(setting WORK_DIR)"

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

echo "== Test database"
(cd "$BACKEND_DIR" && npm run -s db:test:up)

echo "== Keys, session token and platform data"
node support/token.js
node support/seed.js

echo "== Backend build and migrations"
(cd "$BACKEND_DIR" && npm run -s build)
(
  cd "$BACKEND_DIR"
  NODE_ENV=test DB_HOST="$(setting DB.host)" DB_PORT="$(setting DB.port)" DB_DATABASE="$(setting DB.database)" \
  DB_USER="$(setting DB.user)" DB_PASSWORD="$(setting DB.password)" DB_SCHEMA="$(setting DB.schema)" DB_SSL=false \
    node dist/DataProviders/dataBase/migrate.js
)

echo "== Interface build"
(
  cd "$FRONT_DIR"
  BUILD_PATH="$(setting FRONT_BUILD_DIR)" \
  REACT_APP_URLBACKENDLABORATORY="http://127.0.0.1:$(setting BACKEND_PORT)" \
  REACT_APP_VARIAMOS_ADMIN_API_URL="$(setting ADMIN_URL)" \
  REACT_APP_URLVMSPROJECTS="$(setting PROJECTS_URL)" \
  REACT_APP_VARIAMOS_LOGIN_URL="$(setting ADMIN_URL)/login" \
  GENERATE_SOURCEMAP=false CI=false \
    npx react-scripts build > "$WORK_DIR/front-build.log" 2>&1 || { tail -40 "$WORK_DIR/front-build.log"; exit 1; }
)

echo "== Playwright"
npx playwright test "$@"
