# Compodoc + Vercel Deployment Guide

This project is configured to deploy Compodoc as a separate Vercel site, isolated from the main Angular frontend deployment.

## What is already configured

- Compodoc is installed as a dev dependency in `BookMatch-Angular`.
- Documentation scripts are available in `BookMatch-Angular/package.json`:
  - `npm run docs`
  - `npm run docs:serve`
  - `npm run docs:build`
  - `npm run docs:build:vercel`
- TypeScript config for docs exists at `BookMatch-Angular/tsconfig.doc.json`.
- A dedicated Vercel wrapper exists at `BookMatch-Angular/compodoc-vercel`:
  - `package.json`
  - `vercel.json`

## Local verification

From `BookMatch-Angular`:

```bash
npm run docs:serve
```

Compodoc should open at `http://localhost:8080`.

## Deploy on Vercel (separate project)

Create a new Vercel project and use these settings:

- **Root Directory:** `BookMatch-Angular/compodoc-vercel`
- **Framework Preset:** `Other`
- **Build Command:** `npm run build`
- **Output Directory:** `public`

No environment variables are required for Compodoc.

## Why this structure

- Keeps the current frontend deployment untouched.
- Avoids conflicts with the SPA rewrites in `BookMatch-Angular/vercel.json`.
- Gives documentation an independent URL and deployment lifecycle.
