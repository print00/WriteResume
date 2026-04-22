# Resume Builder

A full-stack resume builder for creating ATS-optimized, single-page resumes with AI-assisted summary and bullet refinement, plus DOCX and PDF export.

## Prerequisites

- Node.js 18 or newer
- npm
- LibreOffice installed and available as `soffice` on your system path
- Google Gemini API key

## Install

1. Install shared, client, and server dependencies from the repo root:

```bash
npm install
```

2. Create a server environment file:

```bash
cp server/.env.example server/.env
```

3. Add your Gemini API key to `server/.env`:

```bash
GEMINI_API_KEY=your_key_here
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

4. Optional client environment file for production-style API targeting:

```bash
cp client/.env.example client/.env
```

## Run In Development

Use two terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

The Vite app runs on its default port and proxies `/api` requests to `http://localhost:3001`.
If `VITE_API_BASE_URL` is set, the client uses that URL instead.

## Build For Production

From the repo root:

```bash
npm run build
```

You can also build each package independently:

```bash
cd shared && npm run build
cd server && npm run build
cd client && npm run build
```

## Deploy On Render

Use two Render services from this repo:

- `resume-builder-api` as a Web Service
- `resume-builder-web` as a Static Site

This repo includes [render.yaml](/Users/shushilkarki/My-projects/WriteResume/render.yaml) and a backend Docker image at [server/Dockerfile](/Users/shushilkarki/My-projects/WriteResume/server/Dockerfile) so LibreOffice is available for PDF export.

### Backend service

- Render will build the Dockerfile in [server/Dockerfile](/Users/shushilkarki/My-projects/WriteResume/server/Dockerfile)
- Set `GEMINI_API_KEY`
- Set `CLIENT_ORIGIN` to your Render frontend URL, for example `https://resume-builder-web.onrender.com`

### Frontend static site

- Build root: `client`
- Publish directory: `dist`
- Set `VITE_API_BASE_URL` to your backend URL, for example `https://resume-builder-api.onrender.com`

### Notes

- The frontend and backend can both be created from [render.yaml](/Users/shushilkarki/My-projects/WriteResume/render.yaml)
- PDF export depends on LibreOffice, so the backend should stay on the Docker-based web service
- If your frontend URL changes, update `CLIENT_ORIGIN` on the backend to match

## Features

- 7-step wizard form with progress tracking and responsive dark UI
- Resume upload review lab for PDF, DOCX, and TXT files
- AI-generated summary via `POST /api/ai/summary` using Gemini
- AI-enhanced work/project bullets via `POST /api/ai/bullets` using Gemini
- AI resume review with ATS-style scoring, strengths, improvement areas, and keyword gaps
- Job-description tailoring workflow that can rewrite the current builder summary and bullets
- ATS checklist and score calculated client-side
- DOCX export via `POST /api/generate/docx`
- PDF export via `POST /api/generate/pdf` using headless LibreOffice

## Project Structure

```text
client/   React + Vite frontend
server/   Express + TypeScript backend
shared/   Shared TypeScript types
```
