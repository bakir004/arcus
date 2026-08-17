#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[infra] $(date '+%H:%M:%S') $*"
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose -f "${ROOT_DIR}/docker-compose.yml")
PG_CONTAINER="arcus-postgres"

if docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  log "Postgres is already running — skipping startup."
  log "Container: ${PG_CONTAINER}  |  kill: docker kill ${PG_CONTAINER}"
else
  log "Postgres is not running. Starting via docker compose..."
  "${COMPOSE[@]}" up -d postgres

  log "Waiting for Postgres to accept connections..."
  RETRIES=20
  for i in $(seq 1 $RETRIES); do
    if "${COMPOSE[@]}" exec -T postgres pg_isready -q; then
      log "Postgres is ready.  |  kill: docker kill ${PG_CONTAINER}"
      break
    fi
    log "Not ready yet (attempt ${i}/${RETRIES}) — retrying in 1s..."
    sleep 1
    if [ "$i" -eq "$RETRIES" ]; then
      log "ERROR: Postgres did not become ready in time."
      exit 1
    fi
  done
fi
