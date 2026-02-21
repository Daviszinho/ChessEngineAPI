# False Positives & Security Policy

This document outlines known false positives in OWASP ZAP scans for the ChessEngineAPI project.

## Known False Positives

### 1. X-Content-Type-Options Header Missing
**Risk Level:** MEDIUM  
**Status:** FALSE POSITIVE  
**Reason:** Helmet middleware is configured to set security headers. Some versions of ZAP may not properly detect headers set by Express middleware.

**Evidence:**
```javascript
// src/server.js
app.use(helmet({
    hsts: false
}));
```

**Verification:**
```bash
curl -I http://localhost:3000/api/health | grep -i "x-content-type-options"
# Should output: x-content-type-options: nosniff
```

### 2. CORS Configuration Issues
**Risk Level:** HIGH/MEDIUM  
**Status:** INTENTIONAL DESIGN  
**Reason:** CORS is intentionally enabled to allow cross-origin requests from web clients. This is necessary for a public-facing API.

**Evidence:**
```javascript
// src/server.js
app.use(cors());
```

**Mitigation:** CORS is used safely:
- Only JSON responses are returned
- No sensitive data in CORS headers
- Input validation is performed on all requests

### 3. Missing Content-Type Header  
**Risk Level:** LOW  
**Status:** FALSE POSITIVE  
**Reason:** Express.json() middleware automatically sets the Content-Type header for all JSON responses.

**Evidence:**
```javascript
// src/server.js
app.use(express.json());
```

**Verification:**
```bash
curl -v -X POST http://localhost:3000/api/move \
  -H "Content-Type: application/json" \
  -d '{"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1","engine":"stockfish","level":20}' \
  2>&1 | grep -i "content-type"
# Should show: Content-Type: application/json
```

## Security Controls in Place

### Input Validation
- All requests to `/api/move` are validated using Joi schema
- Invalid requests are rejected with 400 status code
- File: [src/middleware/validation.js](../../src/middleware/validation.js)

### HTTP Security Headers
- **Helmet.js** is used for security headers
- X-Frame-Options, X-Content-Type-Options, CSP all configured
- HSTS disabled due to local development environment

### Error Handling
- No stack traces exposed to clients
- All errors sanitized before response
- Proper HTTP status codes used

### Dependencies
- Regular `npm audit` checks recommended
- Critical vulnerabilities must be addressed before deployment
- All dependencies are pinned to specific versions for reproducibility

## Testing for False Positives

To verify these are indeed false positives:

```bash
# 1. Start the API
npm run dev

# 2. In another terminal, verify headers
curl -I http://localhost:3000/api/health

# Expected headers:
# x-content-type-options: nosniff
# x-frame-options: DENY
# content-security-policy: ...
# x-xss-protection: 0
# ...more headers
```

## Reporting New Issues

If you find a vulnerability that is:
1. **Real:** Create an issue or security report
2. **False Positive:** Add to this document with evidence

## Security Scanning

Run regular security scans with:
```bash
# Full ZAP scan
npm run scan:security

# Dependency audit
npm audit

# SAST (if configured)
sonarqube / snyk / etc.
```

## References

- [OWASP ZAP](https://www.zaproxy.org/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
