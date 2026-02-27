# SmartDocs — File Index

> Quick-reference guide for any agent or developer navigating this codebase.
> SmartDocs transforms long tutorial videos into short clips with step-by-step SOP documents.

---

## Root Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `start`, `db:*`) |
| `tsconfig.json` | Frontend TypeScript config (ES2020, strict, React JSX) |
| `tsconfig.server.json` | Backend TypeScript config (ES2022, strict, Node) |
| `vite.config.ts` | Vite bundler — React plugin, dev proxy to `:3001` |
| `drizzle.config.ts` | Drizzle ORM config — points to SQLite at `./data/smartdocs.db` |
| `.env.example` | Environment variable template (API keys, model paths, thresholds) |
| `.gitignore` | Excludes `node_modules`, `dist`, `storage`, `data`, `.env` |
| `README.md` | User-facing docs — setup, prerequisites, usage |
| `PLAN.md` | Technical design — architecture, schema, pipeline, API spec |
| `evaluation.md` | Codebase evaluation with scores across 12 parameters |
| `home.html` | Visual homepage explaining the project for non-technical users |

---

## Server — `server/`

Backend built with Express + TypeScript + SQLite (Drizzle ORM).

| File | Purpose | Key Exports |
|------|---------|-------------|
| `server/index.ts` | **Entry point** — validates config, runs migrations, starts server on port 3001 | — |
| `server/app.ts` | Express app setup — JSON middleware, static `/storage` serving, health endpoint, error handler | `app` |
| `server/config.ts` | Loads and validates environment variables into a typed config object | `config`, `validateConfig()` |

### Database — `server/db/`

| File | Purpose | Key Exports |
|------|---------|-------------|
| `server/db/index.ts` | Drizzle connection to SQLite, re-exports schema | `db`, all schema exports |
| `server/db/schema.ts` | 4-table schema: `projects`, `lessons`, `frames`, `jobs` + status/stage enums | Table definitions, type aliases |
| `server/db/migrate.ts` | Runs Drizzle migrations from `./drizzle` directory | `runMigrations()` |

**Schema overview:**
- `projects` — Video metadata, processing status, file paths
- `lessons` — Identified sections per project with timestamps, clip/SOP paths
- `frames` — Extracted screenshots per lesson for SOP illustrations
- `jobs` — Pipeline stage tracking with progress (0-100) and status

### Utilities — `server/utils/`

| File | Purpose | Key Exports |
|------|---------|-------------|
| `server/utils/exec.ts` | Promise wrapper around `child_process.exec` with timeout support | `execCommand()` |
| `server/utils/paths.ts` | Generates storage paths for projects, videos, audio, transcripts, clips, SOPs, frames | `getProjectPath()`, `getVideoPath()`, `getAudioPath()`, `getClipPath()`, etc. |
| `server/utils/timestamps.ts` | Converts between seconds and `HH:MM:SS.mmm` format | `formatTimestamp()`, `parseTimestamp()` |

### Not Yet Implemented

These directories are planned in `PLAN.md` but do not exist yet:

| Planned Directory | Purpose |
|-------------------|---------|
| `server/routes/` | API endpoints: `/api/projects`, `/api/lessons`, `/api/jobs` |
| `server/services/` | Business logic: downloader, transcriber, analyzer, clipper, sop-generator |
| `server/pipeline/` | Job queue and stage orchestration |

---

## Client — `client/`

Frontend built with React 18 + React Router + Vite.

| File | Purpose |
|------|---------|
| `client/index.html` | HTML shell — mounts React app at `#root` |
| `client/src/main.tsx` | **Entry point** — renders `<App />` into DOM |
| `client/src/App.tsx` | Router with 3 routes: `/`, `/projects/:id`, `/projects/:id/lessons/:lid` |
| `client/src/api.ts` | Generic `fetchApi<T>()` wrapper — handles JSON parsing and errors |

### Pages — `client/src/pages/`

All pages are currently placeholder stubs awaiting full implementation.

| File | Route | Purpose |
|------|-------|---------|
| `client/src/pages/HomePage.tsx` | `/` | Upload form (file or YouTube URL) + project list |
| `client/src/pages/ProjectPage.tsx` | `/projects/:id` | Pipeline progress display + lesson cards |
| `client/src/pages/LessonPage.tsx` | `/projects/:id/lessons/:lid` | Video player for clip + SOP document viewer |

### Styles — `client/src/styles/`

| File | Purpose |
|------|---------|
| `client/src/styles/global.css` | Global CSS — reset, typography, form styles, layout |

### Not Yet Implemented

| Planned Directory | Purpose |
|-------------------|---------|
| `client/src/components/` | Reusable UI: UploadForm, ProjectCard, ProcessingStatus, LessonCard, VideoPlayer, SOPViewer |

---

## Configuration — `.claude/`

| File | Purpose |
|------|---------|
| `.claude/settings.local.json` | Claude Code permissions — allows npm, yt-dlp, ffmpeg, WebFetch commands |

---

## Runtime Directories (created at runtime, gitignored)

```
storage/
  projects/{projectId}/
    video.mp4
    audio.mp3
    transcript.json
    analysis.json
    lessons/{lessonId}/
      clip.mp4
      frames/frame_*.png
      sop.json
      sop.html

data/
  smartdocs.db          # SQLite database

drizzle/
  *.sql                 # Generated migration files
```

---

## Tech Stack Quick Reference

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 4 |
| Frontend | React 18 + React Router 7 |
| Build | Vite 6 + TypeScript 5.7 |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| AI (cloud) | Anthropic Claude Sonnet 4.5 |
| AI (local) | Whisper + Qwen3-VL-8B via node-llama-cpp |
| Video | ffmpeg + yt-dlp |
| Language | TypeScript (strict mode) |

---

## NPM Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Runs server (tsx watch) + client (Vite) concurrently |
| `npm run dev:server` | Backend only with hot reload |
| `npm run dev:client` | Frontend only with Vite HMR |
| `npm run build` | Builds both client and server to `dist/` |
| `npm start` | Runs production server from `dist/server/index.js` |
| `npm run db:generate` | Generates Drizzle migration files |
| `npm run db:migrate` | Applies pending database migrations |
| `npm run db:studio` | Opens Drizzle Studio (database GUI) |

---

## Processing Pipeline (7 stages)

```
1. DOWNLOAD        → yt-dlp fetches video (YouTube only)
2. EXTRACT_AUDIO   → ffmpeg extracts audio as MP3
3. TRANSCRIBE      → Local Whisper generates timestamped transcript
4. ANALYZE         → Claude identifies lesson boundaries from transcript
5. CLIP            → ffmpeg cuts video into per-lesson clips
6. EXTRACT_FRAMES  → ffmpeg extracts key frames from each clip
7. GENERATE_SOPS   → Claude generates SOP documents with screenshots
```

---

## Implementation Status

| Area | Status |
|------|--------|
| Project config & build | Done |
| Database schema & migrations | Done |
| Server scaffold (Express app, config, utils) | Done |
| Client scaffold (Router, API client, pages) | Done |
| API routes | Not started |
| Service layer (pipeline stages) | Not started |
| Pipeline orchestration | Not started |
| UI components | Not started |
| Tests | Not started |
| CI/CD | Not started |
| Deployment (Docker, etc.) | Not started |
