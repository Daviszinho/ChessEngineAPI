#!/bin/bash

echo "🔄 Starting Chess Engine API redeploy with nginx config preservation..."

# Variables
APP_DIR="/home/daviszinho/ChessEngineAPI"
APP_NAME="chess-engine-api"
NODE_PORT=3000
NGINX_CONFIG="/etc/nginx/sites-available/chess-api.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/chess-api.conf"
NGINX_BACKUP_DIR="/home/daviszinho/nginx-backups"
DOMAIN="daviszinhovm.westus2.cloudapp.azure.com"

# Function to check if process is running
is_process_running() {
    pgrep -f "$1" > /dev/null
    return $?
}

# Function to backup nginx configuration
backup_nginx_config() {
    echo "💾 Backing up nginx configuration..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p "$NGINX_BACKUP_DIR"
    
    # Create timestamped backup
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    sudo cp "$NGINX_CONFIG" "$NGINX_BACKUP_DIR/chess-api.conf.backup_$TIMESTAMP"
    
    echo "✅ Nginx configuration backed up to: chess-api.conf.backup_$TIMESTAMP"
}

# Function to restore nginx configuration
restore_nginx_config() {
    echo "🔧 Restoring nginx configuration..."
    
    # Get latest backup
    LATEST_BACKUP=$(sudo ls -t "$NGINX_BACKUP_DIR/chess-api.conf.backup_"* 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        sudo cp "$LATEST_BACKUP" "$NGINX_CONFIG"
        echo "✅ Restored nginx configuration from backup"
        return 0
    else
        echo "❌ No nginx backup found"
        return 1
    fi
}

# Function to update nginx configuration from repo
update_nginx_config() {
    echo "🔧 Updating nginx configuration from repository..."
    
    if [ -f "$APP_DIR/nginx/chess-api.conf" ]; then
        # Ensure SSL directory exists (in case it's a new setup)
        sudo mkdir -p /etc/ssl/private /etc/ssl/certs
        
        # Copy the config
        sudo cp "$APP_DIR/nginx/chess-api.conf" "$NGINX_CONFIG"
        
        # Ensure it's enabled
        if [ ! -L "$NGINX_ENABLED" ]; then
            sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
        fi
        # ALWAYS remove default if it exists to avoid port 80 conflicts
        sudo rm -f /etc/nginx/sites-enabled/default
        echo "✅ Nginx configuration updated and default site removed"
    else
        echo "⚠️  Nginx configuration file not found in repo: $APP_DIR/nginx/chess-api.conf"
    fi
}

# Function to stop processes
stop_processes() {
    echo "🛑 Stopping running processes..."
    
    # Kill Node.js processes
    pkill -f "src/server.js" 2>/dev/null || true
    pkill -f "proxy-server.js" 2>/dev/null || true
    
    # Stop the custom nginx service if it's running (to avoid port conflicts)
    if systemctl is-active --quiet chess-api-nginx.service; then
        echo "🛑 Stopping custom chess-api-nginx service..."
        sudo systemctl stop chess-api-nginx.service 2>/dev/null || true
        sudo systemctl disable chess-api-nginx.service 2>/dev/null || true
    fi
    
    # Wait a moment for processes to stop
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "node.*server.js" 2>/dev/null || true
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    cd "$APP_DIR"
    
    # Clean install to ensure fresh dependencies
    rm -rf node_modules package-lock.json
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
}

# Function to start the application
start_application() {
    echo "🚀 Starting application..."
    cd "$APP_DIR"
    
    # Start main application in background
    # Using PORT environment variable to ensure it matches NODE_PORT
    nohup env PORT=$NODE_PORT node src/server.js > app.log 2>&1 &
    APP_PID=$!
    
    # Note: proxy-server.js is deprecated in favor of Nginx
    # But we keep the PID variable for script compatibility
    PROXY_PID="N/A (using Nginx)"
    
    echo "✅ Application started with PID: $APP_PID (main)"
}

# Function to check application health
check_health() {
    echo "🏥 Checking application health..."
    
    # Wait for application to start
    sleep 5
    
    # Check if main app is responding
    if curl -s http://localhost:$NODE_PORT/api/health > /dev/null; then
        echo "✅ Main application is healthy"
    else
        echo "❌ Main application health check failed"
        return 1
    fi
    
    # Check if Nginx is responding on port 80 (should redirect 308 or serve 200)
    if curl -s -I http://localhost/api/health | grep -q "200\|301\|302\|308"; then
        echo "✅ Nginx is responding on port 80"
    else
        echo "❌ Nginx is not responding on port 80"
        return 1
    fi
    
    return 0
}

# Function to reload nginx
reload_nginx() {
    echo "🌐 Reloading nginx with updated configuration..."
    
    # Check syntax first
    if sudo nginx -t; then
        # Try to restart the system nginx
        if sudo systemctl restart nginx; then
            echo "✅ Nginx restarted successfully"
            echo "📍 Serving on ports 80 and 443 for $DOMAIN"
        else
            echo "❌ Failed to restart nginx service. Check 'journalctl -xeu nginx.service'"
            return 1
        fi
    else
        echo "⚠️  Nginx configuration test failed, attempting to restore from backup..."
        restore_nginx_config
        sudo systemctl restart nginx
        return 1
    fi
}

# Main deployment process
main() {
    echo "📍 Working directory: $APP_DIR"
    
    # Backup current nginx configuration before making any changes
    backup_nginx_config
    
    # Fetch latest from repository
    echo "📥 Fetching latest from repository..."
    cd "$APP_DIR"
    git fetch origin 
    if [ $? -ne 0 ]; then
        echo "❌ git fetch failed"
        exit 1
    fi
    git pull origin main
    if [ $? -ne 0 ]; then
        echo "❌ git pull failed"
        exit 1
    fi
    
    # Stop running processes
    stop_processes
    
    # Install dependencies
    install_dependencies
    
    # Update Nginx configuration from repo
    update_nginx_config
    
    # Reload Nginx FIRST so it can start serving
    reload_nginx || exit 1
    
    # Start application
    start_application
    
    # Check health
    if check_health; then
        echo "🎉 Redeploy completed successfully!"
        echo ""
        echo "📊 Application status:"
        echo "  Main API (internal): http://localhost:$NODE_PORT"
        echo "  External URL:        https://$DOMAIN/api/engines"
        echo "  Health check:        https://$DOMAIN/api/health"
        echo ""
        echo "🔧 Nginx is active on both ports 80 (redirect) and 443 (SSL)"
        echo "💾 Nginx backups available in: $NGINX_BACKUP_DIR"
        echo ""
        echo "📝 Logs:"
        echo "  Main app: $APP_DIR/app.log"
        echo "  Proxy: $APP_DIR/proxy.log"
    else
        echo "=== Main App Log ==="
        tail -20 app.log 2>/dev/null || echo "No main app log found"
        exit 1
    fi
}

# Handle script interruption
trap 'echo "🛑 Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"