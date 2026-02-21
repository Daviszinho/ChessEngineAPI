#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://chess-engine-api:3000"
ZAP_URL="http://owasp-zap:8080"
REPORT_DIR="./security/zap-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HTML_REPORT="${REPORT_DIR}/report_${TIMESTAMP}.html"
JSON_REPORT="${REPORT_DIR}/report_${TIMESTAMP}.json"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}OWASP ZAP Security Scan${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗ ni 'docker compose' ni 'docker-compose' están disponibles${NC}"
    exit 1
fi

# Validate Docker socket access without blocking for interactive sudo password.
if ! ${DOCKER_COMPOSE_CMD} ps >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1 && sudo -n ${DOCKER_COMPOSE_CMD} ps >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="sudo ${DOCKER_COMPOSE_CMD}"
        echo -e "${YELLOW}[*] Running Docker Compose with sudo (non-interactive mode)${NC}"
    else
        echo -e "${RED}✗ No access to Docker socket. Run: sudo usermod -aG docker $USER && newgrp docker${NC}"
        exit 1
    fi
fi

# Check if containers are running
echo -e "${YELLOW}[*] Checking if services are running...${NC}"
if ${DOCKER_COMPOSE_CMD} ps | grep -q "chess-engine-api"; then
    echo -e "${GREEN}[✓] Chess Engine API is running${NC}"
else
    echo -e "${RED}[✗] Chess Engine API is not running${NC}"
    exit 1
fi

if ${DOCKER_COMPOSE_CMD} ps | grep -q "owasp-zap"; then
    echo -e "${GREEN}[✓] OWASP ZAP is running${NC}"
else
    echo -e "${RED}[✗] OWASP ZAP is not running${NC}"
    exit 1
fi

# Wait for API to be ready
echo -e "${YELLOW}[*] Waiting for API to be ready...${NC}"
for i in {1..30}; do
    if curl -s "${API_URL}/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}[✓] API is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}[✗] API did not respond in time${NC}"
        exit 1
    fi
    sleep 2
done

# Wait for ZAP to be ready
echo -e "${YELLOW}[*] Waiting for OWASP ZAP to be ready...${NC}"
for i in {1..30}; do
    # Prefer host check first
    if curl -s "${ZAP_URL}/api/ascan/status?apikey=test" > /dev/null 2>&1; then
        echo -e "${GREEN}[✓] OWASP ZAP is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}[✗] OWASP ZAP did not respond in time${NC}"
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${YELLOW}[*] Starting baseline scan...${NC}"

# Run baseline scan (QUICK mode - suitable for CI/CD)
# This includes: passive rules and quick active scan
${DOCKER_COMPOSE_CMD} exec -T owasp-zap zap-baseline.py \
    -t "${API_URL}" \
    -r "${HTML_REPORT}" \
    -J "${JSON_REPORT}" \
    -a \
    2>&1 | tee "${REPORT_DIR}/scan_${TIMESTAMP}.log"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Scan Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Reports generated:${NC}"
echo -e "  HTML: ${HTML_REPORT}"
echo -e "  JSON: ${JSON_REPORT}"
echo ""

# Verify vulnerabilities
echo -e "${YELLOW}[*] Verifying vulnerability levels...${NC}"
node "$(dirname "$0")/verify-vulnerabilities.js" "${JSON_REPORT}"
VERIFY_EXIT_CODE=$?

echo ""
if [ $VERIFY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}[✓] Security scan passed - No high or critical vulnerabilities found${NC}"
    exit 0
else
    echo -e "${RED}[✗] Security scan failed - High or critical vulnerabilities detected${NC}"
    exit 1
fi
