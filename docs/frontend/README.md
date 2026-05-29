# Frontend Documentation Index

> **Purpose**: Index of frontend documentation covering Next.js App Router architecture, component hierarchy, API integration, rendering flows, and styling conventions.
> **Audience**: Frontend developers, React/Next.js engineers.
> **Prerequisites**: [System architecture overview](../architecture/system-overview.md), [Data flow](../architecture/data-flow.md).
> **Related**: [frontend/README.md](../../frontend/README.md) for quick-start and dev commands.

## Documents

- **[architecture.md](./architecture.md)** — Next.js App Router structure, component hierarchy, routing, server/client split
- **[api-integration.md](./api-integration.md)** — Backend API consumption patterns, data normalization, image URL handling
- **[rendering-flow.md](./rendering-flow.md)** — Researcher page rendering pipeline, section page logic, gallery flow
- **[styling.md](./styling.md)** — Tailwind v4 architecture, academic theme, cn() utility, rich text rendering, CSS modules

## Key Rules

- **JavaScript only** — `.js` for plain JS, `.jsx` for JSX. No TypeScript.
- **Server Components by default** — only add `"use client"` for hooks, browser APIs, or event handlers
- **Path aliases** — always use `@/` for imports: `import { cn } from "@/lib/utils"`
- **cn() utility** — use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for class composition
- **Image URLs** — Wagtail returns relative paths; prefix with `NEXT_PUBLIC_WAGTAIL_BASE_URL` via `getWagtailBackendBaseUrl()`
- **Rich text** — `dangerouslySetInnerHTML` inside `.rich-text-content` containers
- **No test framework** — per AGENTS.md

## Quick Nav

- **Want to understand the component tree?** → [architecture.md](./architecture.md)
- **Debugging API data issues?** → [api-integration.md](./api-integration.md)
- **Tracing a page render?** → [rendering-flow.md](./rendering-flow.md)
- **Adding new styles?** → [styling.md](./styling.md)
