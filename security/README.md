# Security & Vulnerability Scanning

Esta carpeta contiene las herramientas y configuraciones para realizar escaneos de seguridad con **OWASP ZAP** en la API Chess Engine.

## Contenidos

- **scan-locally.sh** - Script principal para escaneos locales
- **quick-scan.sh** - Script rápido sin configuración del usuario  
- **verify-vulnerabilities.js** - Verificador de resultados con filtrado de falsos positivos
- **false-positives.md** - Documentación de falsos positivos conocidos
- **zap-policies/** - Configuraciones personalizadas de ZAP
- **zap-reports/** - Reportes generados

## Inicio Rápido

### Requerimientos
- Docker y Docker Compose
- Node.js 14+
- bash

### Ejecutar Escaneo

```bash
# Opción 1: NPM script (Fácil)
npm run scan:security

# Opción 2: Script directo (Más control)
./security/scan-locally.sh baseline

# Opción 3: Escaneo muy rápido
npm run scan:security:quick
```

## Tipos de Escaneos

### Baseline (5-10 minutos) ⭐ Recomendado
- Reglas pasivas + escaneo activo rápido
- Ideal para CI/CD y desarrollo
- Detecta la mayoría de vulnerabilidades comunes

```bash
./security/scan-locally.sh baseline
```

### Full (15-30 minutos)
- Escaneo completo con todas las reglas
- Ideal para auditorías de seguridad
- Mayor cobertura pero más lento

```bash
./security/scan-locally.sh full
```

### Quick (2-5 minutos)
- Solo reglas pasivas
- Muy rápido, menos cobertura
- Ideal para desarrollo rápido

```bash
npm run scan:security:quick
```

## Ver Resultados

### Terminal
El script mostrará un resumen en la terminal:

```
╔════════════════════════════════════════╗
║   VULNERABILITY ASSESSMENT REPORT       ║
╚════════════════════════════════════════╝

Summary:
  CRITICAL:  0 ✓
  HIGH:      0 ✓
  MEDIUM:    3
  LOW:       2
  INFO:      1

✓ VERDICT: PASSED - No critical or high vulnerabilities
```

### Reportes en HTML

Abre el reporte HTML más reciente:

```bash
# macOS
open ./zap-reports/report_*.html

# Linux
xdg-open ./zap-reports/report_*.html

# Windows
start ./zap-reports/report_*.html
```

### JSON (Machine-readable)

Para procesamiento automatizado:

```bash
cat ./zap-reports/report_*.json
```

## Administrar Falsos Positivos

### Ver Documentados
```bash
cat ./false-positives.md
```

### Agregar Nuevo Falso Positivo

1. **Identificar**: Encontrar la alerta en el reporte que es falso positivo
2. **Investigar**: Verificar que es realmente falso con análisis manual
3. **Documentar**: Agregar a `verify-vulnerabilities.js`:

```javascript
const FALSE_POSITIVES = {
    'Nombre de la Alerta': {
        reason: 'Explicar por qué es falso positivo',
        evidence: 'Código o config que lo prueba',
        cve: null,
        status: 'documented'
    }
};
```

4. **Verificar**: 
```bash
./security/scan-locally.sh baseline
node ./security/verify-vulnerabilities.js ./security/zap-reports/report_latest.json
```

5. **Documentar**: Actualizar [false-positives.md](./false-positives.md)

## Verificación Manual de Controles

### Headers de Seguridad

```bash
curl -I http://localhost:3000/api/health

# Esperado:
# x-content-type-options: nosniff
# x-frame-options: DENY  
# x-xss-protection: 0
# content-security-policy: ...
```

### Validación de Entrada

```bash
# SQL Injection - Debe rechazarse
curl -X POST http://localhost:3000/api/move \
  -H "Content-Type: application/json" \
  -d '{"fen":"test'\''sql","engine":"stockfish","level":20}'

# XSS - Debe sanitizarse
curl -X POST http://localhost:3000/api/move \
  -H "Content-Type: application/json" \
  -d '{"fen":"<script>","engine":"stockfish","level":20}'
```

## Solucionar Problemas

### Contenedores no inician

```bash
# Verificar logs
docker-compose --profile security logs

# Limpiar y reiniciar
docker-compose down -v
docker system prune -f
npm run scan:security
```

### Timeout esperando API

```bash
# Verificar que API está corriendo
curl http://localhost:3000/api/health

# Ver logs
docker-compose logs chess-engine-api

# Aumentar timeout en script si es necesario
```

### Puertos ocupados

```bash
# Encontrar proceso usando puerto
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Liberar puerto o cambiar en docker-compose.yml
```

## Políticas de Seguridad

Archivo: [zap-policies/default-policy.json](./zap-policies/default-policy.json)

Reglas habilitadas:
- ✓ SQL Injection
- ✓ XSS (Cross-Site Scripting)
- ✓ Command Injection
- ✓ LDAP Injection
- ✓ XXE (XML External Entity)
- ✓ Path Traversal
- ✓ Heartbleed (OpenSSL)

Reglas deshabilitadas (No aplicables):
- ✗ Java/JSP específicas
- ✗ Java Deserialization

## Flujo de Trabajo CI/CD

Para agregar en el futuro:

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run scan:security
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: zap-reports
          path: security/zap-reports/
```

## Niveles de Vulnerabilidad

| Nivel | Gravedad | Acción |
|-------|----------|--------|
| CRITICAL | Máxima | Fallar escaneo - Corregir inmediatamente |
| HIGH | Alta | Fallar escaneo - Corregir urgente |
| MEDIUM | Media | Revisar - Corregir pronto |
| LOW | Baja | Documentar - Considerar |
| INFO | Informativa | Ignorar - Solo referencia |

El script **falla automáticamente** si encuentra vulnerabilidades CRITICAL o HIGH.

## Referencias

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Scripts Disponibles

### npm scripts
```bash
npm run scan:security           # Línea base
npm run scan:security:full      # Completo
npm run scan:security:quick     # Muy rápido
npm run scan:verify             # Verificar último reporte
```

### Scripts bash
```bash
./security/scan-locally.sh baseline     # Línea base
./security/scan-locally.sh full         # Completo
./security/scan-locally.sh quick        # Muy rápido
./security/quick-scan.sh               # Atajo rápido
```

## Estructura de Reportes

```
zap-reports/
├── report_baseline_20240220_120000.html    # Visual
├── report_baseline_20240220_120000.json    # Datos
├── scan_baseline_20240220_120000.log       # Log
└── report_latest.json                      # Último (referencia)
```

## Configuración

Variables de entorno en `.env.security.example`:

```bash
API_URL=http://localhost:3000
ZAP_PORT=8080
FAIL_ON_CRITICAL=true
FAIL_ON_HIGH=true
SCAN_TIMEOUT=600
```

---

**Mantenedor**: Security Team  
**Última actualización**: 2024-02-20  
**Versión**: 1.0
