#!/bin/bash

###############################################
# OWASP ZAP Local Security Scanner
# 
# Ejecuta un escaneo de seguridad completo
# de forma local usando Docker Compose
#
# Uso: ./security/scan-locally.sh [opción]
# Opciones:
#   baseline   - Escaneo rápido (por defecto)
#   full       - Escaneo completo (más lento)
#   quick      - Escaneo muy rápido
###############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
# API_HEALTH_URL is checked from host; SCAN_TARGET_URL is scanned from inside ZAP container.
API_HEALTH_URL="${API_HEALTH_URL:-http://localhost:3000}"
SCAN_TARGET_URL="${SCAN_TARGET_URL:-http://chess-engine-api:3000}"
# Service name in docker-compose.yml
ZAP_CONTAINER="owasp-zap"
ZAP_CONTAINER_NAME="owasp-zap-scanner"
API_CONTAINER="chess-engine-api"
REPORT_DIR="./security/zap-reports"
SCAN_TYPE="${1:-baseline}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DOCKER_CMD="docker"
SCAN_TIMEOUT_SECONDS="${SCAN_TIMEOUT_SECONDS:-300}"
BASELINE_SPIDER_MINS="${BASELINE_SPIDER_MINS:-1}"
BASELINE_PASSIVE_MAX_MINS="${BASELINE_PASSIVE_MAX_MINS:-1}"
ENABLE_ACTIVE_SCAN="${ENABLE_ACTIVE_SCAN:-false}"
ZAP_SCRIPT_PORT="${ZAP_SCRIPT_PORT:-8090}"
FORCE_REBUILD_API="${FORCE_REBUILD_API:-true}"
API_CORS_CHECK_URL="${API_CORS_CHECK_URL:-http://chess-engine-api:3000/api/health}"

# Ensure report directory exists
mkdir -p "${REPORT_DIR}"

# Function to print colored output
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
}

