# SmartDocs — Video-to-Clips + SOP Generator

## Context

We're building a local-first tool that takes a long video (uploaded or from YouTube), identifies distinct lessons/tutorials within it, generates short clips for each, and produces step-by-step SOP documents with screenshots and instructions. The goal is to turn a 1-hour workshop recording into 5-10 self-contained, follow-along guides.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Node.js + Express + TypeScript | Familiar, easy to run locally, good ecosystem |
| Frontend | React + Vite (minimal CSS, no UI library) | Fast dev, simple for v1 |
| Database | SQLite via Drizzle ORM + better-sqlite3 | Zero setup, file-based, easy SaaS migration later |
| Video download | yt-dlp (CLI via child_process) | Most reliable YouTube downloader |
| Transcription | OpenAI Whisper API **+ local Whisper option** | Both supported; local via whisper.cpp/node-whisper so OpenAI key is optional |
| AI analysis | Claude Sonnet 4.5 (Anthropic SDK) | Lesson identification + SOP content generation |
| Video processing | ffmpeg via fluent-ffmpeg | Clipping, audio extraction, frame extraction |
| Storage | Local filesystem (`storage/` directory) | Simple, no infra needed |

**External prerequisites**: `yt-dlp`, `ffmpeg`, and `ffprobe` must be installed on the system. Optionally, a local Whisper model (via `whisper-node` or system-installed `whisper.cpp`) if not using OpenAI API for transcription.

---

## Project Structure

```
smartdocs/
├── package.json
├── tsconfig.json / tsconfig.server.json
├── vite.config.ts
├── drizzle.config.ts
├── .env.example
├── server/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express setup
│   ├── config.ts             # Env vars + defaults
│   ├── db/
│   │   ├── schema.ts         # Drizzle table definitions
│   │   ├── index.ts          # DB connection
│   │   └── migrate.ts        # Auto-migrate on startup
│   ├── routes/
│   │   ├── projects.ts       # CRUD + upload
│   │   ├── lessons.ts        # Lesson endpoints
│   │   └── jobs.ts           # Status/progress
│   ├── services/
│   │   ├── downloader.ts     # yt-dlp wrapper
│   │   ├── audio-extractor.ts # ffmpeg audio extraction + chunking
│   │   ├── transcriber.ts    # Whisper API or local Whisper (configurable)
│   │   ├── analyzer.ts       # Claude: identify lessons from transcript
│   │   ├── clipper.ts        # ffmpeg: cut clips + smart silence removal
│   │   ├── frame-extractor.ts # ffmpeg: extract key frames
│   │   ├── sop-generator.ts  # Claude: generate SOP content
│   │   └── sop-renderer.ts   # Render SOP JSON → HTML
│   ├── pipeline/
│   │   ├── runner.ts         # Orchestrates all stages sequentially
│   │   ├── stages.ts         # Stage enum + definitions
│   │   └── queue.ts          # Simple in-process job queue from DB
│   └── utils/
│       ├── exec.ts           # Promisified spawn helpers
│       ├── paths.ts          # Storage path helpers
│       └── timestamps.ts     # Timestamp formatting
├── client/
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx            # Router: /, /projects/:id, /projects/:id/lessons/:lid
│       ├── api.ts             # Fetch wrapper
│       ├── pages/
│       │   ├── HomePage.tsx   # Upload form + project list
│       │   ├── ProjectPage.tsx # Status + lessons list
│       │   └── LessonPage.tsx # Clip player + SOP viewer
│       ├── components/
│       │   ├── UploadForm.tsx
│       │   ├── ProjectCard.tsx
│       │   ├── ProcessingStatus.tsx
│       │   ├── LessonCard.tsx
│       │   ├── VideoPlayer.tsx
│       │   ├── SOPViewer.tsx
│       │   └── Layout.tsx
│       └── styles/
│           └── global.css
├── storage/                   # Created at runtime, git-ignored
│   └── projects/{id}/
│       ├── video.mp4
│       ├── audio.mp3
│       ├── transcript.json
│       ├── analysis.json
│       └── lessons/{lessonId}/
│           ├── clip.mp4
│           ├── frames/frame_001.png ...
│           ├── sop.json
│           └── sop.html
├── data/                      # SQLite DB location
│   └── smartdocs.db
└── drizzle/                   # Generated migrations
```

---

## Database Schema (4 tables)

**projects** — One per uploaded/linked video
- `id` (text PK, nanoid), `title`, `sourceType` (upload|youtube), `sourceUrl`, `videoPath`, `audioPath`, `transcriptPath`, `analysisPath`, `status` (pending → downloading → extracting_audio → transcribing → analyzing → clipping → generating_sops → completed | failed), `errorMessage`, `videoDuration`, `createdAt`, `updatedAt`

**lessons** — Multiple per project, one per identified tutorial/task
- `id` (text PK), `projectId` (FK), `orderIndex`, `title`, `summary`, `startTime`, `endTime`, `clipPath`, `sopJsonPath`, `sopHtmlPath`, `thumbnailPath`, `status`, `errorMessage`, `createdAt`

**frames** — Multiple per lesson, screenshots for SOP
- `id` (text PK), `lessonId` (FK), `orderIndex`, `timestamp`, `filePath`, `caption`

**jobs** — Pipeline execution tracking
- `id` (text PK), `projectId` (FK), `stage`, `status` (pending|processing|completed|failed), `progress` (0-100), `errorMessage`, `startedAt`, `completedAt`, `createdAt`

---

## Processing Pipeline (7 stages, sequential)

