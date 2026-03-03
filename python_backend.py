import os
import sys
import subprocess
import json
import argparse

try:
    import pretty_midi
except ImportError:
    print("pretty_midi is not installed. Please run: pip install pretty_midi")
    sys.exit(1)

try:
    import whisper
except ImportError:
    print("whisper is not installed. Please run: pip install openai-whisper")
    sys.exit(1)

import warnings
warnings.filterwarnings("ignore") # Ignore Whisper/TF warnings for cleaner stdout

# This is the Python script that runs the backend pipeline for VocalScore.
# It uses yt-dlp to download audio, Demucs to isolate vocals,
# and basic-pitch to extract MIDI notes.
#
# Requirements:
# pip install yt-dlp demucs basic-pitch librosa pretty_midi
# System requirement: ffmpeg must be installed

def run_command(cmd, description):
    print(f"\n--- {description} ---")
    print(f"Running: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error during {description}: {e}")
        sys.exit(1)

def download_audio(url, output_dir="temp"):
    os.makedirs(output_dir, exist_ok=True)
    output_template = os.path.join(output_dir, "downloaded_audio.%(ext)s")
    
    # Clean up previous downloads
    for f in os.listdir(output_dir):
        if f.startswith("downloaded_audio"):
            os.remove(os.path.join(output_dir, f))
            
    cmd = [
        "yt-dlp",
        "-x", # Extract audio
        "--audio-format", "wav",
        "--audio-quality", "5", # Lower quality is fine and faster to process
        "-f", "bestaudio[ext=m4a]/bestaudio[ext=webm]", # Avoid grabbing huge video files
        "-o", output_template,
        url
    ]
    
    run_command(cmd, "Downloading Audio")
    return os.path.join(output_dir, "downloaded_audio.wav")

def isolate_vocals(input_file, output_dir="temp/separated"):
    # Using Demucs to separate the track with a faster model and multiple threads
    cmd = [
        "demucs",
        "-n", "htdemucs_ft", 
        "--two-stems=vocals", 
        "-j", "4", 
        "-o", output_dir,
        input_file
    ]
    
    run_command(cmd, "Isolating Vocals")
    
    # Robustly find the vocals.wav file
    vocal_file = None
    for root, dirs, files in os.walk(output_dir):
        if "vocals.wav" in files:
            vocal_file = os.path.join(root, "vocals.wav")
            break
            
    if not vocal_file or not os.path.exists(vocal_file):
        print(f"Warning: Expected vocal file not found in {output_dir}. Please check Demucs output.")
    
    return vocal_file

def extract_pitch(vocal_file, output_dir="temp"):
    # Using Spotify's basic-pitch to convert the vocal wav to MIDI
    # It outputs to the directory specified
    cmd = [
        "basic-pitch",
        output_dir,
        vocal_file
    ]
    
    run_command(cmd, "Extracting Pitch to MIDI")
    
    base_name = os.path.splitext(os.path.basename(vocal_file))[0]
    midi_file = os.path.join(output_dir, f"{base_name}_basic_pitch.mid")
    
    # If not found directly, look for it
    if not os.path.exists(midi_file):
        for f in os.listdir(output_dir):
            if f.endswith(".mid") and base_name in f:
                midi_file = os.path.join(output_dir, f)
                break
                
    return midi_file

def transcribe_lyrics(audio_file):
    print("\n--- Transcribing Lyrics with Whisper ---")
    model = whisper.load_model("tiny") # Using tiny for speed
    result = model.transcribe(audio_file)
    
    # Extract segments with timestamps
    lyrics = []
    for segment in result['segments']:
        # Split segment text into individual words for better alignment
        words = segment['text'].strip().split()
        if not words: continue
        
        # Estimate duration per word within the segment
        seg_duration = segment['end'] - segment['start']
        word_duration = seg_duration / len(words)
        
        for i, word in enumerate(words):
            lyrics.append({
                "text": word,
                "start": segment['start'] + (i * word_duration),
                "end": segment['start'] + ((i + 1) * word_duration)
            })
            
    return lyrics

