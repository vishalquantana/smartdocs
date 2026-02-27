# SmartDocs - Video to Clips & SOP Generator

Transform long tutorial videos into short, focused clips with step-by-step Standard Operating Procedure (SOP) documents.

## Overview

SmartDocs is a local-first tool that:
- Takes a long video (uploaded or from YouTube)
- Identifies distinct lessons/tutorials within it
- Generates short clips for each lesson
- Produces step-by-step SOP documents with screenshots and instructions

Turn a 1-hour workshop recording into 5-10 self-contained, follow-along guides.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite
- **Database**: SQLite via Drizzle ORM
- **Video Processing**: ffmpeg + yt-dlp
- **Transcription**: Local Whisper via llama.cpp (no API key needed)
- **Vision Analysis**: Qwen3-VL-8B via llama.cpp (analyzes key frames)
- **AI Content**: Claude Sonnet 4.5 (Anthropic SDK)

## Prerequisites

Install these tools on your system:

1. **Node.js** (v18 or higher)
2. **ffmpeg** and **ffprobe**:
   ```bash
   # macOS
   brew install ffmpeg

   # Linux
   sudo apt install ffmpeg
   ```

3. **yt-dlp** (for YouTube downloads):
   ```bash
   # macOS
   brew install yt-dlp

   # Linux
   pip install yt-dlp
   ```

4. **llama.cpp** (for local AI models):
   ```bash
   git clone https://github.com/ggerganov/llama.cpp
   cd llama.cpp
   make
   # Add to PATH or note the location
   ```

## Installation

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. Download AI models:
   ```bash
   mkdir -p models

   # Download Whisper model (base English, ~140MB)
   # Visit: https://huggingface.co/ggerganov/whisper.cpp
   # Download ggml-base.en.bin to ./models/

   # Download Qwen3-VL model (~5GB)
   # Visit: https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct-GGUF
   # Download qwen3-vl-8b-instruct-q4_k_m.gguf to ./models/
   ```

4. Generate database migrations:
   ```bash
   npm run db:generate
   ```

## Development

Start the development server (runs both backend and frontend):

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health

## Project Structure

```
smartdocs/
├── server/           # Backend (Express + TypeScript)
│   ├── db/           # Database schema and migrations
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic (transcription, analysis, etc.)
│   ├── pipeline/     # Processing pipeline
│   └── utils/        # Helper functions
├── client/           # Frontend (React + Vite)
│   └── src/
│       ├── pages/    # Page components
│       ├── components/ # Reusable components
│       └── styles/   # CSS
├── storage/          # Generated files (videos, clips, SOPs)
├── data/             # SQLite database
└── models/           # AI models (Whisper, Qwen3-VL)
```

## Processing Pipeline

1. **DOWNLOAD** - Download video from YouTube (if applicable)
2. **EXTRACT_AUDIO** - Extract audio using ffmpeg
3. **TRANSCRIBE** - Generate timestamped transcript using local Whisper
4. **ANALYZE** - Use vision model to analyze key frames + Claude to identify lessons
5. **CLIP** - Cut video clips with smart silence removal
6. **EXTRACT_FRAMES** - Extract screenshots for SOP
7. **GENERATE_SOPS** - Generate SOP documents using Claude

## Environment Variables

See `.env.example` for all configuration options.

## License

MIT
