This is a [Next.js](https://nextjs.org) project for converting PDF to various formats.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Also update the .env file like this:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

## Troubleshooting

### 413 Request Entity Too Large
If you see this error when uploading large files (e.g., PPT with images), it is caused by the Nginx proxy limit on your server.

**How to fix:**
1. SSH into your server.
2. Run the provided fix script: `bash ~/Filemint/FIX_SERVER_413_ERROR.sh`
3. Or manually add `client_max_body_size 100M;` to the `http` block in `/etc/nginx/nginx.conf` and restart Nginx.

