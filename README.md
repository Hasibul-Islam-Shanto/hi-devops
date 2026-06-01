# hi-devops

A personal DevOps learning site built with [Astro](https://astro.build). Practical notes, real commands, and scripts from a path to becoming a DevOps engineer — covering Linux, Docker, Kubernetes, and more.

## Project Structure

```text
/
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── hi_devops_logo.webp
├── src/
│   ├── components/
│   │   ├── CodeBlock.tsx       # Syntax-highlighted code block (React)
│   │   ├── Navbar.astro        # Site navigation with theme toggle
│   │   ├── Search.tsx          # Client-side content search (React)
│   │   ├── TableOfContents.tsx # Auto-generated TOC for topic pages (React)
│   │   ├── ThemeToggle.tsx     # Dark / light mode toggle (React)
│   │   └── TopicSidebar.astro  # Sidebar listing topic articles
│   ├── content/
│   │   └── linux/              # Markdown articles for the Linux topic
│   │       ├── basic-linux.md
│   │       ├── bash-basics.md
│   │       ├── bash-examples.md
│   │       ├── commands.md
│   │       ├── file-permissions.md
│   │       └── scenario-questions.md
│   ├── layouts/
│   │   ├── BaseLayout.astro    # Root HTML shell (navbar, theme, global CSS)
│   │   └── TopicLayout.astro   # Layout for topic pages (sidebar + TOC)
│   ├── pages/
│   │   ├── index.astro         # Home page with topic cards
│   │   ├── search-index.json.ts# Builds the JSON search index at build time
│   │   ├── blog/
│   │   │   ├── index.astro     # Blog listing page
│   │   │   └── [slug].astro    # Individual blog post page
│   │   └── topics/
│   │       └── linux/
│   │           ├── index.astro # Linux topic overview
│   │           └── [slug].astro# Individual Linux article page
│   ├── styles/
│   │   └── global.css          # Global styles and Tailwind base
│   └── content.config.ts       # Astro content collection schemas
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Topics

| Topic      | Status      |
| :--------- | :---------- |
| Linux      | Available   |
| Docker     | Coming soon |
| Ansible    | Coming soon |
| Terraform  | Coming soon |
| Kubernetes | Coming soon |
| CI/CD      | Coming soon |

## Tech Stack

- [Astro 6](https://astro.build) — static site framework
- [React 19](https://react.dev) — interactive components (search, TOC, theme toggle)
- [Tailwind CSS 4](https://tailwindcss.com) — utility-first styling (via Vite plugin)
- [MDX](https://mdxjs.com) — Markdown + JSX for rich content pages
- [Lucide React](https://lucide.dev) — icon library

## Commands

All commands are run from the root of the project:

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Start local dev server at `localhost:4321`  |
| `npm run build`   | Build the production site to `./dist/`      |
| `npm run preview` | Preview the production build locally        |
| `npm run astro`   | Run Astro CLI commands                      |

## Requirements

- Node.js `>=22.12.0`
