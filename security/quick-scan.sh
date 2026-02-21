#!/bin/bash

###############################################
# Quick Security Scan
# 
# Ejecuta un escaneo rápido de seguridad
# sin necesidad de configuración compleja
###############################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Iniciando Escaneo de Seguridad ZAP    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker no está ejecutándose${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker está disponible${NC}"
echo ""
# Prefer 'docker compose' (v2 plugin) and fall back to 'docker-compose'
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗ ni 'docker compose' ni 'docker-compose' están disponibles${NC}"
    exit 1
fi

# If current user cannot access the docker socket, try sudo in non-interactive mode.
if ! ${DOCKER_COMPOSE_CMD} ps >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1 && sudo -n ${DOCKER_COMPOSE_CMD} ps >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="sudo ${DOCKER_COMPOSE_CMD}"
        echo -e "${YELLOW}[*] Usando sudo para comandos Docker (modo no interactivo)${NC}"
    else
        echo -e "${RED}✗ Sin acceso al socket Docker. Ejecuta: sudo usermod -aG docker $USER && newgrp docker${NC}"
        exit 1
    fi
fi

# Start containers with security profile
echo -e "${YELLOW}[*] Levantando contenedores...${NC}"
${DOCKER_COMPOSE_CMD} --profile security up -d

# Wait for services
echo -e "${YELLOW}[*] Esperando que los servicios estén listos...${NC}"
sleep 10

# Check API health
echo -e "${YELLOW}[*] Verificando API...${NC}"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓ API está disponible${NC}"
else
    echo -e "${RED}✗ API no responde${NC}"
    ${DOCKER_COMPOSE_CMD} down
    exit 1
fi

# Check ZAP health
echo -e "${YELLOW}[*] Verificando ZAP...${NC}"
if ${DOCKER_COMPOSE_CMD} exec -T owasp-zap curl -s http://localhost:8080/api/ascan/status?apikey=test > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ZAP está disponible (exec)${NC}"
else
    echo -e "${RED}✗ ZAP no responde${NC}"
    ${DOCKER_COMPOSE_CMD} down
    exit 1
fi
## Prefer host check first (host machine may not need curl inside container)
if curl -s http://localhost:8080/api/ascan/status?apikey=test > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ZAP está disponible (host)${NC}"
else
    # fallback to exec check if host check failed
    if ${DOCKER_COMPOSE_CMD} exec -T owasp-zap sh -c 'command -v curl >/dev/null 2>&1 && curl -s http://localhost:8080/api/ascan/status?apikey=test' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ZAP está disponible (container)${NC}"
    else
        echo -e "${RED}✗ ZAP no responde (host nor container)${NC}"
        ${DOCKER_COMPOSE_CMD} down
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}[*] Ejecutando escaneo de línea base...${NC}"
echo ""

# Create reports directory
mkdir -p ./security/zap-reports

# Run the scan
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HTML_REPORT="./security/zap-reports/report_${TIMESTAMP}.html"
JSON_REPORT="./security/zap-reports/report_${TIMESTAMP}.json"

${DOCKER_COMPOSE_CMD} exec -T owasp-zap \
    zap-baseline.py \
    -t "http://chess-engine-api:3000/api" \
    -r "${HTML_REPORT}" \
    -J "${JSON_REPORT}" \
    -a -v 2>&1 || true

echo ""
echo -e "${YELLOW}[*] Analizando resultados...${NC}"

# Verify vulnerabilities
if [ -f "${JSON_REPORT}" ]; then
    node ./security/verify-vulnerabilities.js "${JSON_REPORT}"
    RESULT=$?
else
    echo -e "${RED}✗ No se generó el reporte JSON${NC}"
    RESULT=1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}[*] Deteniendo contenedores...${NC}"
${DOCKER_COMPOSE_CMD} down

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Escaneo completado exitosamente${NC}"
    echo -e "${GREEN}✓ No hay vulnerabilidades críticas o altas${NC}"
else
    echo -e "${RED}✗ Escaneo encontró vulnerabilidades${NC}"
fi

echo ""
echo "Reportes disponibles en: ./security/zap-reports/"
echo ""

exit $RESULT
