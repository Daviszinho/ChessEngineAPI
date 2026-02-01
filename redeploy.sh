#!/bin/bash

echo "🔄 Starting Chess Engine API redeploy with nginx config preservation..."

# Variables
APP_DIR="/home/daviszinho/ChessEngineAPI"
APP_NAME="chess-engine-api"
NODE_PORT=3000
NGINX_CONFIG="/etc/nginx/sites-available/chess-api.conf"
NGINX_BACKUP_DIR="/home/daviszinho/nginx-backups"

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

# Function to stop processes
stop_processes() {
    echo "🛑 Stopping running processes..."
    
    # Kill Node.js processes
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "proxy-server.js" 2>/dev/null || true
    
    # Wait a moment for processes to stop
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "node.*server.js" 2>/dev/null || true
    pkill -9 -f "proxy-server.js" 2>/dev/null || true
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
    nohup node src/server.js > app.log 2>&1 &
    APP_PID=$!
    
    # Start proxy server in background
    nohup node proxy-server.js > proxy.log 2>&1 &
    PROXY_PID=$!
    
    echo "✅ Application started with PIDs: $APP_PID (main), $PROXY_PID (proxy)"
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
    
    # Check if proxy is responding
    if curl -s http://localhost/api/health > /dev/null; then
        echo "✅ Proxy server is healthy"
    else
        echo "❌ Proxy server health check failed"
        return 1
    fi
    
    return 0
}

# Function to reload nginx (without modifying config)
reload_nginx() {
    echo "🌐 Reloading nginx (preserving current configuration)..."
    
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded successfully"
        echo "📍 Current configuration preserved for ports 80 and 443"
    else
        echo "⚠️  Nginx configuration test failed, attempting to restore from backup..."
        restore_nginx_config
        if sudo nginx -t; then
            sudo systemctl reload nginx
            echo "✅ Nginx restored and reloaded successfully"
        else
            echo "❌ Failed to restore nginx configuration"
            return 1
        fi
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
    
    # Start application
    start_application
    
    # Check health
    if check_health; then
        # Reload nginx (preserves current working configuration)
        reload_nginx
        
        echo "🎉 Redeploy completed successfully!"
        echo ""
        echo "📊 Application status:"
        echo "  Main API: http://localhost:$NODE_PORT"
        echo "  HTTPS (443): https://localhost"
        echo "  HTTP (80): http://localhost (redirects to HTTPS)"
        echo "  Health check: https://localhost/api/health"
        echo ""
        echo "🔧 Nginx configuration preserved for both ports"
        echo "💾 Nginx backups available in: $NGINX_BACKUP_DIR"
        echo ""
        echo "📝 Logs:"
        echo "  Main app: $APP_DIR/app.log"
        echo "  Proxy: $APP_DIR/proxy.log"
    else
        echo "❌ Health check failed. Checking logs..."
        echo "=== Main App Log ==="
        tail -20 app.log 2>/dev/null || echo "No main app log found"
        echo "=== Proxy Log ==="
        tail -20 proxy.log 2>/dev/null || echo "No proxy log found"
        exit 1
    fi
}

# Handle script interruption
trap 'echo "🛑 Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"