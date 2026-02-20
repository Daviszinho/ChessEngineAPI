#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./random-engine-load-test.sh [base_url] [requests] [parallel]
#
# Example:
#   ./random-engine-load-test.sh https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io 100 10

BASE_URL="${1:-http://localhost:3000}"
TOTAL_REQUESTS="${2:-100}"
PARALLEL="${3:-1}"
MOVE_ENDPOINT="${BASE_URL%/}/api/move"
ENGINES_ENDPOINT="${BASE_URL%/}/api/engines"

if ! [[ "$TOTAL_REQUESTS" =~ ^[0-9]+$ ]] || [[ "$TOTAL_REQUESTS" -le 0 ]]; then
  echo "Error: requests must be a positive integer."
  exit 1
fi

if ! [[ "$PARALLEL" =~ ^[0-9]+$ ]] || [[ "$PARALLEL" -le 0 ]]; then
  echo "Error: parallel must be a positive integer."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required."
  exit 1
fi

# Extract engine names from /api/engines without requiring jq.
ENGINES_JSON="$(curl -fsS "$ENGINES_ENDPOINT")"
mapfile -t ENGINES < <(printf "%s" "$ENGINES_JSON" | grep -oE '"name":"[^"]+"' | sed -E 's/"name":"([^"]+)"/\1/')

if [[ "${#ENGINES[@]}" -eq 0 ]]; then
  echo "Error: no engines found at $ENGINES_ENDPOINT"
  exit 1
fi

FENS=(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3"
  "r2q1rk1/ppp2ppp/2n2n2/2bp4/3P4/2N1PN2/PPQ2PPP/R1B2RK1 w - - 0 10"
  "2r2rk1/1bqnbppp/p2ppn2/1p6/3NP3/1BN1B3/PPQ2PPP/2RR2K1 w - - 0 14"
  "r1bq1rk1/pp1n1ppp/2pbpn2/3p4/3P4/2N1PN2/PPQ1BPPP/R1B2RK1 w - - 2 9"
)

echo "Base URL: $BASE_URL"
echo "Requests: $TOTAL_REQUESTS"
echo "Parallel: $PARALLEL"
echo "Engines: ${ENGINES[*]}"
echo

RESULTS_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$RESULTS_DIR"
}
trap cleanup EXIT

run_one() {
  local i="$1"
  local engine="$2"
  local fen="$3"
  local level="$4"
  local payload response_file curl_meta http_code total_time body_preview status

  payload="{\"fen\":\"$fen\",\"engine\":\"$engine\",\"level\":$level}"
  response_file="$(mktemp)"
  curl_meta="$(curl -sS -o "$response_file" -w "%{http_code}|%{time_total}" \
    -X POST "$MOVE_ENDPOINT" \
    -H "Content-Type: application/json" \
    --connect-timeout 10 \
    --max-time 40 \
    -d "$payload" || echo "000|timeout")"
  http_code="${curl_meta%%|*}"
  total_time="${curl_meta#*|}"
  body_preview="$(tr -d '\n' < "$response_file" | head -c 180)"
  rm -f "$response_file"

  if [[ "$http_code" == "200" ]]; then
    status="OK"
  else
    status="FAIL"
  fi

  printf "%s|%s|%s|%s|%s|%s|%s\n" "$i" "$status" "$engine" "$level" "$total_time" "$http_code" "$body_preview" > "$RESULTS_DIR/$i"
}

for ((i = 1; i <= TOTAL_REQUESTS; i++)); do
  while [[ "$(jobs -rp | wc -l)" -ge "$PARALLEL" ]]; do
    sleep 0.05
  done

  engine_index=$((RANDOM % ${#ENGINES[@]}))
  fen_index=$((RANDOM % ${#FENS[@]}))
  level=$((1 + RANDOM % 20))
  engine="${ENGINES[$engine_index]}"
  fen="${FENS[$fen_index]}"

  run_one "$i" "$engine" "$fen" "$level" &
done

wait

SUCCESS=0
FAIL=0

for ((i = 1; i <= TOTAL_REQUESTS; i++)); do
  IFS='|' read -r idx status engine level total_time http_code body_preview < "$RESULTS_DIR/$i"
  if [[ "$status" == "OK" ]]; then
    SUCCESS=$((SUCCESS + 1))
    printf "[%03d/%03d] OK   engine=%-10s level=%2d time=%ss\n" "$idx" "$TOTAL_REQUESTS" "$engine" "$level" "$total_time"
  else
    FAIL=$((FAIL + 1))
    printf "[%03d/%03d] FAIL engine=%-10s level=%2d http=%s body=%s\n" "$idx" "$TOTAL_REQUESTS" "$engine" "$level" "$http_code" "$body_preview"
  fi
done

echo
echo "Finished."
echo "Success: $SUCCESS"
echo "Fail:    $FAIL"
