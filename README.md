# bjj_tournament_system

This repository currently contains a standalone BJJ scoreboard built with Next.js. The scoreboard is fully client-side and can be deployed to GitHub Pages as a static site.

## Local development

1. Install dependencies with `npm install`
2. Start the dev server with `npm run dev`
3. Open `http://localhost:3000`

## GitHub Pages deployment

The app is already configured for static export. On GitHub Actions builds it automatically derives the repository name from `GITHUB_REPOSITORY` and publishes under `/<repo-name>`.

1. Push this repo to GitHub
2. In repo settings, open Pages and set the source to GitHub Actions
3. Push to `main` to trigger deployment

For a local Pages-style build, run `npm run build:pages`. The static output is written to `out/`.
