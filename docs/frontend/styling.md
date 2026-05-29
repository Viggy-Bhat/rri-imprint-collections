# Styling

> **Purpose**: Complete reference for the Tailwind CSS v4 styling architecture — theme system, utility conventions, rich text rendering, responsive design, and CSS module patterns.
> **Audience**: Frontend developers working on visual design or adding new components.
> **Prerequisites**: [Architecture](./architecture.md).
> **Related**: [Rendering flow](./rendering-flow.md), [frontend/README.md](../../frontend/README.md).

## 1. Styling Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Tailwind CSS v4 | `^4` |
| PostCSS plugin | `@tailwindcss/postcss` | `^4` |
| CSS preprocessor | None (no Sass/Less) | — |
| CSS Modules | Yes, for `SiteHeader.jsx` only | Built-in |
| Class merging | `clsx` + `tailwind-merge` via `cn()` | `^2.1.1` / `^3.5.0` |
| Linting | ESLint 9 (`eslint-config-next/core-web-vitals`) | `^9` / `16.2.3` |

**PostCSS configuration** (`postcss.config.mjs`):
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

There is no `tailwind.config.js` — Tailwind v4 uses CSS-based configuration exclusively via `@theme` and `@import`.

## 2. Theme System

### CSS Custom Properties

Defined in `app/globals.css`:

```css
:root {
  --background: #f8f6f2;
  --foreground: #222;
  --accent: #8b1f1f;
  --accent-light: #fff5f5;
}
```

### @theme inline Mapping

Maps CSS variables to Tailwind utility tokens:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

Only four tokens are mapped to Tailwind's theme. All other colors used in components (red-800, amber-50, gray-700, etc.) come from Tailwind's default palette.

### Font System

| Font | Source | Usage | CSS Variable |
|---|---|---|---|
| Geist Sans | `next/font/google` | UI text, buttons, labels | `--font-geist-sans` |
| Geist Mono | `next/font/google` | Monospace content | `--font-geist-mono` |
| Playfair Display | Google Fonts CSS `@import` | All headings (h1-h6), serif titles | Direct font-family |
| Libre Baskerville | Google Fonts CSS `@import` | Body text, paragraphs, lists, rich text | Direct font-family |

The Google Fonts import is a CSS `@import` statement, not Next.js `next/font/google`:

```css
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap");
```

This means Playfair Display and Libre Baskerville receive no font optimization (no subsetting, no `font-display: swap` from Next.js, no self-hosting).

### Typography Scale

```css
h1 { font-family: "Playfair Display", serif; font-size: 2.5rem; font-weight: 700; }
h2 { font-family: "Playfair Display", serif; font-size: 2rem;   font-weight: 600; }
h3 { font-family: "Playfair Display", serif; font-size: 1.5rem; font-weight: 600; }
p, li { font-family: "Libre Baskerville", serif; font-size: 16px; line-height: 1.7; }
```

## 3. cn() Utility

**File**: `lib/utils.js` (6 lines)

```javascript
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

**How it works**:
1. `clsx(inputs)` — resolves conditional class expressions, arrays, and objects into a single string. Accepts strings, arrays, and `{class: boolean}` objects.
2. `twMerge(output)` — resolves Tailwind class conflicts (e.g., `px-4 px-6` → last wins). Uses `tailwind-merge` which understands Tailwind's class semantics.

**Usage examples**:
```javascript
// Conditional classes
className={cn("card-academic p-6", isActive && "border-red-500")}

// Override defaults
className={cn("btn-primary", className)}

// Responsive with conflict resolution
className={cn("lg:w-80", wide && "xl:w-96")}
```

## 4. Rich Text Rendering

Rich text content from Wagtail's `RichTextBlock` arrives as HTML strings. Components render it with:

```jsx
<div
  className="rich-text-content"
  dangerouslySetInnerHTML={{ __html: section.content }}
/>
```

This uses `dangerouslySetInnerHTML`. The input is trusted because content originates from the Wagtail CMS admin (not from end users).

### .rich-text-content Styles

```css
.rich-text-content {
  font-family: "Libre Baskerville", serif;
  font-size: 16px;
  line-height: 1.8;
}

