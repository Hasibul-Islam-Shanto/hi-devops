# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server at localhost:4321
- `npm run build` — build production site to `./dist/`
- `npm run preview` — preview production build locally
- Node.js >= 22.12.0 required

## Architecture

Astro 6 static site for DevOps learning content. Dark-first theme with light mode toggle (`.light` class on `<html>`). Uses Tailwind CSS 4 via Vite plugin (not PostCSS), React 19 for interactive islands, and MDX for rich content.

**Layouts:** `BaseLayout.astro` is the root shell (SEO meta, JSON-LD, fonts, navbar, footer, search overlay). `TopicLayout.astro` wraps topic articles in a 3-column grid (sidebar | article | TOC) with responsive breakpoints at 1200px and 768px.

**Content collections** are defined in `src/content.config.ts` using Astro's glob loader:

- `linux` — Markdown files in `src/content/linux/`, schema: `{ title, description, order, topic }`. Ordered by `order` field.
- `blog` — Markdown/MDX in `src/content/blog/`, schema: `{ title, description, pubDate, tags, readTime, draft }`.

**Routing:** Topic articles render at `/topics/linux/[slug]` via `src/pages/topics/linux/[slug].astro`. Blog posts at `/blog/[slug]`.

**Search:** Client-side search (`Search.tsx`) fetches `/search-index.json` at runtime — this endpoint is generated at build time in `src/pages/search-index.json.ts` and currently only indexes the `linux` collection. When adding a new topic collection, update both `content.config.ts` and `search-index.json.ts`.

**Theming:** CSS custom properties in `src/styles/global.css` define the design system. Dark mode is the default; light mode overrides live under the `.light` selector. The "aurora" color palette (`--color-aurora-1` through `--color-aurora-5`) is used throughout.

## Adding a New Topic

1. Create `src/content/<topic>/` with Markdown files matching the `linux` collection schema (title, description, order, topic).
2. Add the collection to `src/content.config.ts`.
3. Create route pages at `src/pages/topics/<topic>/index.astro` and `[slug].astro` (mirror the linux folder).
4. Update the `topics` array in `src/pages/index.astro` to make it appear on the home page (set `available: true`).
5. Add the collection to the search index in `src/pages/search-index.json.ts`.
