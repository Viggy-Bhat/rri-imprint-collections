# Frontend Deployment — Next.js

Build and run the Next.js frontend as a systemd service.

## 1. Install Dependencies

```bash
su - rri bash -c "
  cd /opt/rri-imprint/frontend
  npm install
"
```

**Note**: This project has a `package-lock.json`, so `npm install` produces deterministic builds.

## 2. Configure Environment

```bash
su - rri bash -c "
  echo 'NEXT_PUBLIC_WAGTAIL_BASE_URL=https://yourdomain.com' > /opt/rri-imprint/frontend/.env.local
"
```

**Why**: This tells the frontend where to find the backend API. The `NEXT_PUBLIC_` prefix makes it available in client-side code. In production, this must be the full HTTPS URL of the backend (same domain as the frontend — Nginx routes `/api/` to Django).

## 3. Update Image Remote Patterns

The frontend uses Next.js Image Optimization for Wagtail images. It needs to know which external hosts are allowed.

Edit `/opt/rri-imprint/frontend/next.config.mjs` and add an entry for your production domain in the `images.remotePatterns` array:

```js
images: {
  remotePatterns: [
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "8000",
      pathname: "/media/**",
    },
    {
      protocol: "http",
      hostname: "localhost",
      port: "8000",
      pathname: "/media/**",
    },
    // ADD THIS for production:
    {
      protocol: "https",
      hostname: "yourdomain.com",
      pathname: "/media/**",
    },
  ],
},
```

**Why**: Without this, Next.js will refuse to optimize images served from your production domain over HTTPS. Images will appear broken on researcher pages.

## 4. Build the Application

```bash
su - rri bash -c "
  cd /opt/rri-imprint/frontend
  NODE_ENV=production npm run build
"
```

This produces an optimized production build in the `.next/` directory. The build step compiles React components, runs Tailwind CSS, and optimizes assets.

### Verification

Check the build output for any errors or warnings. A successful build ends with:

```
✓ Compiled successfully
✓ Linting and checking succeeded
```

## 5. Set Up Next.js Systemd Service

Create `/etc/systemd/system/rri-frontend.service`:

```ini
[Unit]
Description=RRI Frontend — Next.js
After=network.target

[Service]
User=rri
Group=rri
WorkingDirectory=/opt/rri-imprint/frontend
Environment=NODE_ENV=production

ExecStart=/usr/bin/node node_modules/.bin/next start --port 3000

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rri-frontend
```

### Verification

```bash
sudo systemctl status rri-frontend
# Expected: Active: active (running)

# Test locally (this port should NOT be exposed to the internet)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/
# Expected: 200
```

**Important**: Port 3000 is not firewalled because Nginx will proxy traffic to it from port 443. Do not expose port 3000 directly. If you run `ufw status`, it should NOT list port 3000.

## 6. Verify End-to-End

At this point the frontend and backend are both running. You can verify they work together:

```bash
# The frontend should be able to fetch from the backend
curl -s http://127.0.0.1:3000 | head -c 500
# Expected: HTML output — the home page listing researchers
```

If the frontend page loads but shows no data, check:
- The backend is running: `sudo systemctl status rri-backend`
- The backend is reachable from the frontend server: `curl http://127.0.0.1:8000/api/site-settings/`
- CORS is configured if the frontend is on a different domain

## Summary — What You Have After This Step

- [x] Frontend dependencies installed
- [x] `.env.local` configured with backend API URL
- [x] `next.config.mjs` updated with HTTPS image patterns
- [x] Production build completed successfully
- [x] Next.js running as a systemd service on port 3000 (local only)
- [x] Frontend and backend communicating

Next step: `nginx-config.md`
