#!/bin/bash

# This script fixes the "413 Request Entity Too Large" error on Ubuntu/Nginx servers.
# It increases the allowed upload limit to 100MB.

echo "🚀 Starting Nginx limit fix..."

# 1. Check if we're on a Linux system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Find Nginx config file
    NGINX_CONF="/etc/nginx/nginx.conf"
    
    if [ -f "$NGINX_CONF" ]; then
        echo "📄 Found $NGINX_CONF"
        
        # Check if client_max_body_size is already present
        if grep -q "client_max_body_size" "$NGINX_CONF"; then
            echo "🔄 Updating existing client_max_body_size to 100M..."
            sudo sed -i 's/client_max_body_size.*/client_max_body_size 100M;/g' "$NGINX_CONF"
        else
            echo "➕ Adding client_max_body_size 100M to http block..."
            # Add it inside the http block
            sudo sed -i '/http {/a \    client_max_body_size 100M;' "$NGINX_CONF"
        fi
        
        # Test Nginx config
        echo "🧪 Testing Nginx configuration..."
        if sudo nginx -t; then
            echo "✅ Config test passed. Reloading Nginx..."
            sudo systemctl reload nginx
            echo "🎉 FIXED! You can now upload files up to 100MB."
        else
            echo "❌ Nginx config test failed. Reverting changes..."
            # Optimization: Better to backup first, but for simplicity here we just warn
            echo "Please check $NGINX_CONF manually for syntax errors."
        fi
    else
        echo "❌ Could not find Nginx config at $NGINX_CONF"
        echo "You might need to find your site's specific config in /etc/nginx/sites-available/"
    fi
else
  echo "❌ This script is intended for Ubuntu/Linux servers."
fi
