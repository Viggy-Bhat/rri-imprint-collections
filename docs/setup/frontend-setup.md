# Frontend Setup

> **Purpose**: Complete guide for setting up the Next.js/React frontend.
> **Audience**: Frontend developers.
> **Prerequisites**: Node.js 18.18+ installed. [Getting started](./getting-started.md) for the quick version.

---

## 1. Prerequisites

| Requirement | Minimum | Verified |
|-------------|---------|----------|
| Node.js | 18.18+ | No `.nvmrc` in repo; Next.js 16 enforces minimum |
| npm | 9+ | `package-lock.json` confirms npm |
| Backend | Running at `http://127.0.0.1:8000` | Required for API data and image serving |

Verify versions:
```bash
node --version    # Should be v18.18.x or later
npm --version     # Should be 9.x or later
```

**No `yarn` or `pnpm`** — this project uses npm exclusively.

---

## 2. Dependencies

```bash
cd frontend
npm install
```

**Expected output**: Progress bars showing package downloads. This installs ~5 production dependencies and ~4 dev dependencies.

### Dependency Summary (Verified from `package.json`)

| Package | Version | Category |
|---------|---------|----------|
| next | 16.2.3 | Framework — pinned |
| react | 19.2.4 | UI library — pinned |
| react-dom | 19.2.4 | React DOM — pinned |
| clsx | ^2.1.1 | Class name utility |
| tailwind-merge | ^3.5.0 | Tailwind class merging |
| tailwindcss | ^4 | CSS framework — dev |
| @tailwindcss/postcss | ^4 | PostCSS plugin — dev |
| eslint | ^9 | Linter — dev |
| eslint-config-next | 16.2.3 | Next.js lint rules — pinned |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Turbopack config, image remote patterns |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS plugin |
| `eslint.config.mjs` | ESLint 9 flat config |
| `package-lock.json` | Dependency lockfile (npm) |

---

## 3. Environment Configuration

The frontend uses one environment variable:

| Variable | Default (hardcoded) | Purpose |
|----------|---------------------|---------|
| `NEXT_PUBLIC_WAGTAIL_BASE_URL` | `http://127.0.0.1:8000` | Backend API base URL |

The default is defined in `app/lib/config.js`. If the backend is not at `http://127.0.0.1:8000`, create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` to set the correct URL:
```
NEXT_PUBLIC_WAGTAIL_BASE_URL=http://your-backend-host:8000
```

**How the base URL is used**: Two functions in `app/lib/config.js`:
- `getWagtailBackendBaseUrl()` — reads `NEXT_PUBLIC_WAGTAIL_BASE_URL`, strips trailing slashes
- `getWagtailPagesApiUrl()` — appends `/api/v2/pages/` to the base URL

Image URLs returned by the API (relative paths like `/media/images/photo.png`) are prefixed with this base URL in `app/lib/wagtailApi.js`.

---

## 4. Development Server

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 16.2.3 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Starting...
✓ Ready in Xms
```

The `(Turbopack)` label confirms Turbopack is active (configurable in `next.config.mjs`).

**Hot reload**: Editing any file under `app/` or `components/` triggers instant refresh. No manual restart needed.

---

## 5. Project Structure

```
frontend/
├── app/                         # App Router pages and components
│   ├── layout.js                # Root layout (Server Component)
│   ├── page.js                  # Home page listing researchers
│   ├── globals.css              # Theme, typography, utilities
│   ├── loading.js               # Loading UI
│   ├── lib/                     # App-specific utilities
│   │   ├── config.js            # API base URL config
│   │   ├── wagtailApi.js        # Image fetching utilities
│   │   ├── siteSettingsApi.js   # Site settings fetching (ISR)
│   │   └── formatDate.js        # Date formatting
│   └── researcher/              # Researcher routes
│       └── [slug]/              # Dynamic researcher pages
│           ├── page.js          # Researcher profile
│           ├── researcherApi.js # Researcher data fetching
│           ├── section/         # Section detail pages
│           ├── publications/    # Publications listing
│           ├── guidance/        # Guidance listing
│           └── gallery/         # Gallery page
├── components/                  # Shared UI components (25 files)
│   ├── layout/                  # Header, Footer, Breadcrumb
│   ├── researchers/             # Profile, Sidebar, Biography
│   ├── archive/                 # Archive filtering
│   ├── gallery/                 # Gallery viewer and carousel
│   ├── media/                   # ProtectedImage
│   └── ui/                      # Shared UI primitives (Card)
├── lib/
│   └── utils.js                 # cn() utility (clsx + tailwind-merge)
├── public/
│   └── assets/background/
│       └── rri-pattern.png      # Background pattern (required)
├── package.json
├── next.config.mjs
├── postcss.config.mjs
└── eslint.config.mjs
```

**Important**: Uses only `.js` and `.jsx` extensions — no TypeScript.

---

## 6. Building for Production

```bash
npm run build
```

**Expected output**: Compilation logs for each page route, ending with:
```
✓ Compiled successfully
```

After build, the production server:
```bash
npm run start
```

Serves on port 3000 by default.

---

## 7. Linting

```bash
npm run lint
```

Uses ESLint 9 flat config with `eslint-config-next/core-web-vitals`.

---

## 8. Image Handling

Images from Wagtail arrive as relative URLs (e.g., `/media/images/photo.png`). The frontend prefixes them with `NEXT_PUBLIC_WAGTAIL_BASE_URL` in `app/lib/wagtailApi.js`.

**Next.js image optimization** is configured in `next.config.mjs`:
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
  ],
},
```

This only covers development (`http` from localhost). **Production deployments must add their own `remotePatterns` entries** for the production backend hostname and protocol.

---

## 9. Verification Checklist

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts on `http://localhost:3000`
- [ ] Home page loads and shows "From the Archives..." heading
- [ ] If backend is running with published pages, researchers appear in the list
- [ ] Images display correctly (backend must be running)
- [ ] `npm run build` completes successfully
- [ ] `npm run lint` passes with no errors

---

## 10. Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Images are broken | Backend not running or wrong base URL | Check `.env.local`; verify backend is running |
| Home page shows "Profiles" section but no researchers | No published ResearcherPages | Publish pages in Wagtail admin |
| `npm install` fails with network error | Proxy/firewall | Try `npm install --registry https://registry.npmjs.org/` |
| ESLint errors after clone | Environment mismatch | Run `npm install` to sync dependencies |
| Turbopack errors on start | Corrupted `.next` cache | `rm -rf .next && npm run dev` |
| Port 3000 already in use | Another process | `lsof -i :3000` then kill, or use `-p 3001` |

---

## 11. Related Documentation

- **[backend-setup.md](./backend-setup.md)** — Backend setup
- **[environment-variables.md](./environment-variables.md)** — Variable reference
- **[architecture/system-overview.md](../architecture/system-overview.md)** — Architecture overview
- **[frontend/architecture.md](../frontend/architecture.md)** — Component architecture
- **[frontend/api-integration.md](../frontend/api-integration.md)** — API integration patterns
- **[frontend/rendering-flow.md](../frontend/rendering-flow.md)** — Rendering pipeline