.rich-text-content p        { margin-bottom: 1rem; margin-top: 0.5rem; }
.rich-text-content a        { color: #8b1f1f; text-decoration: underline; }
.rich-text-content a:hover  { opacity: 0.8; }
.rich-text-content ul       { padding-left: 20px; list-style-type: disc; }
.rich-text-content ol       { padding-left: 20px; list-style-type: decimal; }
.rich-text-content blockquote { border-left: 4px solid #8b1f1f; padding-left: 1rem; font-style: italic; color: #555; }
.rich-text-content h2       { font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1rem; }
.rich-text-content h3       { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
```

### Content Class Combinations

Components use multiple class layers on rich text containers:

```jsx
// BiographySections.jsx
<div
  className="bio-section-content cms-content rich-text-content px-5 sm:px-7 py-5 prose max-w-none text-gray-900 prose-p:leading-7 prose-a:text-red-700 prose-a:underline"
  dangerouslySetInnerHTML={{ __html: section.content }}
/>
```

This combines `.bio-section-content` (justified text), `.cms-content` (17px font, 1.8 line-height, Playfair headings, drop cap support), `.rich-text-content` (standard block styling), and Tailwind prose utilities.

### .cms-content Additional Styles

```css
.cms-content            { font-family: "Libre Baskerville", serif; font-size: 17px; line-height: 1.8; color: #222; max-width: 800px; }
.cms-content h2         { font-family: "Playfair Display", serif; font-size: 26px; color: #8b1f1f; margin-top: 40px; text-align: center; }
.cms-content h3         { font-family: "Playfair Display", serif; font-size: 20px; color: #8b1f1f; margin-top: 30px; }
.cms-content hr         { border: none; border-top: 1px solid #ddd; margin: 40px 0; }
.cms-content.drop-cap p:first-child::first-letter { font-size: 32px; font-weight: bold; color: #8b1f1f; }
```

## 5. Academic UI Utilities

### Card

```css
.card-academic {
  @apply bg-[#efe9dc] border border-[#d9cfc1] rounded-xl shadow-sm;
}
.card-academic:hover {
  @apply shadow-md;
}
```

Used in: `SmartContentRenderer` (all block types), section content wrappers.

### Buttons

```css
.btn-primary   { @apply bg-[#8b1c1c] text-white px-6 py-2 rounded-lg hover:bg-[#6b1515] transition-colors font-medium; }
.btn-secondary { @apply bg-neutral-200 text-neutral-900 px-6 py-2 rounded-lg hover:bg-neutral-300 transition-colors font-medium; }
.btn-outline   { @apply border border-[#8b1c1c] text-[#8b1c1c] px-6 py-2 rounded-lg hover:bg-[#f7f3ea] transition-colors font-medium; }
```

Note: `btn-primary` uses `#8b1c1c` (brighter red) while `h1-h6` use `#8b1f1f` (darker red). The color inconsistency is present in the source code.

### Badges

```css
.badge-primary   { @apply inline-block bg-[#8b1c1c]/10 text-[#8b1c1c] px-3 py-1 rounded-full text-xs font-semibold; }
.badge-secondary { @apply inline-block bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-xs font-semibold; }
```

### Divider

```css
.divider-academic { @apply h-px w-20 bg-[#8b1c1c] mx-auto my-6; }
```

### Section Header

```css
.section-header-academic { @apply text-center space-y-3; }
.section-header-academic h1 { @apply text-4xl font-bold text-[#8b1c1c] font-serif; }
.section-header-academic h2 { @apply text-2xl font-semibold text-[#8b1c1c] font-serif; }
.section-header-academic .subtitle { @apply text-red-700 font-medium; }
```

## 6. Responsive Design

### Breakpoint Strategy

Uses Tailwind's default breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

### Researcher Page Layout Shifts

| Breakpoint | Layout |
|---|---|
| Mobile (`< md`) | Vertical stack: sidebar drawer, content, profile card, bio sections |
| Tablet+ (`>= md`) | Flex row: sidebar (w-52) + content (flex-1) + profile card (w-80) |

The `ResearcherPageLayout` component uses `hidden md:block` and `md:hidden` to switch between these layouts. The mobile sidebar (`MobileSectionsSidebar`) is a slide-out drawer triggered by a hamburger button.

### Section Page Layout

On section pages with filterable archives, the layout shifts at `lg`:

```css
grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]
```

Results column on the left, filter panel on the right (re-ordered via `order-1`/`order-2`). On mobile, the filter panel collapses behind a "Filter Results" toggle button.

### Profile Card

The profile card uses `xl:sticky xl:top-6` to stick to the viewport on larger screens:

```jsx
<section className="... xl:sticky xl:top-6">
```

## 7. CSS Modules

### SiteHeader.module.css

The only CSS Module in the project (`components/layout/SiteHeader.module.css`, 129 lines). Contains:

- **`.siteHeader`**: Flex column, centered, cream background (`#f8f6f2`)
- **`.heroTitle` / `.heroTitleCompact`**: Responsive font sizes via `clamp()` — `1.7rem` to `2.6rem`
- **`.imprintsBadge`**: Red badge (`#8c1d1d`) with white text, upper-margin 12px, letter-spacing 1.2px
- **`.imprintsBadge::after`**: Pseudo-element creating a **double-border effect** — white 1px inset border on the red badge
- **`.headerDivider`**: Light pink top border (`#f4a3ad`) at 80rem max-width

### When to Use CSS Modules vs Tailwind

| Approach | When Used |
|---|---|
| Tailwind utility classes | All components by default |
| CSS Modules | Only `SiteHeader.jsx` — for the badge pseudo-element effect which cannot be expressed with Tailwind utilities |

The `::after` pseudo-element on `.imprintsBadge` requires a CSS Module because Tailwind has no utility for pseudo-element borders inside elements.

## 8. Loading Skeletons

### .skeleton Class

```css
.skeleton {
  position: relative;
  overflow: hidden;
  background: #e5e7eb;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: skeleton-shimmer 1.2s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}
```

The shimmer animation sweeps a white gradient from left to right across the gray background, creating a loading indicator. Duration is 1.2 seconds, easing is `ease-in-out`, infinite loop.

### Usage Pattern

```jsx
<div className="skeleton h-5 w-full rounded-md" />
```

Different heights and widths simulate different content types (titles, paragraphs, images).

## 9. Gallery Styles

```css
.gallery-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4;
}

.gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.05);
}

.gallery-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  transition: transform 300ms ease;
  user-select: none;
  -webkit-user-drag: none;
}

.gallery-caption {
  @apply text-sm text-center text-neutral-600 mt-2 leading-snug;
}
```

Gallery images use `user-select: none` and `-webkit-user-drag: none` to prevent copying and dragging. The hover effect scales the image by 5% with a 300ms ease transition.

### Lightbox Overlay

The `GalleryCarousel` component creates a full-screen lightbox using fixed positioning with a dark overlay. Specific classes are inline in the component, not in `globals.css`.

## 10. Background Pattern

The project references a background pattern image at `public/assets/background/rri-pattern.png`. The body background is set to a solid cream color (`#f8f6f2`) in `globals.css`:

```css
body {
  background-color: #f8f6f2;
  color: #222;
  font-family: "Libre Baskerville", serif;
}
```

The background pattern image file (`rri-pattern.png`) does not currently exist in the repository. The `site-container` class applies a semi-transparent gradient overlay:

```css
.site-container {
  background: linear-gradient(rgba(248, 246, 242, 0.8), rgba(248, 246, 242, 0.8));
  min-height: auto;
  padding-bottom: 60px;
}
```

## 11. Known Styling Issues

| Issue | Impact |
|---|---|
| Background pattern image missing | `rri-pattern.png` referenced but does not exist in the repo. Fallback is solid cream color only. |
| Playfair Display + Libre Baskerville via CSS only | Loaded via `@import` instead of `next/font/google`. No font optimization (subsetting, self-hosting, `size-adjust`). Causes layout shift on first load. |
| No dark mode support | All colors are hardcoded. No `prefers-color-scheme` handling, no CSS variable-based theming for dark mode. |
| Color inconsistency | `#8b1f1f` used for headings/rich text vs `#8b1c1c` used for buttons/badges. Almost identical but technically different values. |
| Tailwind v4 `@apply` | `@apply` in CSS for `.card-academic`, `.btn-*`, `.badge-*`, etc. Tailwind v4 is moving away from `@apply` in favor of component-based styling, though it remains supported. |
| `.site-container` not used | The class is defined in CSS but does not appear in any JSX component. Dead code. |
| Profile card mobile styles | Uses named CSS classes (`.profile-summary-card`, `.profile-summary-image`) at specific media queries instead of Tailwind's responsive prefixes. Duplicates what Tailwind utilities could express. |
