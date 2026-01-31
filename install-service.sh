#!/bin/bash

echo "Installing Chess Engine API Nginx service..."

# Copy systemd service file
sudo cp chess-api-nginx.service /etc/systemd/system/

# Set proper permissions
sudo chmod 644 /etc/systemd/system/chess-api-nginx.service

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the service
sudo systemctl enable chess-api-nginx.service
sudo systemctl start chess-api-nginx.service

echo "Service installed and started!"
echo "Status: sudo systemctl status chess-api-nginx.service"
echo "Logs: sudo journalctl -u chess-api-nginx.service -f"