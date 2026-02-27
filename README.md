## YouTube Shorts AI (Converter)

Turn a long YouTube video into **multiple short clips** by:

- Downloading the source video (`yt-dlp`)
- Extracting + compressing audio (`ffmpeg`)
- Transcribing audio with **Groq Whisper**
- Asking an LLM to pick the best moments
- Cutting the selected segments into individual `.mp4` shorts (`ffmpeg`)

This repo is a **monorepo**:

- `frontend/`: Next.js (App Router) UI
- `backend/`: Express API that runs the conversion pipeline

---

## Features

- **AI-based segment selection**: chooses viral / engaging moments from the transcript
- **Multiple shorts per job**: request N shorts, download each one
- **Job status polling**: progress + messages exposed via API
- **Local-first**: outputs are saved to your machine’s temp directory

---

## Tech stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, CORS
- **Media**: `yt-dlp`, `ffmpeg`
- **AI**: Groq OpenAI-compatible APIs (transcription + chat completions)

---

## How it works (high level)

1. `POST /api/convert` creates a job ID and starts work in the background.
2. Backend downloads the YouTube video with `yt-dlp`.
3. Backend extracts audio (WAV), compresses to MP3, then transcribes via Groq.
4. Backend asks the LLM for `noOfShorts` segments (start/end times).
5. Backend cuts the video into `input1.mp4`, `input2.mp4`, ... in the job folder.
6. Frontend polls `GET /api/status/:jobId` and, once completed, lists available shorts.

---

## Prerequisites

- **Node.js 20+** (recommended)
- **FFmpeg** available on your PATH (`ffmpeg -version`)
- **yt-dlp** available on your PATH (`yt-dlp --version`)
- A **Groq API key**

On Windows, you can install tools via your preferred package manager (e.g. `winget`/Chocolatey), or download FFmpeg binaries and add them to PATH.

---

## Environment variables

Create these files locally (do **not** commit secrets):

### `backend/.env`

```env
# Required
GROQ_API_KEY=your_groq_api_key

# Optional
PORT=3001

# NOTE:
# The backend creates job folders using the OS temp directory.
# If you override TEMP_DIR, make sure it matches your OS temp dir,
# otherwise downloads may look in the wrong location.
TEMP_DIR=C:\path\to\temp
```

### `frontend/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Run locally (development)

### Backend (Express)

```bash
cd backend
npm install
npm run dev
```

Backend defaults to `http://localhost:3001` (or `PORT`).

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:3000`.

---

## API reference

Base URL: `http://localhost:3001`

### Create a conversion job

`POST /api/convert`

Body:

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "noOfShorts": 3
}
```

Response:

```json
{
  "jobId": "....",
  "message": "Job created successfully",
  "youtubeUrl": "...",
  "noOfShorts": 3
}
```

### Check job status

`GET /api/status/:jobId`

Returns the in-memory job state (status/message/progress). Jobs are **not persisted** across server restarts.

### List generated shorts (metadata)

`GET /api/shorts/:jobId`

Returns an array of shorts with:

- `filename`, `startTime`, `endTime`, `duration`
- `title`, `hook`, `reason`
- `fileExists`, `fileSize`, `fileSizeInMB`

### Download the first short (legacy)

`GET /api/download/:jobId`

Downloads `input1.mp4` for that job.

### Download a specific short

`GET /api/download/:jobId/:shortIndex`

`shortIndex` is **0-based** (0 = first short).

---

## Troubleshooting

- **`yt-dlp` not found**: install `yt-dlp` and ensure it’s on PATH, then restart your terminal.
- **`ffmpeg` not found**: install FFmpeg and ensure it’s on PATH.
- **Transcription/AI fails**: verify `GROQ_API_KEY` is set and valid.
- **Downloads fail / “file not found”**: ensure `TEMP_DIR` (if set) matches the OS temp directory used to create job folders.

---

## Security notes

- **Never commit API keys**. Keep `backend/.env` local and add it to `.gitignore`.
- If a key was committed in the past, **rotate it immediately** and remove it from git history if the repo is public.

---

## Project structure

```text
.
├─ backend/                 # Express API (conversion pipeline)
└─ frontend/                # Next.js UI
```

---

## License

No root license file is included yet. If you plan to publish this project, add a `LICENSE` (MIT/Apache-2.0/etc).

