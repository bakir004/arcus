#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[infra] $(date '+%H:%M:%S') $*"
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose --env-file "${ROOT_DIR}/apps/api/.env" -f "${ROOT_DIR}/docker-compose.yml")

if "${COMPOSE[@]}" ps --services --status running minio | grep -qx 'minio'; then
  log "MinIO is already running — skipping startup."
else
  log "MinIO is not running. Starting via docker compose..."
  "${COMPOSE[@]}" up -d minio
fi

log "Waiting for MinIO to accept connections..."
RETRIES=20
for i in $(seq 1 $RETRIES); do
  if "${COMPOSE[@]}" exec -T minio mc ready local >/dev/null 2>&1; then
    "${COMPOSE[@]}" exec -T minio sh -c \
      'mc alias set arcus-local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null && mc mb --ignore-existing arcus-local/arcus >/dev/null'
    log "MinIO is ready and bucket 'arcus' exists.  |  stop: ${COMPOSE[*]} stop minio"
    break
  fi
  log "MinIO not ready yet (attempt ${i}/${RETRIES}) — retrying in 1s..."
  sleep 1
  if [ "$i" -eq "$RETRIES" ]; then
    log "ERROR: MinIO did not become ready in time."
    exit 1
  fi
done
