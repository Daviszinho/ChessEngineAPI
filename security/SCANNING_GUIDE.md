# OWASP ZAP Scanning Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js (for vulnerability verification)
- curl (for health checks)

### Run Security Scans

#### Baseline Scan (Recommended for CI/CD)
Fast scan with passive rules and basic active scanning:
```bash
chmod +x ./security/scan-locally.sh
./security/scan-locally.sh baseline
```

#### Full Scan (Comprehensive)
Complete security scan including all attack vectors:
```bash
./security/scan-locally.sh full
```

#### Quick Scan (Very Fast)
Minimal scanning, only passive rules:
```bash
./security/scan-locally.sh quick
```

## Understanding the Results

### Vulnerability Levels

- **CRITICAL**: Immediate threat to security, must be fixed
- **HIGH**: Significant security issue, should be fixed urgently
- **MEDIUM**: Potential security issue, review needed
- **LOW**: Minor issue, low priority
- **INFO**: Informational, no direct security impact

### Report Files

Generated reports are stored in `./security/zap-reports/`:

- `report_*_TIMESTAMP.html` - Visual HTML report
- `report_*_TIMESTAMP.json` - Machine-readable JSON report
- `scan_*_TIMESTAMP.log` - Scan execution log

### Verify Reports

Manual verification of vulnerability reports:
```bash
node ./security/verify-vulnerabilities.js ./security/zap-reports/report_baseline_TIMESTAMP.json
```

## False Positives Management

The scanner automatically filters known false positives defined in:
- `security/false-positives.md` - Documentation
- `security/verify-vulnerabilities.js` - Detection logic

### Common False Positives

1. **X-Content-Type-Options Header**: Helmet middleware sets this
2. **CORS Configuration**: Intentionally enabled for API access
3. **Missing Content-Type**: Express.json() handles this automatically

### Adding New False Positives

Edit `security/verify-vulnerabilities.js` and add to `FALSE_POSITIVES` object:

```javascript
const FALSE_POSITIVES = {
    'Alert Name': {
        reason: 'Why this is a false positive',
        evidence: 'Code or config proving it\'s not a real issue',
        cve: null,
        status: 'documented'
    }
};
```

## Security Policy

Custom ZAP policy file: `security/zap-policies/default-policy.json`

Configured for:
- SQL Injection detection
- XSS detection
- Command Injection detection
- LDAP Injection detection
- XXE (XML External Entity) detection

## Integration with Scripts

### npm Commands

Add to your npm workflow:
```bash
npm run scan:security   # Run security scan
npm run scan:verify     # Verify latest report
```

### Docker Compose

Services are defined in `docker-compose.yml`:
- `chess-engine-api` - Your API
- `owasp-zap` - ZAP scanner

### CI/CD Integration

For local testing use:
```bash
./security/scan-locally.sh baseline
```

**Note**: GitHub Actions integration omitted as per requirements (local execution only)

## Troubleshooting

### Containers fail to start
```bash
docker-compose ps
docker-compose logs chess-engine-api
docker-compose logs owasp-zap
```

### API not responding
```bash
curl -v http://localhost:3000/api/health
```

### ZAP not responding
```bash
docker-compose exec owasp-zap curl -v http://localhost:8080/api/ascan/status?apikey=test
```

### Clean restart
```bash
docker-compose down -v
docker system prune -f
```

## External References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

## Report Analysis Checklist

- [ ] Check for CRITICAL vulnerabilities
- [ ] Check for HIGH vulnerabilities
- [ ] Review MEDIUM vulnerabilities
- [ ] Verify false positives are documented
- [ ] Check instances count for each finding
- [ ] Review affected URLs
- [ ] Document any new findings
- [ ] Create issues for findings that need fixing

## Performance Notes

| Scan Type | Duration | Coverage |
|-----------|----------|----------|
| Quick     | 2-5 min  | Passive only |
| Baseline  | 5-10 min | Passive + Quick active |
| Full      | 15-30 min| Complete scanning |

Choose based on your needs:
- **Development**: Quick or Baseline
- **Pre-release**: Baseline
- **Security audit**: Full

## Security & Compliance

- All API endpoints identified
- HTTP methods tested
- Input validation checked
- Authentication/Authorization verified
- CORS configuration validated
- Header security reviewed
- Error handling tested

---

For issues or questions about specific findings, see `security/false-positives.md`
