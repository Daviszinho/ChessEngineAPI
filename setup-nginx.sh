#!/bin/bash

echo "Setting up Chess Engine API with nginx HTTPS..."

# Generate SSL certificate
echo "Generating SSL certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/chess-api.key \
    -out /etc/ssl/certs/chess-api.crt \
    -subj "/C=US/ST=State/L=City/O=ChessAPI/OU=Dev/CN=localhost"

# Copy nginx configuration
echo "Setting up nginx configuration..."
sudo cp nginx/chess-api.conf /etc/nginx/sites-available/
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/chess-api.conf /etc/nginx/sites-enabled/

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Restarting nginx..."
    sudo systemctl reload nginx
    
    echo "Setup complete!"
    echo "Chess API will be available at: https://localhost"
    echo "API endpoints:"
    echo "  https://localhost/api/engines"
    echo "  https://localhost/api/move"
    echo "  https://localhost/api/health"
    echo ""
    echo "Note: The SSL certificate is self-signed. Your browser will show a warning."
else
    echo "nginx configuration test failed!"
fi