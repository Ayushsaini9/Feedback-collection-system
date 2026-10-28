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

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The app defaults to `/auth/login`; the root route redirects there automatically.

Demo credentials:

- `admin@feedback.com` / `Password123!`
- `manager@feedback.com` / `Password123!`

## Build for GitHub/Vercel

```bash
npm run build
```

The included `vercel.json` rewrites SPA routes to `index.html`, so direct links such as `/forms` and `/feedback/csat-survey-2026` work on Vercel.

## Reconstruction note

This implementation reproduces the observed product surface and flows while using a local browser data layer. It does not depend on the original deployed API or copy its private server-side implementation.
