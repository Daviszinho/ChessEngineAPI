#!/usr/bin/env bash

set -euo pipefail

# Usage:
#   ./security/watch-zap-progress.sh [interval_seconds] [stuck_threshold_seconds]
#
# Example:
#   ./security/watch-zap-progress.sh 5 180

INTERVAL="${1:-5}"
STUCK_THRESHOLD="${2:-180}"
SERVICE_NAME="${SERVICE_NAME:-owasp-zap}"
REPORT_DIR="${REPORT_DIR:-security/zap-reports}"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "No se encontró docker compose ni docker-compose."
  exit 1
fi

if ! "${COMPOSE_CMD[@]}" ps >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1; then
    COMPOSE_CMD=(sudo "${COMPOSE_CMD[@]}")
  else
    echo "Sin acceso a Docker y sudo no disponible."
    exit 1
  fi
fi

last_log_size=-1
last_activity_ts=0
last_api_signature=""
current_ts() { date +%s; }

echo "Monitoreando ZAP cada ${INTERVAL}s (stuck>${STUCK_THRESHOLD}s). Ctrl+C para salir."

while true; do
  now="$(current_ts)"
  idle_for=0

  html_count="$(find "${REPORT_DIR}" -maxdepth 1 -type f -name 'report_*.html' 2>/dev/null | wc -l | tr -d ' ')"
  json_count="$(find "${REPORT_DIR}" -maxdepth 1 -type f -name 'report_*.json' 2>/dev/null | wc -l | tr -d ' ')"

  scan_procs="$("${COMPOSE_CMD[@]}" exec -T "${SERVICE_NAME}" sh -lc "ps -eo pid,etime,cmd | grep -E 'zap-baseline.py|zap-full-scan.py|zap-api-scan.py' | grep -v grep || true" 2>/dev/null || true)"
  if [ -n "${scan_procs}" ]; then
    proc_state="RUNNING"
  else
    proc_state="NO_SCAN_PROCESS"
  fi

  spider_json="$(curl -s "http://localhost:8080/JSON/spider/view/status/" 2>/dev/null || true)"
  ascan_json="$(curl -s "http://localhost:8080/JSON/ascan/view/status/" 2>/dev/null || true)"
  ajax_json="$(curl -s "http://localhost:8080/JSON/ajaxSpider/view/status/" 2>/dev/null || true)"
  pscan_json="$(curl -s "http://localhost:8080/JSON/pscan/view/recordsToScan/" 2>/dev/null || true)"

  spider_state="$(echo "${spider_json}" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
  ascan_state="$(echo "${ascan_json}" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
  ajax_state="$(echo "${ajax_json}" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
  pscan_pending="$(echo "${pscan_json}" | sed -n 's/.*"recordsToScan":"\([^"]*\)".*/\1/p')"

  [ -z "${spider_state}" ] && spider_state="unknown"
  [ -z "${ascan_state}" ] && ascan_state="unknown"
  [ -z "${ajax_state}" ] && ajax_state="unknown"
  [ -z "${pscan_pending}" ] && pscan_pending="unknown"

  api_signature="${spider_state}|${ascan_state}|${ajax_state}|${pscan_pending}"
  api_changed="false"
  if [ "${api_signature}" != "${last_api_signature}" ]; then
    api_changed="true"
    last_api_signature="${api_signature}"
    last_activity_ts="${now}"
  fi

  api_active="false"
  if [ "${ajax_state}" = "running" ]; then
    api_active="true"
  fi
  if [[ "${spider_state}" =~ ^[0-9]+$ ]] && [ "${spider_state}" -lt 100 ]; then
    api_active="true"
  fi
  if [[ "${ascan_state}" =~ ^[0-9]+$ ]] && [ "${ascan_state}" -lt 100 ]; then
    api_active="true"
  fi
  if [[ "${pscan_pending}" =~ ^[0-9]+$ ]] && [ "${pscan_pending}" -gt 0 ]; then
    api_active="true"
  fi

  latest_log="$(ls -t "${REPORT_DIR}"/scan_*.log 2>/dev/null | head -1 || true)"
  if [ -n "${latest_log}" ] && [ -f "${latest_log}" ]; then
    log_size="$(stat -c%s "${latest_log}" 2>/dev/null || echo 0)"
    last_line="$(tail -n 1 "${latest_log}" 2>/dev/null || true)"

    if [ "${log_size}" != "${last_log_size}" ]; then
      last_activity_ts="${now}"
      growth_state="LOG_GROWING"
      last_log_size="${log_size}"
    else
      idle_for=$((now - last_activity_ts))
      if [ "${last_activity_ts}" -eq 0 ]; then
        growth_state="LOG_WAITING_FIRST_CHANGE"
      elif [ "${idle_for}" -ge "${STUCK_THRESHOLD}" ]; then
        growth_state="LOG_STUCK_${idle_for}s"
      else
        growth_state="LOG_IDLE_${idle_for}s"
      fi
    fi
  else
    latest_log="(sin log todavía)"
    last_line=""
    growth_state="NO_LOG_FILE_YET"
    idle_for=$((now - last_activity_ts))
  fi

  if [ "${api_active}" = "true" ]; then
    state="ACTIVE"
    reason="ZAP API muestra actividad (spider/ascan/ajax/pscan)."
  elif [ "${proc_state}" = "NO_SCAN_PROCESS" ]; then
    if [ "${json_count:-0}" -gt 0 ] || [ "${html_count:-0}" -gt 0 ]; then
      state="FINISHED"
      reason="No hay proceso de scan y existen reportes."
    else
      state="NO_PROCESS"
      reason="No hay proceso de scan."
    fi
  else
    if [ "${idle_for:-0}" -ge "${STUCK_THRESHOLD}" ]; then
      state="STUCK"
      reason="Proceso vivo sin actividad observable."
    elif [ "${idle_for:-0}" -ge $((STUCK_THRESHOLD / 2)) ]; then
      state="POSSIBLY_STUCK"
      reason="Sin actividad por un periodo largo."
    else
      state="RUNNING_IDLE"
      reason="Proceso vivo; esperando nueva actividad."
    fi
  fi

  printf "\n[%s] %s | %s\n" "$(date '+%H:%M:%S')" "${state}" "${growth_state}"
  printf "  log: %s\n" "${latest_log}"
  [ -n "${last_line}" ] && printf "  last: %s\n" "${last_line}"
  printf "  api: spider=%s ascan=%s ajax=%s pscanPending=%s (changed=%s)\n" "${spider_state}" "${ascan_state}" "${ajax_state}" "${pscan_pending}" "${api_changed}"
  printf "  idle: %ss\n" "${idle_for:-0}"
  printf "  reports: html=%s json=%s\n" "${html_count}" "${json_count}"
  printf "  reason: %s\n" "${reason}"

  if [ -n "${scan_procs}" ]; then
    echo "  procesos:"
    echo "${scan_procs}" | sed 's/^/    /'
  fi

  sleep "${INTERVAL}"
done
