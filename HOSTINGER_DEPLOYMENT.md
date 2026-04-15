# Hostinger Deployment Guide for Filemint

This guide explains how to deploy the Filemint Next.js application on Hostinger.

## Prerequisites

- Hostinger account with Node.js hosting (VPS or Managed Hosting)
- Node.js 20.x installed on server
- SSH access to your Hostinger server
- Domain configured to point to your Hostinger server

## Deployment Steps

### 1. Connect to Your Hostinger Server via SSH

```bash
ssh your_username@your_server_ip
```

### 2. Clone or Upload the Project

**Option A: Clone from Git**
```bash
cd /home/your_username/public_html
git clone https://github.com/your-repo/filemint.git
cd filemint
```

**Option B: Upload via FTP/SFTP**
- Upload all project files to `/home/your_username/public_html/filemint`

### 3. Install Dependencies

```bash
cd /home/your_username/public_html/filemint
npm install
```

### 4. Create Environment Variables

```bash
nano .env.local
```

Add the following:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_API_URL=https://your-domain.com
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
NODE_ENV=production
```

### 5. Build the Application

```bash
npm run build
```

This generates the `.next` directory with optimized production build.

### 6. Set Up PM2 for Process Management

PM2 keeps your app running and auto-restarts it if it crashes.

**Install PM2 globally (if not already installed):**
```bash
npm install -g pm2
```

**Create PM2 ecosystem file:**
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "filemint",
      script: "npm",
      args: "start",
      cwd: "/home/your_username/public_html/filemint",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "/var/log/filemint_error.log",
      output_file: "/var/log/filemint_out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};
EOF
```

**Start the app with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configure Nginx Reverse Proxy

Create/edit Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/filemint
```

Add this configuration:

```nginx
upstream filemint_app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Increase upload limit for large PDF files
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;

    location / {
        proxy_pass http://filemint_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the configuration:**
```bash
sudo ln -s /etc/nginx/sites-available/filemint /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 8. Set Up SSL Certificate with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 9. Set Up Auto-Updates via Git

Create a deployment script for easy updates:

```bash
cat > /home/your_username/public_html/filemint/deploy.sh << 'EOF'
#!/bin/bash
cd /home/your_username/public_html/filemint
git pull origin main
npm install
npm run build
pm2 restart filemint
echo "Deployment completed!"
EOF

chmod +x /home/your_username/public_html/filemint/deploy.sh
```

To deploy updates:
```bash
./deploy.sh
```

### 10. Set Up Logs and Monitoring

View logs:
```bash
# Application logs
pm2 logs filemint

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

Monitor the app:
```bash
pm2 monit
```

## Firewall Configuration

Allow necessary ports:
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Database Setup

For MongoDB:
1. Use MongoDB Atlas (cloud) - set up IP whitelist for your server
2. Or install MongoDB locally on your server

Update `MONGODB_URI` in `.env.local` accordingly.

## AWS S3 Configuration

1. Create an IAM user with S3 access
2. Generate access keys
3. Create an S3 bucket with proper CORS settings
4. Update `.env.local` with AWS credentials

Refer to [AWS-S3-SETUP.md](AWS-S3-SETUP.md) for detailed S3 configuration.

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### PM2 Not Starting
```bash
pm2 delete filemint
pm2 start ecosystem.config.js
pm2 status
```

### Nginx Issues
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### High Upload Limit Issues
If you get 413 errors, ensure `client_max_body_size 100M;` is set in Nginx config.

## Performance Optimization

1. **Enable Caching Headers**: Set appropriate cache headers in Nginx
2. **Use CDN**: Consider using Cloudflare or Bunny CDN for static assets
3. **Monitor Memory**: Use `free -h` and `ps aux` to monitor resource usage
4. **Enable Swap**: Add swap space if needed for memory management

## Backup Strategy

Regular backups:
```bash
cd /home/your_username/public_html
tar -czf filemint-backup-$(date +%Y%m%d).tar.gz filemint/
```

Or use Hostinger's automated backup feature.

## Next Steps

1. Update your DNS to point to Hostinger
2. Test the deployed application
3. Monitor logs and performance
4. Set up automated backups
5. Configure email notifications for errors (optional)

For support, contact Hostinger customer service or refer to their documentation.
