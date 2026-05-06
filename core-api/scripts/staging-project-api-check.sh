#!/usr/bin/env bash
set -euo pipefail

cd /home/ubuntu/core/core-api

echo "== git status =="
git status --short || true

echo
echo "== node / npm =="
node -v
npm -v

echo
echo "== build backend =="
npm run build

echo
echo "== run migrations =="
npm run migration:run

echo
echo "== restart pm2 app =="
pm2 restart regenx-api --update-env

echo
echo "== pm2 status =="
pm2 status

echo
echo "== hit /api/v1/project =="
curl -i -sS https://staging.api.regenx.io/api/v1/project || true

echo
echo
echo "== hit /api/v1/project/public/45 =="
curl -i -sS https://staging.api.regenx.io/api/v1/project/public/45 || true

echo
echo
echo "== recent pm2 logs =="
pm2 logs regenx-api --lines 120 --nostream || true
