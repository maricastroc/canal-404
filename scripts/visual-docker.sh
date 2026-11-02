#!/bin/sh
set -e
IMAGE="mcr.microsoft.com/playwright:v1.64.1-noble"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-update}"
docker run --rm --ipc=host -e MODE="$MODE" -v "$ROOT:/src" -w /work "$IMAGE" sh -c '
  set -e
  tar -C /src --exclude=node_modules --exclude=.next --exclude=test-results --exclude=playwright-report -cf - . | tar -xf -
  npm ci --no-audit --no-fund
  if [ "$MODE" = "check" ]; then
    CI=1 VISUAL=1 npx playwright test --project=visual --reporter=line
  else
    CI=1 VISUAL=1 npx playwright test --project=visual --update-snapshots --reporter=line
    mkdir -p /src/e2e/visual.spec.ts-snapshots
    cp e2e/visual.spec.ts-snapshots/* /src/e2e/visual.spec.ts-snapshots/
  fi
'