print_status() {
    echo -e "${CYAN}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

run_zap_scan() {
    local log_file="$1"
    shift
    local zap_tool="$1"
    shift
    local scan_pid=0
    local scan_exit=0
    local start_ts=0
    local elapsed=0
    local log_size=0

    set +e
    start_ts=$(date +%s)
    if command -v timeout >/dev/null 2>&1; then
        timeout --signal=INT --kill-after=30s "${SCAN_TIMEOUT_SECONDS}" \
            ${DOCKER_COMPOSE_CMD} run --rm -T --no-deps --entrypoint "${zap_tool}" ${ZAP_CONTAINER} "$@" \
            > >(tee "${log_file}") 2>&1 &
    else
        ${DOCKER_COMPOSE_CMD} run --rm -T --no-deps --entrypoint "${zap_tool}" ${ZAP_CONTAINER} "$@" \
            > >(tee "${log_file}") 2>&1 &
    fi
    scan_pid=$!

    while kill -0 "${scan_pid}" >/dev/null 2>&1; do
        sleep 10
        if kill -0 "${scan_pid}" >/dev/null 2>&1; then
            elapsed=$(( $(date +%s) - start_ts ))
            log_size=$(stat -c%s "${log_file}" 2>/dev/null || echo 0)
            print_status "Scan en progreso (${elapsed}s, log=${log_size} bytes)..."
        fi
    done

    wait "${scan_pid}"
    scan_exit=$?
    set -e

    if [ "${scan_exit}" -eq 124 ] || [ "${scan_exit}" -eq 137 ]; then
        print_error "Timeout: scan abortado tras ${SCAN_TIMEOUT_SECONDS}s"
        return 124
    fi

    if [ "${scan_exit}" -eq 130 ]; then
        print_warning "Escaneo interrumpido por usuario (Ctrl+C)"
        return 130
    fi

    if [ "${scan_exit}" -eq 1 ] || [ "${scan_exit}" -eq 2 ]; then
        print_warning "ZAP finalizó con alertas (código ${scan_exit})"
        return "${scan_exit}"
    fi

    if [ "${scan_exit}" -ne 0 ]; then
        print_error "El comando de ZAP terminó con código ${scan_exit}"
        return "${scan_exit}"
    fi

    return 0
}

check_scan_target_from_zap() {
    print_status "Validando target desde ZAP: ${SCAN_TARGET_URL}"
    if ${DOCKER_COMPOSE_CMD} exec -T ${ZAP_CONTAINER} sh -c 'curl -sS -m 10 -o /dev/null "$1"' _ "${SCAN_TARGET_URL}"; then
        print_success "Target accesible desde ZAP"
        return 0
    fi

    print_error "ZAP no puede acceder al target: ${SCAN_TARGET_URL}"
    return 1
}

check_cors_policy() {
    print_status "Validando CORS para origen no confiable..."
    local cors_header
    cors_header=$(${DOCKER_COMPOSE_CMD} exec -T ${ZAP_CONTAINER} sh -c 'curl -sSI -H "Origin: https://evil.example" "$1" | tr -d "\r" | awk -F": " '\''tolower($1)=="access-control-allow-origin"{print $2}'\'' | tail -1' _ "${API_CORS_CHECK_URL}" 2>/dev/null || true)

    if [ "${cors_header}" = "*" ]; then
        print_error "CORS inseguro detectado: Access-Control-Allow-Origin: *"
        return 1
    fi

    if [ -n "${cors_header}" ]; then
        print_success "CORS restringido (Allow-Origin: ${cors_header})"
    else
        print_success "CORS restringido (sin header para origen no confiable)"
    fi
}

# Check if Docker and Docker Compose are available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose no está instalado"
        exit 1
    fi

    print_success "Docker y Docker Compose están disponibles"
    # Prefer 'docker compose' if available
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        print_error "ni 'docker compose' ni 'docker-compose' están disponibles"
        return 1
    fi

    # Validate Docker access without leaving the process blocked on password prompts.
    if ! ${DOCKER_COMPOSE_CMD} ps >/dev/null 2>&1; then
        if command -v sudo >/dev/null 2>&1 && sudo -n ${DOCKER_COMPOSE_CMD} ps >/dev/null 2>&1; then
            DOCKER_COMPOSE_CMD="sudo ${DOCKER_COMPOSE_CMD}"
            DOCKER_CMD="sudo docker"
            print_warning "Usando sudo para comandos Docker (modo no interactivo)"
        else
            print_error "Sin acceso a Docker (socket). Ejecuta: sudo usermod -aG docker $USER && newgrp docker"
            print_error "O vuelve a correr este script con permisos adecuados"
            return 1
        fi
    fi
}

# Start containers
start_containers() {
    print_header "Iniciando contenedores"
    
    if [ "${FORCE_REBUILD_API}" = "true" ]; then
        print_status "Iniciando Chess Engine API (rebuild forzado)..."
        ${DOCKER_COMPOSE_CMD} up -d --build --force-recreate ${API_CONTAINER}
    else
        print_status "Iniciando Chess Engine API..."
        ${DOCKER_COMPOSE_CMD} up -d ${API_CONTAINER}
    fi
    
    print_status "Iniciando OWASP ZAP..."
    ${DOCKER_COMPOSE_CMD} up -d ${ZAP_CONTAINER}
    
    print_status "Esperando a que los servicios se inicien..."
    sleep 5
}

# Wait for API to be healthy
wait_for_api() {
    print_status "Esperando que la API esté lista..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "${API_HEALTH_URL}/api/health" > /dev/null 2>&1; then
            print_success "API está lista"
            return 0
        fi
        
        print_status "Intento $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    print_error "La API no respondió en tiempo"
    return 1
}

# Wait for ZAP to be ready
wait_for_zap() {
    print_status "Esperando que OWASP ZAP esté listo..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
            # Prefer checking ZAP via host port (avoids requiring curl inside container)
            if curl -s http://localhost:8080/JSON/core/view/version/ > /dev/null 2>&1; then
                print_success "OWASP ZAP está listo (host reachable)"
                return 0
            fi
            # Fallback: try executing curl inside the container (if available)
            if ${DOCKER_COMPOSE_CMD} exec -T ${ZAP_CONTAINER} sh -c 'command -v curl >/dev/null 2>&1 && curl -s http://localhost:8080/JSON/core/view/version/' > /dev/null 2>&1; then
            print_success "OWASP ZAP está listo"
            return 0
        fi
        
        print_status "Intento $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    print_error "OWASP ZAP no respondió en tiempo"
    return 1
}

# Run baseline scan
run_baseline_scan() {
    local html_report_host="${REPORT_DIR}/report_baseline_${TIMESTAMP}.html"
    local json_report_host="${REPORT_DIR}/report_baseline_${TIMESTAMP}.json"
    local container_report_dir="/zap/reports"
    local html_report_container="${container_report_dir}/report_baseline_${TIMESTAMP}.html"
    local json_report_container="${container_report_dir}/report_baseline_${TIMESTAMP}.json"
    
    print_header "Ejecutando escaneo BASELINE"
    
    print_status "Escaneo rápido con reglas pasivas y activas básicas"
    print_status "Objetivo: ${SCAN_TARGET_URL}"
    print_status "Timeout: ${SCAN_TIMEOUT_SECONDS}s | Spider: ${BASELINE_SPIDER_MINS} min | Passive max: ${BASELINE_PASSIVE_MAX_MINS} min"
    print_status "Active scan: ${ENABLE_ACTIVE_SCAN}"
    print_status "Puerto interno scripts ZAP: ${ZAP_SCRIPT_PORT}"
    
    # Ensure host report dir exists
    mkdir -p "${REPORT_DIR}"
    local baseline_args=(
        zap-baseline.py
        -t "${SCAN_TARGET_URL}"
        -P "${ZAP_SCRIPT_PORT}"
        -m "${BASELINE_SPIDER_MINS}"
        -T "${BASELINE_PASSIVE_MAX_MINS}"
        -r "${html_report_container}"
        -J "${json_report_container}"
        --autooff
    )
    if [ "${ENABLE_ACTIVE_SCAN}" = "true" ]; then
        baseline_args+=(-a)
    fi

    run_zap_scan "${REPORT_DIR}/scan_baseline_${TIMESTAMP}.log" "${baseline_args[@]}"
    local scan_exit=$?
    if [ "${scan_exit}" -ne 0 ]; then
        if [ "${scan_exit}" -eq 124 ] || [ "${scan_exit}" -eq 130 ]; then
            return "${scan_exit}"
        fi
        if [ "${scan_exit}" -eq 1 ] || [ "${scan_exit}" -eq 2 ]; then
            print_warning "Scan baseline completado con alertas ZAP (código ${scan_exit})"
        else
            print_error "El comando de scan terminó con código ${scan_exit}"
            return "${scan_exit}"
        fi
    fi

    echo ""
    print_success "Reporte generado: ${html_report_host##*/}"

    # Try to ensure the JSON is visible on the host by copying from the container
    # (some ZAP automation variants write to different internal paths)
    if ${DOCKER_CMD} ps --format '{{.Names}}' | grep -q "^${ZAP_CONTAINER_NAME}$"; then
        ${DOCKER_CMD} cp ${ZAP_CONTAINER_NAME}:${json_report_container} "${json_report_host}" >/dev/null 2>&1 || true
    fi

    # Save latest report path for verification (host path)
    echo "${json_report_host}" > "${REPORT_DIR}/report_latest.json"
}

# Run full scan
run_full_scan() {
    local html_report="${REPORT_DIR}/report_full_${TIMESTAMP}.html"
    local json_report="${REPORT_DIR}/report_full_${TIMESTAMP}.json"
    
    local container_report_dir="/zap/reports"
    local html_report_container="${container_report_dir}/report_full_${TIMESTAMP}.html"
    local json_report_container="${container_report_dir}/report_full_${TIMESTAMP}.json"
    
    print_header "Ejecutando escaneo COMPLETO"
    
    print_warning "Este escaneo puede tomar varios minutos..."
    print_status "Timeout: ${SCAN_TIMEOUT_SECONDS}s"
    print_status "Puerto interno scripts ZAP: ${ZAP_SCRIPT_PORT}"
    
    run_zap_scan "${REPORT_DIR}/scan_full_${TIMESTAMP}.log" \
        zap-full-scan.py \
        -t "${SCAN_TARGET_URL}" \
        -P "${ZAP_SCRIPT_PORT}" \
        -r "${html_report_container}" \
        -J "${json_report_container}" \
        -a --autooff
    local scan_exit=$?
    if [ "${scan_exit}" -ne 0 ]; then
        if [ "${scan_exit}" -eq 124 ] || [ "${scan_exit}" -eq 130 ]; then
            return "${scan_exit}"
        fi
        if [ "${scan_exit}" -eq 1 ] || [ "${scan_exit}" -eq 2 ]; then
            print_warning "Scan full completado con alertas ZAP (código ${scan_exit})"
        else
            print_error "El comando de scan terminó con código ${scan_exit}"
            return "${scan_exit}"
        fi
    fi
    
    echo ""
    print_success "Reporte generado: ${html_report_container##*/}"
    
    # Attempt to copy the JSON result to the host
    if ${DOCKER_CMD} ps --format '{{.Names}}' | grep -q "^${ZAP_CONTAINER_NAME}$"; then
        ${DOCKER_CMD} cp ${ZAP_CONTAINER_NAME}:${json_report_container} "${json_report}" >/dev/null 2>&1 || true
    fi

    echo "${json_report}" > "${REPORT_DIR}/report_latest.json"
}

# Run quick scan
run_quick_scan() {
    local html_report_host="${REPORT_DIR}/report_quick_${TIMESTAMP}.html"
    local json_report_host="${REPORT_DIR}/report_quick_${TIMESTAMP}.json"
    local container_report_dir="/zap/reports"
    local html_report_container="${container_report_dir}/report_quick_${TIMESTAMP}.html"
    local json_report_container="${container_report_dir}/report_quick_${TIMESTAMP}.json"
    
    print_header "Ejecutando escaneo RÁPIDO"
    print_status "Timeout: ${SCAN_TIMEOUT_SECONDS}s | Spider: ${BASELINE_SPIDER_MINS} min | Passive max: ${BASELINE_PASSIVE_MAX_MINS} min"
    print_status "Active scan: ${ENABLE_ACTIVE_SCAN}"
    print_status "Puerto interno scripts ZAP: ${ZAP_SCRIPT_PORT}"
    
    local quick_args=(
        zap-baseline.py
        -t "${SCAN_TARGET_URL}"
        -P "${ZAP_SCRIPT_PORT}"
        -m "${BASELINE_SPIDER_MINS}"
        -T "${BASELINE_PASSIVE_MAX_MINS}"
        -r "${html_report_container}"
        -J "${json_report_container}"
        --autooff
    )
    if [ "${ENABLE_ACTIVE_SCAN}" = "true" ]; then
        quick_args+=(-a)
    fi

    run_zap_scan "${REPORT_DIR}/scan_quick_${TIMESTAMP}.log" "${quick_args[@]}"
    local scan_exit=$?
    if [ "${scan_exit}" -ne 0 ]; then
        if [ "${scan_exit}" -eq 124 ] || [ "${scan_exit}" -eq 130 ]; then
            return "${scan_exit}"
        fi
        if [ "${scan_exit}" -eq 1 ] || [ "${scan_exit}" -eq 2 ]; then
            print_warning "Scan quick completado con alertas ZAP (código ${scan_exit})"
        else
            print_error "El comando de scan terminó con código ${scan_exit}"
            return "${scan_exit}"
        fi
    fi

    echo ""
    print_success "Reporte generado: ${html_report_host##*/}"

    # Try copying JSON from container to host
    if ${DOCKER_CMD} ps --format '{{.Names}}' | grep -q "^${ZAP_CONTAINER_NAME}$"; then
        ${DOCKER_CMD} cp ${ZAP_CONTAINER_NAME}:${json_report_container} "${json_report_host}" >/dev/null 2>&1 || true
    fi

    echo "${json_report_host}" > "${REPORT_DIR}/report_latest.json"
}

# Verify vulnerabilities
verify_vulnerabilities() {
    print_header "Verificando vulnerabilidades"
    
    if [ ! -f "${REPORT_DIR}/report_latest.json" ]; then
        print_error "No se encontró reporte"
        return 1
    fi
    
    local report_path=$(cat "${REPORT_DIR}/report_latest.json")
    # Wait for the report file to exist (ZAP may write it shortly after the command returns)
    local wait_seconds=0
    local max_wait=120
    while [ ! -f "${report_path}" ] && [ $wait_seconds -lt $max_wait ]; do
        sleep 1
        wait_seconds=$((wait_seconds+1))
    done

    if [ ! -f "${report_path}" ]; then
        print_error "Report file not found after waiting: ${report_path}"
        return 1
    fi

    if node "$(dirname "$0")/verify-vulnerabilities.js" "${report_path}"; then
        print_success "Verificación passou - No hay vulnerabilidades críticas o altas"
        return 0
    else
        print_error "Verificación falló - Se encontraron vulnerabilidades"
        return 1
    fi
}

# Show reports location
show_reports() {
    echo ""
    print_header "Reportes generados"
    
    if [ -d "${REPORT_DIR}" ] && [ "$(ls -A ${REPORT_DIR})" ]; then
        echo ""
        print_status "Últimos reportes:"
        ls -lh "${REPORT_DIR}"/report_*.html 2>/dev/null | tail -3 | awk '{print "  " $9 " (" $5 ")"}'
        echo ""
        print_status "Para visualizar: abref ${REPORT_DIR}/report_*.html"
    else
        print_warning "No se encontraron reportes"
    fi
}

# Cleanup
cleanup() {
    echo ""
    print_status "Limpiando..."
    
    if [ "$1" != "keep" ]; then
        print_status "Deteniendo contenedores..."
        ${DOCKER_COMPOSE_CMD} down -v 2>/dev/null || true
    fi
}

# Main execution
main() {
    clear
    print_header "OWASP ZAP - Escaneo de Seguridad Local"
    echo ""
    
    check_docker
    echo ""
    
    trap 'cleanup' EXIT
    
    start_containers
    echo ""
    
    if ! wait_for_api; then
        print_error "No se pudo conectar a la API"
        return 1
    fi
    
    if ! wait_for_zap; then
        print_error "No se pudo conectar a ZAP"
        return 1
    fi

    if ! check_scan_target_from_zap; then
        return 1
    fi

    if ! check_cors_policy; then
        print_error "Abortando scan: corrige CORS y vuelve a intentar."
        return 1
    fi
    
    echo ""
    
    local scan_status=0
    case "${SCAN_TYPE}" in
        baseline)
            run_baseline_scan || scan_status=$?
            ;;
        full)
            run_full_scan || scan_status=$?
            ;;
        quick)
            run_quick_scan || scan_status=$?
            ;;
        *)
            print_error "Tipo de escaneo desconocido: ${SCAN_TYPE}"
            print_status "Opciones válidas: baseline, full, quick"
            return 1
            ;;
    esac

    if [ "${scan_status}" -eq 130 ]; then
        print_warning "Escaneo cancelado por el usuario"
        return 130
    fi
    
    echo ""
    
    if verify_vulnerabilities; then
        verify_exit=0
    else
        verify_exit=1
    fi
    
    show_reports
    echo ""
    
    cleanup "keep"
    
    return $verify_exit
}

# Run main function
main
exit $?
