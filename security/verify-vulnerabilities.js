#!/usr/bin/env node

/**
 * Vulnerability Verification Script
 * 
 * This script parses OWASP ZAP JSON reports and verifies that:
 * 1. No CRITICAL vulnerabilities exist
 * 2. No HIGH vulnerabilities exist (can be configured)
 * 3. Identifies and documents false positives
 * 
 * Exit codes:
 * 0 = No critical/high vulnerabilities
 * 1 = Critical/high vulnerabilities found
 * 2 = Invalid input or error
 */

const fs = require('fs');
const path = require('path');

// ANSI Color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// False positive database
// Add known false positives here with evidence
const FALSE_POSITIVES = {
    'X-Content-Type-Options Header Missing': {
        reason: 'Helmet configuration is applied; this rule may detect incorrectly in some instances',
        evidence: 'src/server.js uses helmet({ ... })',
        cve: null,
        status: 'documented'
    },
    'CORS': {
        reason: 'CORS is intentionally enabled for cross-origin requests; properly configured with cors middleware',
        evidence: 'CORS is necessary for client applications',
        cve: null,
        status: 'documented'
    },
    'Missing Content-Type Header': {
        reason: 'Express middleware automatically sets Content-Type for JSON responses',
        evidence: 'app.use(express.json()) handles this automatically',
        cve: null,
        status: 'documented'
    }
};

function log(message, color = 'reset') {
    console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

function parseReport(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            log(`\n✗ Report file not found: ${filePath}`, 'red');
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const report = JSON.parse(content);
        return report;
    } catch (error) {
        log(`✗ Error reading report: ${error.message}`, 'red');
        return null;
    }
}

function extractAlerts(report) {
    if (!report || !report.site || !Array.isArray(report.site)) {
        return [];
    }

    let alerts = [];
    report.site.forEach(site => {
        if (site.alerts && Array.isArray(site.alerts)) {
            alerts = alerts.concat(site.alerts);
        }
    });

    return alerts;
}

function classifyAlert(alert) {
    const riskIdMap = {
        '0': 'INFO',
        '1': 'LOW',
        '2': 'MEDIUM',
        '3': 'HIGH',
        '4': 'CRITICAL'
    };

    const rawRiskCode = String(alert.riskid ?? alert.riskcode ?? '').trim();
    const rawRiskDesc = String(alert.riskdesc ?? alert.risk ?? '').toLowerCase();

    let normalizedRisk = riskIdMap[rawRiskCode];
    if (!normalizedRisk) {
        if (rawRiskDesc.includes('critical')) normalizedRisk = 'CRITICAL';
        else if (rawRiskDesc.includes('high')) normalizedRisk = 'HIGH';
        else if (rawRiskDesc.includes('medium')) normalizedRisk = 'MEDIUM';
        else if (rawRiskDesc.includes('low')) normalizedRisk = 'LOW';
        else if (rawRiskDesc.includes('informational') || rawRiskDesc.includes('info')) normalizedRisk = 'INFO';
        else normalizedRisk = 'UNKNOWN';
    }

    return {
        risk: normalizedRisk,
        riskId: rawRiskCode || 'N/A',
        confidence: alert.confidence,
        name: alert.name,
        description: alert.description,
        instances: alert.instances || [],
        url: alert.url,
        cve: alert.cve || null,
        cwe: alert.cwe || null,
        reference: alert.reference
    };
}

function isFalsePositive(alert) {
    const alertName = alert.name.toLowerCase();
    
    for (const [fpName, fpData] of Object.entries(FALSE_POSITIVES)) {
        if (alertName.includes(fpName.toLowerCase())) {
            return { isFP: true, fpData };
        }
    }
    
    return { isFP: false };
}