def midi_to_vexflow(midi_file, lyrics=None):
    """Converts a MIDI file into note objects with lyrics."""
    try:
        pm = pretty_midi.PrettyMIDI(midi_file)
        notes = []
        pitch_classes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
        
        for instrument in pm.instruments:
            if not instrument.is_drum:
                # Sort notes by start time
                sorted_notes = sorted(instrument.notes, key=lambda n: n.start)
                
                # Limit to first 100 notes for professional score
                for i, note in enumerate(sorted_notes[:100]):
                    octave = (note.pitch // 12) - 1
                    pitch_class = pitch_classes[note.pitch % 12]
                    key = f"{pitch_class}/{octave}"
                    
                    # Duration estimation
                    duration_sec = note.end - note.start
                    if duration_sec >= 1.0: dur = 'w'
                    elif duration_sec >= 0.5: dur = 'h'
                    elif duration_sec >= 0.25: dur = 'q'
                    elif duration_sec >= 0.125: dur = '8'
                    else: dur = '16'
                    
                    # Align lyrics
                    note_lyric = ""
                    if lyrics:
                        # Find the best matching lyric word based on start time
                        # Simple alignment: use the lyric word that starts closest to this note start
                        closest_lyric = None
                        min_diff = 1.0 # Max 1s difference
                        
                        for l in lyrics:
                            diff = abs(l['start'] - note.start)
                            if diff < min_diff:
                                min_diff = diff
                                closest_lyric = l
                        
                        if closest_lyric:
                            note_lyric = closest_lyric['text']
                            # Remove used lyric to avoid duplicates if simple alignment is off
                            # For better alignment, mapping would be many-to-one or one-to-many
                    
                    notes.append({
                        "key": key,
                        "duration": dur,
                        "lyric": note_lyric
                    })
        return notes
    except Exception as e:
        print(f"Error parsing MIDI: {e}", file=sys.stderr)
        return [{"key": "c/4", "duration": "q", "lyric": "Error"}]

def main():
    parser = argparse.ArgumentParser(description="VocalScore Processing Pipeline")
    parser.add_argument("--url", help="YouTube URL to process")
    parser.add_argument("--input-file", help="Direct path to a vocal WAV file to bypass download/isolation")
    parser.add_argument("--skip-existing", action="store_true", help="Skip steps if output files already exist")
    args = parser.parse_args()
    
    if not args.url and not args.input_file:
        print("Error: Either --url or --input-file must be provided.")
        sys.exit(1)
        
    print(f"Starting pipeline...")
    
    # Step 1 & 2: Get the vocal file
    vocal_file = None
    
    if args.input_file:
        if os.path.exists(args.input_file):
            vocal_file = args.input_file
            print(f"Using provided input file: {vocal_file}")
        else:
            print(f"Error: Input file {args.input_file} not found.")
            sys.exit(1)
    else:
        # Step 1: Download
        audio_file = os.path.join("temp", "downloaded_audio.wav")
        if args.skip_existing and os.path.exists(audio_file):
            print(f"Skipping download, using existing: {audio_file}")
        else:
            audio_file = download_audio(args.url)
            print(f"Audio downloaded to: {audio_file}")
        
        # Step 2: Isolate
        if args.skip_existing:
            # Search for existing vocals.wav in temp/separated
            for root, dirs, files in os.walk("temp/separated"):
                if "vocals.wav" in files:
                    vocal_file = os.path.join(root, "vocals.wav")
                    break
        
        if args.skip_existing and vocal_file and os.path.exists(vocal_file):
            print(f"Skipping isolation, using existing: {vocal_file}")
        else:
            vocal_file = isolate_vocals(audio_file)
            print(f"Vocals isolated to: {vocal_file}")
    
    # Step 3: Extract Pitch
    if not vocal_file:
        print("Error: No vocal file available for pitch extraction.")
        sys.exit(1)
        
    base_name = os.path.splitext(os.path.basename(vocal_file))[0]
    midi_file = os.path.join("temp", f"{base_name}_basic_pitch.mid")
    
    if args.skip_existing and os.path.exists(midi_file):
        print(f"Skipping pitch extraction, using existing: {midi_file}")
    else:
        midi_file = extract_pitch(vocal_file)
        print(f"MIDI extracted to: {midi_file}")
    
    # Step 4: Transcribe Lyrics
    lyrics = transcribe_lyrics(vocal_file)
    print(f"Lyrics transcribed: {len(lyrics)} words.")
    
    # Step 5: Convert to VexFlow format
    vexflow_notes = midi_to_vexflow(midi_file, lyrics)
    
    result = {
        "status": "success",
        "data": {
            "title": "Vocal Transcription",
            "subtitle": "Generated by VocalScore AI",
            "composer": "AI Powered",
            "key": "G Major", 
            "tempo": 120,     
            "notes": vexflow_notes
        }
    }
    
    # Output JSON block for Node.js to parse
    print("\n===RESULT_JSON_BEGIN===")
    print(json.dumps(result))
    print("===RESULT_JSON_END===")

if __name__ == "__main__":
    main()
