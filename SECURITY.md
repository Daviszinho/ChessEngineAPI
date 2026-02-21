# Security Testing & OWASP ZAP Integration

This project includes automated security scanning using OWASP ZAP (Zed Attack Proxy) to identify and mitigate vulnerabilities.

## Overview

### Components
- **OWASP ZAP Container:** Runs automated security scans against the API
- **Baseline Scan:** Quick scan suitable for CI/CD pipelines
- **Vulnerability Verification:** Script that fails build if critical/high vulnerabilities are found
- **False Positive Database:** Documented false positives to reduce noise

### Risk Levels
- **CRITICAL:** Application-breaking vulnerabilities (e.g., SQL injection, RCE)
- **HIGH:** Serious security issues (e.g., auth bypass, sensitive data exposure)
- **MEDIUM:** Important issues that should be addressed
- **LOW:** Minor issues
- **INFO:** Informational alerts

## Quick Start

### 1. Run Security Scan

```bash
# Using Docker Compose
docker-compose up -d

# Wait for services to be ready, then run scan
./security/run-security-checks.sh
```

### 2. View Results

Results are saved to `security/zap-reports/`:
- `report_YYYYMMDD_HHMMSS.html` - Human-readable report
- `report_YYYYMMDD_HHMMSS.json` - Machine-readable report
- `scan_YYYYMMDD_HHMMSS.log` - Scan execution log

### 3. Analyze Findings

The verification script will:
- Parse the JSON report
- Filter out known false positives
- Report critical/high vulnerabilities
- Exit with code 0 (pass) or 1 (fail)

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    services:
      chess-api:
        image: your-registry/chess-engine-api:latest
        ports:
          - 3000:3000
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run OWASP ZAP Scan
        run: |
          docker-compose -f docker-compose.security.yml up -d
          ./security/run-security-checks.sh
          
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: security/zap-reports/
```

## Understanding Results

### Passing Build
```
✓ VERDICT: PASSED - No critical or high vulnerabilities
```

### Failing Build
```
✗ VERDICT: FAILED - Vulnerabilities found
CRITICAL:  1 ⚠️
HIGH:      2 ⚠️
```

## False Positives

Not all vulnerabilities reported by ZAP are actual vulnerabilities. See [false-positives.md](./false-positives.md) for:
- Documented false positives
- How we handle them
- Verification steps

## Adding New False Positives

If a false positive is found:

1. Document it in [false-positives.md](./false-positives.md)
2. Update `FALSE_POSITIVES` object in [verify-vulnerabilities.js](./verify-vulnerabilities.js)
3. Provide evidence and justification
4. Include CVE/CWE if applicable

Example:
```javascript
const FALSE_POSITIVES = {
    'Alert Name': {
        reason: 'Why this is a false positive',
        evidence: 'Where in code / how to verify',
        cve: 'CVE-XXXX-XXXXX (or null)',
        status: 'documented'
    }
};
```

## Manual ZAP Usage

### Access ZAP Web UI
Once running, ZAP is accessible at: `http://localhost:8090`

### Run Advanced Scan
```bash
docker-compose exec owasp-zap zap-full-scan.py \
  -t http://chess-engine-api:3000 \
  -r /zap/reports/full-scan.html \
  -J /zap/reports/full-scan.json
```

### Custom Policy Scan
Create a custom policy in `security/zap-policies/` and reference it:
```bash
docker-compose exec owasp-zap zap.sh \
  -config "api.disablekey=true" \
  -configfile /zap/policies/custom-policy.yaml \
  -cmd
```

## Remediation Workflow

### For CRITICAL/HIGH Vulnerabilities

1. **Triage:** Is it a real vulnerability or false positive?
   - If false positive: Add to [false-positives.md](./false-positives.md)
   - If real: Continue to step 2

2. **Assess Impact:** How does this affect production?
   - Data exposure risk?
   - Authentication bypass?
   - Code execution?

3. **Fix:** Implement the fix
   - Update code
   - Add security headers
   - Fix input validation
   - etc.

4. **Verify:** Run scan again to confirm fix
   ```bash
   ./security/run-security-checks.sh
   ```

5. **Test:** Add regression tests
   - Unit tests for the fix
   - Integration tests

## Baseline Scan Details

The baseline scan (`zap-baseline.py`) includes:
- ✓ Passive scanning rules (no active requests that break things)
- ✓ Regex-based vulnerability detection
- ✓ Common vulnerability patterns (OWASP Top 10)
- ✗ Active exploitation tests (requires separate scan)

**Execution time:** ~2-5 minutes

## Advanced Scans

For more thorough testing:

### Full Scan
```bash
zap-full-scan.py -t http://target:3000 -r report.html
```
- Includes active scanning
- Takes 15-30+ minutes
- More false positives
- Better for pre-release testing

### API Scan
```bash
zap-api-scan.py -t http://target:3000/openapi.json
```
- Requires OpenAPI specification
- Tailored for API endpoints
- Faster and more accurate for APIs

## Troubleshooting

### Scan Hangs
- Check API is healthy: `curl http://localhost:3000/api/health`
- Check ZAP logs: `docker-compose logs owasp-zap`
- Restart services: `docker-compose restart`

### Too Many False Positives
- Review [false-positives.md](./false-positives.md)
- Update ZAP policies for your environment
- Consider custom passive rules

### Report Not Generated
- Check permissions: `ls -la security/zap-reports/`
- Verify volume mounts in docker-compose.yml
- Check disk space: `df -h`

## Resources

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [ZAP Baseline Scan](https://www.zaproxy.org/docs/docker/baseline-scan/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

## References

- Helmet.js: https://helmetjs.github.io/
- Express Security Best Practices: https://expressjs.com/en/advanced/best-practice-security.html
- OWASP API Security: https://owasp.org/www-project-api-security/
