# System Architecture

This document outlines the technical architecture of VocalScore, detailing how the frontend, backend gateway, and AI processing workers interact.

## High-Level Architecture

VocalScore is designed as a distributed system to handle the heavy computational requirements of Automatic Music Transcription (AMT).

```text
[ Client Browser (React) ] 
        |
        | (HTTP POST /api/transcribe)
        v
[ Node.js API Gateway (Express) ] ---> [ Database (SQLite/PostgreSQL) ]
        |
        | (Message Queue - e.g., Redis/Celery/SQS)
        v
[ Python AI Worker Nodes (GPU-enabled) ]
```

## 1. Frontend (Client)
* **Framework**: React 19 + Vite.
* **Styling**: Tailwind CSS v4.
* **Sheet Music Rendering**: `VexFlow` is used to render SVG-based sheet music directly in the browser. It receives an array of parsed notes (e.g., `['c/4-q', 'e/4-q']`) and draws the staves, clefs, and notes dynamically.
* **State Management**: React hooks manage the polling/WebSocket connection to update the user on the AI pipeline's progress.

## 2. API Gateway (Node.js)
* **Framework**: Express.js (`server.ts`).
* **Role**: Acts as the orchestrator. It receives transcription requests, validates user credits, and places jobs onto a message queue.
* **Current State**: In the current sandbox environment, this server simulates the AI delay using `setTimeout` and returns mock data. 
* **Production State**: In production, this server will push a job payload to a Redis queue and return a `jobId` to the client. The client will then poll (or use WebSockets) to get the status of that `jobId`.

## 3. AI Worker Pipeline (Python)
The heavy lifting is done by isolated Python worker nodes equipped with GPUs. The prototype for this logic is located in `python_backend.py`.

### Pipeline Steps:
1. **Ingestion (`yt-dlp`)**: Downloads the raw audio from the provided URL.
2. **Source Separation (`Demucs`)**: Meta's Demucs model splits the audio into 4 stems (vocals, drums, bass, other). We discard everything except the `vocals.wav` stem.
3. **Pitch Extraction (`basic-pitch`)**: Spotify's Basic-Pitch neural network analyzes the `vocals.wav` file and outputs a MIDI file containing the fundamental frequencies.
4. **Post-Processing (Custom Python)**: A smoothing algorithm (to be implemented) cleans up the MIDI data, quantizing the timing and removing micro-fluctuations caused by vocal vibrato.
5. **Formatting**: The cleaned MIDI data is converted into a JSON array of notes compatible with VexFlow and sent back to the API Gateway/Database.

## Scaling Considerations

* **Compute Costs**: Demucs and Basic-Pitch require significant RAM and GPU compute. Worker nodes should be auto-scaled based on queue depth to manage AWS/GCP costs.
* **Storage**: Temporary audio files (`.wav`) are large. Workers must clean up their local storage immediately after a job completes, uploading only the final lightweight JSON/MIDI data to persistent storage (like AWS S3).
* **Legal/TOS**: Direct scraping of YouTube/Spotify violates Terms of Service. A production-ready architecture must account for IP blocking and rate-limiting, potentially pivoting to a user-upload-only model or utilizing licensed APIs.
