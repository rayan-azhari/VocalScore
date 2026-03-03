# VocalScore

VocalScore is a streamlined SaaS application designed to bridge the gap between the music people love and the technical theory required to sing it. It allows vocal students, choir members, and musical theatre performers to instantly convert YouTube links or audio files into readable vocal sheet music.

## 🌟 Features

* **Frictionless Input**: Paste a YouTube/Spotify link or process a local vocal file directly.
* **Professional Sheet Music**: Renders multi-system scores with system brackets, vocal labels, and songbook-style headers.
* **AI-Powered Source Separation**: Isolates the human voice from heavy background music using Demucs.
* **Lyrics Transcription**: Uses OpenAI Whisper to transcribe and align lyrics directly beneath the notes.
* **Accurate Pitch Extraction**: Converts vocals into discrete MIDI notes using Basic-Pitch.

## 🛠️ Tech Stack

### Frontend
* **React 19** & **Vite**: Fast, modern UI development.
* **Tailwind CSS v4**: Utility-first styling.
* **Framer Motion**: Smooth layout animations and progress indicators.
* **VexFlow**: Industry-standard library for rendering sheet music in HTML5 Canvas/SVG.
* **Lucide React**: Beautiful, consistent iconography.

### Backend (Current Node.js Gateway)
* **Express**: Serves the API endpoints and Vite middleware.
* **TypeScript**: Type-safe backend logic.

### AI Pipeline (Python Prototype)
* **yt-dlp**: Audio ingestion from URLs.
* **Demucs (Meta)**: AI source separation (isolating vocals).
* **Basic-Pitch (Spotify)**: Audio-to-MIDI pitch extraction.
* **Whisper (OpenAI)**: Lyrics transcription and timestamp alignment.

## 🚀 Getting Started (Docker - Recommended)

To eliminate environment issues and "requirements not found" bugs, we use Docker to run the AI worker in a consistent Linux environment.

### Prerequisites

1. **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
2. **Node.js** (v18+)

### 1. Build the AI Worker Image
Open your terminal in the project root and run:
```bash
docker build -t vocalscore-worker .
```

### 2. Run the Web Application
1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5000`.

---

## 🚀 Legacy Setup (Manual .venv)

**Installing Demucs:**
If you encounter an error like `FileNotFoundError: ... requirements_minimal.txt` when trying to install `demucs` via pip (especially on Windows or newer Python versions), install it directly from their official GitHub repository instead:
```bash
pip install git+https://github.com/facebookresearch/demucs
```
*(Note: You must have [Git installed](https://git-scm.com/downloads) on your system to run this command).*

### 2. Run the Web Application

1. Install Node.js dependencies (this installs `tsx`, `vite`, `react`, etc.):
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:3000`.

### 3. Test the Full Pipeline

1. Paste any YouTube or Spotify link into the input field (e.g., `https://youtube.com/watch?v=dQw4w9WgXcQ`).
2. Click the **Transcribe** button.
3. The Node.js backend will now automatically spawn the Python AI worker (`python_backend.py`).
4. **Note:** Processing a real song takes a few minutes depending on your CPU/GPU. You will see the progress bar slowly moving through the 4 stages (Fetching, Isolating, Extracting, Rendering).
5. **Advanced Expert Mode**: If you already have a vocal stem file (e.g., `vocals.wav`), toggle "Show Advanced Options" in the UI and paste the absolute file path to process it directly, bypassing download and separation.
6. Once the pipeline finishes, you'll see a professional score with **aligned lyrics** rendered in your browser!

## 📁 Project Structure

* `/src/App.tsx`: Main React application and UI layout.
* `/src/components/VexFlowRenderer.tsx`: Component that handles rendering MIDI/notes to sheet music.
* `/server.ts`: Express backend that serves the `/api/transcribe` endpoint.
* `/python_backend.py`: Prototype Python script demonstrating the actual AI extraction pipeline.

## ⚠️ Troubleshooting (Windows & Local Setup)

If you are setting this up locally (especially on Windows), you might run into a few common environment issues. Here is how to fix them:

### 1. Python Build Errors (`lameenc`, `torch`, `tensorflow` failing to install)
* **Symptom:** `ERROR: Could not find a version that satisfies the requirement lameenc>=1.2`
* **Cause:** You are using Python 3.12 or 3.13, which are too new for these machine learning libraries. They try to compile from C/C++ source code and fail on Windows.
* **Fix:** Downgrade to **Python 3.10 or 3.11**. Delete your `.venv` folder, recreate it with `py -3.11 -m venv .venv`, activate it, and run the pip installs again.

### 2. Demucs Installation Error (`requirements_minimal.txt` not found)
* **Symptom:** `FileNotFoundError: [Errno 2] No such file or directory: '...requirements_minimal.txt'`
* **Cause:** A known bug in the PyPI release of Demucs on Windows/newer Python versions.
* **Fix:** Install directly from GitHub: `pip install git+https://github.com/facebookresearch/demucs`. (Requires Git to be installed on your system).

### 3. Missing `tsx` or `vite` Commands
* **Symptom:** `'tsx' is not recognized as an internal or external command`
* **Cause:** You tried to run `npm run dev` before installing the Node.js dependencies.
* **Fix:** Run `npm install` first.

### 4. Vite Cache / Framer Motion Import Errors
* **Symptom:** `[plugin:vite:import-analysis] Failed to resolve import "motion/react"` or `Could not resolve "./animation/NativeAnimationExtended.mjs"`
* **Cause:** Vite's dependency pre-bundler cached a broken version of the `motion` library, or got stuck during a package swap.
* **Fix:** Force clear the Vite cache.
  1. Stop the server (`Ctrl+C`).
  2. Delete the cache folder: `rm -rf node_modules/.vite` (or manually delete the `.vite` folder inside `node_modules`).
  3. Restart the server and force a rebuild: `npm run dev -- --force`.

### 5. React StrictMode Typo
* **Symptom:** `Unexpected closing "StrictMode" tag does not match opening "strictmode" tag`
* **Cause:** A typo in `src/main.tsx` where the opening tag was lowercase.
* **Fix:** Open `src/main.tsx` and ensure both tags are capitalized: `<StrictMode>` and `</StrictMode>`.

### 7. Demucs / Torchaudio `torchcodec` Error
* **Symptom:** `ImportError: TorchCodec is required for save_with_torchcodec. Please install torchcodec to use this function.`
* **Cause:** A recent update to PyTorch/Torchaudio changed how they save audio files, and Demucs hasn't fully updated to handle it yet.
* **Fix:** Install `torchcodec` manually in your virtual environment:
  ```bash
  pip install torchcodec
  ```

## 📝 License

This project is licensed under the MIT License.