```
1. DOWNLOAD        — yt-dlp downloads video (YouTube only; skipped for uploads)
2. EXTRACT_AUDIO   — ffmpeg extracts audio as mp3, chunks if >24MB (Whisper API limit)
3. TRANSCRIBE      — Whisper API OR local Whisper (configurable via TRANSCRIPTION_PROVIDER env var)
4. ANALYZE         — Claude Sonnet 4.5 reads full transcript, identifies lesson boundaries + metadata
5. CLIP            — ffmpeg cuts a video clip per lesson + smart silence removal (silencedetect filter)
6. EXTRACT_FRAMES  — ffmpeg extracts ~8-12 frames per clip at regular intervals
7. GENERATE_SOPS   — Claude Sonnet 4.5 generates structured SOP per lesson, rendered to HTML
```

The pipeline runs in-process (no Redis/workers needed for local single-user). A `PipelineRunner` picks jobs from the DB and processes them sequentially. Each stage updates the project/job status so the frontend can poll for progress.

### Transcription (dual-provider support)
- **OpenAI Whisper API** (default if `OPENAI_API_KEY` is set): Sends audio chunks to the API, gets timestamped segments back. Audio is chunked to stay under 25MB limit.
- **Local Whisper** (fallback / alternative): Uses `whisper-node` (Node.js binding for whisper.cpp). Runs entirely on-device, no API key needed. Slower but free and private. Selected via `TRANSCRIPTION_PROVIDER=local` env var.
- Both providers return the same `TranscriptResult` interface: `{ segments: [{ start, end, text }], fullText }`.

### Smart Clip Editing (silence removal)
- After cutting a raw clip for each lesson, we run a second ffmpeg pass to detect and remove silences.
- Uses ffmpeg's `silencedetect` filter to find silent sections (threshold: -30dB, duration > 1.5s).
- Builds a filter_complex with `concat` to join only the non-silent segments.
- Result: tighter 2-3 minute clips that skip dead air, pauses, and filler.
- The raw clip is kept as a backup; the silence-removed version is the primary output.

**Error handling**: If a stage fails, the project is marked `failed` with the error message. Stages check for existing outputs so re-processing skips completed work.

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/projects` | Create project (multipart upload OR JSON with YouTube URL) |
| `GET` | `/api/projects` | List all projects |
| `GET` | `/api/projects/:id` | Project detail + lessons |
| `DELETE` | `/api/projects/:id` | Delete project + files |
| `GET` | `/api/projects/:id/status` | Current pipeline stage + progress (for polling) |
| `GET` | `/api/projects/:id/lessons` | List lessons |
| `GET` | `/api/projects/:id/lessons/:lid` | Lesson detail + frames |
| `GET` | `/api/projects/:id/lessons/:lid/sop` | Rendered SOP HTML |
| `GET` | `/storage/*` | Static file serving (videos, clips, frames) |

Frontend polls `/api/projects/:id/status` every 2s while processing is active.

---

## SOP Document Format

Two-column layout: **screenshot on left, instructions on right**.

Each SOP step includes:
- `frameIndex` — which screenshot to show
- `instruction` — what to do (heading)
- `details` — more context
- `textToType` — any command/prompt to type (shown in a copyable code block)
- `tip` / `warnings` — optional callouts

Rendered as a standalone HTML file (viewable independently or embedded in the app).

---

## Frontend Pages

1. **HomePage** (`/`) — Upload form (drag-drop file OR paste YouTube URL) + recent projects grid
2. **ProjectPage** (`/projects/:id`) — Pipeline progress bar + lesson cards once ready
3. **LessonPage** (`/projects/:id/lessons/:lid`) — Video player for the clip + inline SOP viewer with prev/next navigation

---

## Implementation Order

### Phase 1: Foundation
1. Initialize npm project, install all dependencies
2. Configure TypeScript, Vite (with proxy to Express), Drizzle
3. Create DB schema + migration + connection
4. Create Express skeleton with health check
5. Verify `npm run dev` starts both server and client

### Phase 2: API + Upload
6. Project CRUD routes (POST with multer for upload, GET, DELETE)
7. Lesson and job/status routes
8. Test all routes with curl

### Phase 3: Pipeline
9. Pipeline runner + queue infrastructure
10. Wire pipeline into POST /api/projects (enqueue after creation)
11. Implement services in order: downloader → audio-extractor → transcriber → analyzer → clipper → frame-extractor → sop-generator → sop-renderer

### Phase 4: Frontend
12. Client skeleton (router, Layout, API client)
13. HomePage with UploadForm + ProjectCard
14. ProjectPage with ProcessingStatus + LessonCard
15. LessonPage with VideoPlayer + SOPViewer

### Phase 5: Polish
16. Error states and edge cases (short videos, empty transcripts, API failures)
17. `.env.example`, setup script, README

---

## Environment Variables

```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...          # Required
OPENAI_API_KEY=sk-...                 # Optional (needed only if using Whisper API)
TRANSCRIPTION_PROVIDER=openai         # "openai" or "local" (defaults to "openai" if key present, else "local")
STORAGE_DIR=./storage
DATABASE_PATH=./data/smartdocs.db
CLAUDE_MODEL=claude-sonnet-4-5-20250929
SILENCE_THRESHOLD=-30                 # dB threshold for silence detection
SILENCE_MIN_DURATION=1.5              # Min seconds of silence to cut
```

---

## Verification Plan

1. **End-to-end test**: Upload a short (<5 min) video → verify all 7 pipeline stages complete → check that clips exist and play → check that SOP HTML renders correctly with screenshots
2. **YouTube test**: Paste a YouTube URL → verify download + full pipeline
3. **Frontend test**: Walk through all 3 pages, confirm polling works, clips play, SOPs render
4. **Edge case**: Upload a very short video (~1-2 min) → should produce a single lesson/SOP
