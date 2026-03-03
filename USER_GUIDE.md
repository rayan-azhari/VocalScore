# VocalScore User Guide

Welcome to VocalScore! This guide will walk you through how to use the platform to generate vocal sheet music from your favorite songs.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Transcribing a Song](#transcribing-a-song)
3. [Understanding the Processing Steps](#understanding-the-processing-steps)
4. [Reading and Exporting Your Score](#reading-and-exporting-your-score)
5. [Credits and Pricing](#credits-and-pricing)

---

## Getting Started

VocalScore is designed to be as frictionless as possible. You do not need to know how to play the piano or manually transcribe notes by ear. If you can copy and paste a link, you can get sheet music.

When you open the application, you will see your current **Credit Balance** in the top right corner.

## Transcribing a Song

There are two ways to input a song into VocalScore:

### Option 1: Paste a Link (Recommended)
1. Go to YouTube or Spotify and copy the link to the song you want to learn.
2. Paste the link into the main input field on the VocalScore homepage.
3. Click the **Transcribe** button.

### Option 2: Upload an Audio File
1. Click the **Upload** button next to the input field.
2. Select a clean `.mp3` or `.wav` file from your device.
3. Click **Transcribe**.

## Understanding the Processing Steps

Once you click Transcribe, our AI pipeline takes over. Because processing audio requires heavy computational power, this process can take a few minutes. You will see a progress bar moving through four distinct phases:

1. **Fetching Audio**: We securely download the audio stream from your provided link.
2. **Isolating Vocals**: Our AI separates the human voice from the drums, bass, and background instruments, creating a clean "vocal-only" track.
3. **Extracting Pitch**: We analyze the vocal track to determine the exact notes being sung, smoothing out natural vocal wobbles (vibrato).
4. **Rendering Score**: We translate those raw notes into standard sheet music.

## Reading and Exporting Your Score

When processing is complete, your sheet music will appear on the screen!

* **Playback**: Click the **Play** icon to hear a MIDI playback of the extracted melody. This helps you verify the accuracy of the transcription.
* **Export**: Click the **Download** icon to save the sheet music as a PDF or export the raw MIDI file to use in software like MuseScore, Logic, or Ableton.

## Credits and Pricing

Processing AI audio models is expensive. To keep the service sustainable, we use a credit-based system.

* **Freemium**: Every user gets 1 free transcription per month to try out the service.
* **Credit Packs**: You can purchase packs of credits (e.g., 10 songs for £5). Credits never expire, and they grant you priority processing speed.
* **Studio Tier**: Designed for vocal coaches, this £29/month subscription provides 100 transcriptions, batch processing, and the ability to share links directly with students.

If a transcription fails due to an error on our end, your credit will automatically be refunded.