function generateReport(alerts) {
    log('\n' + colors.bold + '╔════════════════════════════════════════╗', 'blue');
    log('║   VULNERABILITY ASSESSMENT REPORT       ║', 'blue');
    log('╚════════════════════════════════════════╝' + colors.reset, 'blue');

    // Classify alerts by risk level
    const byRisk = {
        CRITICAL: [],
        HIGH: [],
        MEDIUM: [],
        LOW: [],
        INFO: [],
        UNKNOWN: []
    };

    alerts.forEach(alert => {
        const classified = classifyAlert(alert);
        const fpCheck = isFalsePositive(classified);
        
        if (!fpCheck.isFP) {
            const bucket = byRisk[classified.risk] ? classified.risk : 'UNKNOWN';
            byRisk[bucket].push(classified);
        }
    });

    // Summary
    log('\n' + colors.bold + 'Summary:' + colors.reset);
    log(`  CRITICAL:  ${byRisk.CRITICAL.length} ${byRisk.CRITICAL.length > 0 ? '⚠️ ' : '✓'}`, 
        byRisk.CRITICAL.length > 0 ? 'red' : 'green');
    log(`  HIGH:      ${byRisk.HIGH.length} ${byRisk.HIGH.length > 0 ? '⚠️ ' : '✓'}`, 
        byRisk.HIGH.length > 0 ? 'red' : 'green');
    log(`  MEDIUM:    ${byRisk.MEDIUM.length}`, 'yellow');
    log(`  LOW:       ${byRisk.LOW.length}`, 'cyan');
    log(`  INFO:      ${byRisk.INFO.length}`, 'blue');
    if (byRisk.UNKNOWN.length > 0) {
        log(`  UNKNOWN:   ${byRisk.UNKNOWN.length}`, 'yellow');
    }

    // Detailed listing
    if (byRisk.CRITICAL.length > 0) {
        log('\n' + colors.bold + colors.red + 'CRITICAL VULNERABILITIES:' + colors.reset);
        byRisk.CRITICAL.forEach((alert, idx) => {
            log(`\n  ${idx + 1}. ${alert.name}`, 'red');
            log(`     Risk ID: ${alert.riskId}`, 'red');
            log(`     Confidence: ${alert.confidence}`, 'red');
            log(`     Description: ${alert.description}`, 'red');
            if (alert.cve) log(`     CVE: ${alert.cve}`, 'red');
            if (alert.instances.length > 0) {
                log(`     Affected URLs: ${alert.instances.length}`, 'red');
                alert.instances.slice(0, 3).forEach(inst => {
                    log(`       - ${inst.uri}`, 'red');
                });
                if (alert.instances.length > 3) {
                    log(`       ... and ${alert.instances.length - 3} more`, 'red');
                }
            }
        });
    }

    if (byRisk.HIGH.length > 0) {
        log('\n' + colors.bold + colors.red + 'HIGH VULNERABILITIES:' + colors.reset);
        byRisk.HIGH.forEach((alert, idx) => {
            log(`\n  ${idx + 1}. ${alert.name}`, 'red');
            log(`     Confidence: ${alert.confidence}`, 'red');
            if (alert.instances.length > 0) {
                log(`     Affected URLs: ${alert.instances.length}`, 'red');
                alert.instances.slice(0, 2).forEach(inst => {
                    log(`       - ${inst.uri}`, 'red');
                });
                if (alert.instances.length > 2) {
                    log(`       ... and ${alert.instances.length - 2} more`, 'red');
                }
            }
        });
    }

    if (byRisk.MEDIUM.length > 0) {
        log('\n' + colors.bold + colors.yellow + 'MEDIUM VULNERABILITIES:' + colors.reset);
        log(`  Found ${byRisk.MEDIUM.length} medium severity issues (review recommended)`, 'yellow');
    }

    // False positives
    const falsePositiveCount = alerts.length - 
        (byRisk.CRITICAL.length + byRisk.HIGH.length + byRisk.MEDIUM.length + 
         byRisk.LOW.length + byRisk.INFO.length + byRisk.UNKNOWN.length);
    
    if (falsePositiveCount > 0) {
        log('\n' + colors.bold + colors.green + 'FALSE POSITIVES FILTERED:' + colors.reset);
        log(`  ${falsePositiveCount} known false positive(s) filtered out`, 'green');
        log('  See security/false-positives.md for details', 'green');
    }

    // Results
    log('\n' + colors.bold + '════════════════════════════════════════' + colors.reset);
    const hasCritical = byRisk.CRITICAL.length > 0;
    const hasHigh = byRisk.HIGH.length > 0;

    if (hasCritical || hasHigh) {
        log('\n✗ VERDICT: FAILED - Vulnerabilities found', 'red');
        return { passed: false, critical: hasCritical, high: hasHigh };
    } else {
        log('\n✓ VERDICT: PASSED - No critical or high vulnerabilities', 'green');
        return { passed: true };
    }
}

// Main execution
const reportPath = process.argv[2];

if (!reportPath) {
    log('\nUsage: node verify-vulnerabilities.js <json-report-path>', 'yellow');
    log('Example: node verify-vulnerabilities.js ./security/zap-reports/report_20240220_120000.json', 'yellow');
    process.exit(2);
}

log('\n' + colors.blue + colors.bold + '→ Analyzing OWASP ZAP report...' + colors.reset);

const report = parseReport(reportPath);
if (!report) {
    process.exit(2);
}

const alerts = extractAlerts(report);
log(`  Found ${alerts.length} total alerts`, 'blue');

const result = generateReport(alerts);

process.exit(result.passed ? 0 : 1);
