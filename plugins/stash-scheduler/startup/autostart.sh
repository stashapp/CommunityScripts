#!/usr/bin/env bash
# autostart.sh — Start the Stash Scheduler plugin task whenever Stash starts.
#
# Designed to run as a long-lived service (Type=simple) managed by systemd,
# with BindsTo=stash.service so it restarts every time Stash restarts.
# Also works as a one-shot script for cron @reboot and Docker entrypoints.
#
# Usage:
#   ./autostart.sh [STASH_URL] [API_KEY]
#
# Examples:
#   ./autostart.sh
#   ./autostart.sh http://localhost:9999
#   ./autostart.sh http://localhost:9999 your-api-key-here

set -euo pipefail

STASH_URL="${1:-${STASH_URL:-http://localhost:9999}}"
API_KEY="${2:-${STASH_API_KEY:-}}"
MAX_WAIT=180    # seconds to wait for Stash to become reachable
INTERVAL=5      # polling interval in seconds

GRAPHQL_ENDPOINT="${STASH_URL}/graphql"
HEALTH_ENDPOINT="${STASH_URL}/healthz"

log() { echo "[Stash Scheduler autostart] $*"; }

# Build auth args for curl (empty when no API key is set)
curl_auth_args() {
  if [ -n "$API_KEY" ]; then
    echo "-H" "ApiKey: ${API_KEY}"
  fi
}

# GraphQL mutation to trigger the Start Scheduler plugin task
RUN_TASK_QUERY='{"query":"mutation { runPluginTask(plugin_id: \"stash-scheduler\", task_name: \"Start Scheduler\") }"}'

log "Waiting for Stash to become available at ${STASH_URL}…"

elapsed=0
while true; do
  # Try the health endpoint first, fall back to a lightweight GraphQL ping
  if curl -sf --max-time 5 $(curl_auth_args) "${HEALTH_ENDPOINT}" > /dev/null 2>&1 || \
     curl -sf --max-time 5 $(curl_auth_args) \
       -H "Content-Type: application/json" \
       -d '{"query":"{version{version}}"}' \
       "${GRAPHQL_ENDPOINT}" > /dev/null 2>&1; then
    log "Stash is reachable."
    break
  fi

  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    log "ERROR: Stash did not become available within ${MAX_WAIT}s. Aborting." >&2
    exit 1
  fi

  log "Not ready yet, retrying in ${INTERVAL}s… (${elapsed}s elapsed)"
  sleep "$INTERVAL"
  elapsed=$((elapsed + INTERVAL))
done

# Brief pause to let Stash finish loading plugins after HTTP is up
sleep 5

log "Starting 'Start Scheduler' plugin task via Stash API…"
RESPONSE=$(curl -sf --max-time 30 \
  $(curl_auth_args) \
  -H "Content-Type: application/json" \
  -d "$RUN_TASK_QUERY" \
  "$GRAPHQL_ENDPOINT")

if echo "$RESPONSE" | grep -q '"errors"'; then
  log "GraphQL errors returned by Stash:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

log "Scheduler task started successfully."

# When managed by systemd (Type=simple + BindsTo=stash.service), staying alive
# here keeps the unit "active" for the duration of the Stash session.
# When run as a one-shot script (cron, Docker), exit immediately is fine.
if [ -n "${INVOCATION_ID:-}" ]; then
  # We're running under systemd — sleep until Stash (and therefore this
  # unit) is stopped by the BindsTo relationship.
  log "Running under systemd — sleeping until Stash stops."
  exec sleep infinity
fi
