# AGENTS.md - Developer Guidelines

This file provides guidelines for AI agents working on this codebase.

## Project Overview

This is a Next.js 16.2.0 frontend application with React 19.2.4, using Tailwind CSS v4 for styling. It connects to a Django/Wagtail CMS backend to display researcher information.

## IMPORTANT: Next.js Version Warning

<!-- BEGIN:nextjs-agent-rules -->
This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Running a Single Lint Check
```bash
# Lint a specific file
npx eslint app/page.js

# Lint with auto-fix
npx eslint app/page.js --fix
```

**Note:** No test framework is currently configured. Do not add tests unless explicitly requested.

---

## Code Style Guidelines

### Language
- JavaScript (not TypeScript) - use JSDoc comments for type hints when helpful
- React Server Components by default; use `"use client"` directive only when client-side interactivity is needed

### File Extensions
- Use `.js` for files without JSX
- Use `.jsx` for files containing JSX

### Imports

**Use path aliases (`@/` prefix):**
```javascript
import { Component } from "@/app/components/Component";
import { utility } from "@/lib/utils";
import { config } from "@/app/lib/config";
```

**Order imports:**
1. Next.js/React imports
2. External libraries
3. Path alias imports (`@/`)
4. Relative imports

```javascript
import Link from "next/link";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Footer } from "@/app/components/Footer";
import localModule from "./localModule";
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ResearcherSearchList`, `FooterLeft`)
- **Files**: PascalCase for components (`.jsx`), camelCase for utilities (`.js`)
- **Functions**: camelCase, verb-prefixed for actions (e.g., `fetchImageDetails`, `getResearchers`)
- **Constants**: camelCase for runtime constants, UPPER_SNAKE for config values
- **CSS classes**: kebab-case (Tailwind utility classes)

### Component Structure

```javascript
"use client";  // Only if client-side interactivity needed

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ComponentName({ prop1, prop2 = "default", className = "", ...props }) {
  const [state, setState] = useState(null);

  const computedValue = useMemo(() => {
    return prop1?.length || 0;
  }, [prop1]);

  return (
    <div className={cn("base-classes", className)} {...props}>
      {children}
    </div>
  );
}
```

### Error Handling

- Use try/catch for async operations
- Return graceful fallbacks rather than throwing errors
- Use `console.warn` for non-critical failures, `console.error` for actual errors

```javascript
async function fetchData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[fetchData] Failed: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[fetchData] Error:`, error);
    return null;
  }
}
```

### CSS and Styling

- Use Tailwind CSS v4 utilities exclusively
- Use `@apply` directive in `globals.css` for reusable component classes
- Use `cn()` utility (from `@/lib/utils`) to merge Tailwind classes
- Use CSS variables defined in `:root` for theming

```javascript
import { cn } from "@/lib/utils";

// Good
<div className={cn("base-classes", variantClasses[variant], className)} />

// Avoid
<div className={`base-classes ${variantClasses[variant]} ${className}`} />
```

### Tailwind Color Palette

The project uses a custom academic theme:
- Primary accent: `#8b1c1c` (deep red)
- Secondary accent: `#8b1f1f` (slightly different red)
- Background: `#f8f6f2` (warm cream)
- Use neutral grays for non-accent colors

### React Patterns

- Destructure props with default values for optional props
- Use early returns for conditionals in components
- Memoize expensive computations with `useMemo`
- Use `useCallback` for function props passed to child components

### Server Components vs Client Components

- Default to Server Components (no directive)
- Add `"use client"` only when:
  - Using React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
  - Using browser-only APIs
  - Using event handlers (`onClick`, `onChange`, etc.)

---

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.js            # Home page
│   ├── layout.js          # Root layout
│   ├── components/        # Page-specific components
│   │   ├── researcher/   # Researcher-related components
│   │   ├── media/        # Media components
│   │   └── blocks/       # Wagtail streamfield blocks
│   └── lib/              # API and config utilities
├── components/            # Shared UI components
│   └── ui/               # Reusable UI primitives
├── lib/                  # Shared utilities
│   └── utils.js          # cn() utility
├── styles/               # Additional CSS
└── public/               # Static assets
```

---

## Environment Variables

Create `.env.local` from `.env.example`:
```
NEXT_PUBLIC_WAGTAIL_BASE_URL=http://127.0.0.1:8000
```

---

## Common Tasks

### Adding a New Page
1. Create `app/[slug]/page.js` for dynamic routes
2. Export async function `Page({ params })`
3. Fetch data server-side
4. Return JSX with components

### Adding a New Component
1. Place in appropriate directory (`components/ui/` for primitives, `app/components/` for page-specific)
2. Use `cn()` for className composition
3. Accept `className` prop for customization

### Adding a New API Call
1. Add to appropriate file in `app/lib/`
2. Include error handling with try/catch
3. Use `console.warn`/`console.error` with prefixes like `[functionName]`
