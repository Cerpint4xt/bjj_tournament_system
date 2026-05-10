# BJJ Scoreboard — Serve & Deploy Guide

This guide covers how to run the scoreboard locally and how to deploy it to GitHub Pages for free public hosting.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Git](https://git-scm.com/)
- A GitHub account (for deployment only)

---

## Running Locally

### 1. Get onto the scoreboard branch

```bash
git checkout stage1/scoreboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open your browser at **http://localhost:3000**

The page hot-reloads on every file save — no restart needed during development.

### Other useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Build optimized production output |
| `npm start` | Serve the production build locally |
| `npm run lint` | Run ESLint checks |

> **Note:** All match data is saved in your browser's `localStorage` under the key `bjj:current_match`. Clearing browser data will reset the scoreboard.

---

## Deploying to GitHub Pages

The scoreboard is 100% client-side — no server, no database, no API calls. This makes it a perfect fit for GitHub Pages (free static hosting).

### Step 1 — Configure Next.js for static export

Edit `next.config.ts` and replace its contents with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/YOUR-REPO-NAME",   // ← replace with your actual GitHub repo name
  images: { unoptimized: true }, // required for static export
};

export default nextConfig;
```

> Example: if your repo is `github.com/yourname/bjj-scoreboard`, set `basePath: "/bjj-scoreboard"`

### Step 2 — Build the static site

```bash
npm run build
```

This generates an `out/` folder containing the complete static site.

### Step 3 — Deploy to GitHub Pages

**Option A — Automatic (GitHub Actions) — recommended**

Create the file `.github/workflows/deploy.yml` with this content:

```yaml
name: Deploy Scoreboard to GitHub Pages

on:
  push:
    branches:
      - stage1/scoreboard

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        run: npm run build

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

      - uses: actions/deploy-pages@v4
        id: deployment
```

Every time you push to `stage1/scoreboard`, GitHub automatically builds and deploys.

**Option B — Manual (one-time or occasional)**

```bash
# Install the gh-pages tool once
npm install -g gh-pages

# Build and deploy
npm run build
gh-pages -d out
```

### Step 4 — Enable GitHub Pages in your repo settings

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions** (if using Option A) or **Deploy from branch → gh-pages** (if using Option B)
3. Save

### Step 5 — Access your live scoreboard

Your scoreboard will be live at:

```
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME/
```

---

## Important Notes

- **localStorage is per-browser** — data entered on one device does not sync to another. Each device/browser starts with a fresh scoreboard.
- **Fullscreen mode** works in all modern browsers. On iOS Safari, use "Add to Home Screen" for the best fullscreen experience.
- **Dark/light mode** and **palette selection** are also saved in localStorage and persist between sessions.
- This branch (`stage1/scoreboard`) is frozen — it will not receive new feature changes. It exists solely as the clean, standalone scoreboard.

---

## Resetting the Scoreboard

To clear all saved match data and start fresh, open your browser console on the page and run:

```js
localStorage.removeItem("bjj:current_match")
```

Then refresh the page.
