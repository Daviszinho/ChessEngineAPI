#!/bin/bash

echo "Installing Chess Engine API services..."

# Copy API service file
sudo cp chess-api.service /etc/systemd/system/
sudo chmod 644 /etc/systemd/system/chess-api.service

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the API service
sudo systemctl enable chess-api.service
sudo systemctl start chess-api.service

echo "API Service installed and started!"
echo "Status: sudo systemctl status chess-api.service"
echo "Logs: sudo journalctl -u chess-api.service -f"