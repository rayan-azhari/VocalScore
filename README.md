# VocalScore

VocalScore is a streamlined SaaS application designed to bridge the gap between the music people love and the technical theory required to sing it. It allows vocal students, choir members, and musical theatre performers to instantly convert YouTube links or audio files into readable vocal sheet music.

## 🌟 Features

* **Frictionless Input**: Simply paste a YouTube/Spotify link or upload an audio file.
* **AI-Powered Source Separation**: Isolates the human voice from heavy background music using state-of-the-art models.
* **Accurate Pitch Extraction**: Converts the isolated vocal stem into discrete MIDI notes, smoothing out vibrato and breath noise.
* **In-Browser Sheet Music**: Renders the extracted notes onto a standard music staff (pentagram) using VexFlow.
* **Credit-Based System**: Protects heavy GPU compute costs while offering a freemium tier for casual users.

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

## 🚀 Getting Started & Local Testing

### Prerequisites

To run the full AI pipeline on your local machine, you must have the following installed:
1. **Node.js** (v18+)
2. **Python** (v3.10 or v3.11 strongly recommended)
   * *Note: Python 3.12 and 3.13 are too new for many audio/ML libraries (like `lameenc`, `torch`, and `tensorflow`) and will cause installation errors.*
3. **FFmpeg** (Required by yt-dlp and Demucs for audio processing)
   * Mac: `brew install ffmpeg`
   * Windows: Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) or use `winget install ffmpeg`
   * Linux: `sudo apt install ffmpeg`

### 1. Install Python AI Dependencies

Open your terminal and install the required machine learning and audio processing libraries:
```bash
pip install yt-dlp basic-pitch librosa pretty_midi
```

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
5. Once the Python script finishes, the real extracted MIDI notes will be sent to the frontend and rendered beautifully on your screen using VexFlow!

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
