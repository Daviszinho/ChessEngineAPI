const http = require('http');
const https = require('https');
const fs = require('fs');
const httpProxy = require('http-proxy');

// Check if we need to install http-proxy
try {
    require('http-proxy');
} catch (e) {
    console.log('Installing http-proxy...');
    const { execSync } = require('child_process');
    execSync('npm install http-proxy', { stdio: 'inherit' });
}

const proxy = httpProxy.createProxyServer({
    target: 'http://localhost:3000',
    changeOrigin: true,
    ws: true
});

// HTTP server (port 80)
http.createServer((req, res) => {
    proxy.web(req, res);
}).listen(80, () => {
    console.log('HTTP proxy server running on port 80');
});

// Try to create HTTPS server (port 443) with self-signed cert
try {
    const options = {
        key: fs.readFileSync('/etc/ssl/certs/ssl-cert-snakeoil.key'),
        cert: fs.readFileSync('/etc/ssl/certs/ssl-cert-snakeoil.pem')
    };
    
    https.createServer(options, (req, res) => {
        proxy.web(req, res);
    }).listen(443, () => {
        console.log('HTTPS proxy server running on port 443');
    });
} catch (err) {
    console.log('Could not start HTTPS server - SSL certs not available');
}

proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error');
});

console.log('Proxy server started for Chess Engine API');
console.log('App available at:');
console.log('  http://localhost');
console.log('  https://localhost (if SSL certs available)');