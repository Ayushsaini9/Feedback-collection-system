# FeedbackHub SaaS

A self-contained reconstruction of the deployed Feedback Collection System, based on REA runtime and shipped-bundle evidence.

## What is included

- Dark FeedbackHub SaaS authentication screen with sign-in and workspace registration tabs.
- Local demo authentication using the displayed portfolio credentials.
- Dashboard summary cards, response-volume chart, top forms, and recent activity.
- Feedback form list with search, status filtering, publish, duplicate, delete, response, and analytics actions.
- Form builder with question types, required flags, draft saving, and live preview.
- Response table with CSV export.
- Workspace member invitation and role display.
- Audit log view.
- Public feedback form at `/feedback/csat-survey-2026` with rating, choice, scale, yes/no, and free-text questions.
- LocalStorage-backed data so the app works without the original Render API.
- Express backend with JWT authentication, refresh tokens, JSON persistence, forms, responses, analytics, members, audit logs, and public survey submission endpoints.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The app defaults to `/auth/login`; the root route redirects there automatically.

Run the API in a second terminal:

```bash
npm run server
```

Or run both together:

```bash
npm run dev:full
```

Demo credentials:

- `admin@feedback.com` / `Password123!`
- `manager@feedback.com` / `Password123!`

## Build for GitHub/Vercel

```bash
npm run build
```

The included `vercel.json` rewrites SPA routes to `index.html`, so direct links such as `/forms` and `/feedback/csat-survey-2026` work on Vercel.

The API listens on `http://localhost:4000` by default. Copy `.env.example` to `.env` and set a production `JWT_SECRET` before deployment. Its local JSON database is created at `server/db.json` on first start; this is suitable for a demo or single-instance deployment, not horizontally scaled production without replacing the persistence layer.

## Reconstruction note

This implementation reproduces the observed product surface and flows while using a local browser data layer. It does not depend on the original deployed API or copy its private server-side implementation.
