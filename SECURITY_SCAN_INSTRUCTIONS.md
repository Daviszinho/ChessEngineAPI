# Escaneo de Seguridad OWASP ZAP - Instrucciones de Ejecución

## Inicio Rápido

### Prerequisitos
```bash
# Verificar que Docker está instalado
docker --version
docker-compose --version

# Verificar Node.js
node --version
```

## Ejecutar Escaneos

### Opción 1: Usando npm scripts (Recomendado)

```bash
# Escaneo rápido (2-5 minutos)
npm run scan:security:quick

# Escaneo de línea base (5-10 minutos)
npm run scan:security

# Escaneo completo (15-30 minutos)
npm run scan:security:full
```

### Opción 2: Ejecutar scripts directamente

```bash
# Escaneo de línea base
./security/scan-locally.sh baseline

# Escaneo completo
./security/scan-locally.sh full

# Escaneo rápido
./security/quick-scan.sh
```

### Opción 3: Docker Compose manualmente

```bash
# Iniciar servicios (con profile security)
docker-compose --profile security up

# En otra terminal, ejecutar el escaneo
docker-compose exec owasp-zap-scanner zap-baseline.py \
  -t "http://chess-engine-api:3000/api" \
  -r "./security/zap-reports/report.html" \
  -J "./security/zap-reports/report.json" \
  -a

# Detener servicios
docker-compose down
```

## Flujo de Trabajo de Desarrollo

```bash
# 1. Iniciar desarrollo
npm run dev

# 2. En otra terminal, ejecutar pruebas
npm test

# 3. Ejecutar escaneo de seguridad
npm run scan:security

# 4. Revisar vulnerabilidades
npm run scan:verify

# 5. Si hay resultados, revisar reporte HTML
open ./security/zap-reports/report_*.html
```

## Interpretar Resultados

### Dashboard de Salida

```
════════════════════════════════════════
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
════════════════════════════════════════
```

### Niveles de Vulnerabilidad

| Nivel | Acción | Prioridad |
|-------|--------|-----------|
| CRITICAL | Fallar escaneo | Inmediata |
| HIGH | Fallar escaneo | Urgente |
| MEDIUM | Revisar | Normal |
| LOW | Informar | Baja |
| INFO | Ignorar | Ninguna |

## Reportes Generados

Los reportes se guardan en `./security/zap-reports/`:

```
report_baseline_20240220_120000.html    # Reporte HTML visual
report_baseline_20240220_120000.json    # Reporte JSON machine-readable
scan_baseline_20240220_120000.log       # Log de ejecución
```

### Visualizar Reportes

```bash
# macOS
open ./security/zap-reports/report_*.html

# Linux
xdg-open ./security/zap-reports/report_*.html

# Cualquier navegador
firefox ./security/zap-reports/report_*.html
```

## Falsos Positivos

### Revisar Falsos Positivos Documentados

```bash
cat ./security/false-positives.md
```

### Agregar Nuevo Falso Positivo

1. Editar `./security/verify-vulnerabilities.js`
2. Localizar el objeto `FALSE_POSITIVES`
3. Agregar nueva entrada:

```javascript
const FALSE_POSITIVES = {
    // ... existing entries
    'Nueva Alerta': {
        reason: 'Por qué es un falso positivo',
        evidence: 'Código o configuración que lo prueba',
        cve: null,
        status: 'documented'
    }
};
```

4. Volver a ejecutar el escaneo
5. Documentar en `security/false-positives.md`

## Solucionar Problemas

### Los contenedores no se inician

```bash
# Ver logs
docker-compose logs chess-engine-api
docker-compose logs owasp-zap-scanner

# Limpiar todo
docker-compose down -v
docker system prune -f

# Reintentar
npm run scan:security
```

### La API no responde

```bash
# Verificar que la API está ejecutándose
curl -v http://localhost:3000/api/health

# Verificar logs
docker-compose logs chess-engine-api

# Reiniciar
docker-compose restart chess-engine-api
```

### ZAP no responde

```bash
# Verificar que ZAP está ejecutándose
docker-compose logs owasp-zap-scanner

# Verificar API de ZAP
docker-compose exec owasp-zap-scanner curl -v http://localhost:8080/

# Reiniciar ZAP
docker-compose restart owasp-zap-scanner
```

### Puerto 3000 u 8080 ya en uso

```bash
# Encontrar qué proceso está usando el puerto
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# O cambiar puerto en docker-compose.yml
# Cambiar: ports: - "3001:3000"
```

## Verificación Manual de Resultados

### Verificar Headers de Seguridad

```bash
curl -I http://localhost:3000/api/health

# Esperado:
# x-content-type-options: nosniff
# x-frame-options: DENY
# x-xss-protection: 0
# content-security-policy: ...
```

### Probar Validación de Entrada

```bash
# Intento SQL Injection - Debe fallar con 400
curl -X POST http://localhost:3000/api/move \
  -H "Content-Type: application/json" \
  -d '{"fen":"invalid'\''sql","engine":"stockfish","level":20}'

# Intento XSS - Debe sanitizarse
curl -X POST http://localhost:3000/api/move \
  -H "Content-Type: application/json" \
  -d '{"fen":"<script>alert(1)</script>","engine":"stockfish","level":20}'
```

## Política de Seguridad

Configuración personalizada: `./security/zap-policies/default-policy.json`

Detecta:
- SQL Injection ✓
- Cross-Site Scripting (XSS) ✓
- Command Injection ✓
- LDAP Injection ✓
- XML External Entity (XXE) ✓

## Integración en CI/CD (Futuro)

Cuando quieras agregar a GitHub Actions:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - name: Run OWASP ZAP scan
        run: npm run scan:security
      - name: Upload reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: zap-reports
          path: security/zap-reports/
```

**Nota**: Actualmente configurado solo para ejecución local.

## Referencias

- [Guía de Escaneo](./SCANNING_GUIDE.md)
- [Falsos Positivos](./false-positives.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ZAP Docs](https://www.zaproxy.org/docs/)

---

**Última actualización**: 2024-02-20
**Versión**: 1.0
