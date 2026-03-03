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
        "-n", "htdemucs_ft", # Fine-tuned model is sometimes faster, or standard htdemucs
        "--two-stems=vocals", # Only separate vocals and "no vocals"
        "-j", "4", # Use 4 threads for separation
        "-o", output_dir,
        input_file
    ]
    
    run_command(cmd, "Isolating Vocals")
    
    model_name = "htdemucs_ft"
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    vocal_file = os.path.join(output_dir, model_name, base_name, "vocals.wav")
    
    if not os.path.exists(vocal_file):
        print(f"Warning: Expected vocal file not found at {vocal_file}. Please check Demucs output.")
    
    return vocal_file

def extract_pitch(vocal_file, output_dir="temp"):
    # Using Spotify's basic-pitch to convert the vocal wav to MIDI
    cmd = [
        "basic-pitch",
        output_dir,
        vocal_file
    ]
    
    run_command(cmd, "Extracting Pitch to MIDI")
    
    base_name = os.path.splitext(os.path.basename(vocal_file))[0]
    midi_file = os.path.join(output_dir, f"{base_name}_basic_pitch.mid")
    
    return midi_file

def midi_to_vexflow(midi_file):
    """Converts a MIDI file into an array of VexFlow note strings."""
    try:
        pm = pretty_midi.PrettyMIDI(midi_file)
        notes = []
        pitch_classes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
        
        for instrument in pm.instruments:
            if not instrument.is_drum:
                # Sort notes by start time
                sorted_notes = sorted(instrument.notes, key=lambda n: n.start)
                
                # Limit to first 60 notes for the UI prototype to avoid rendering massive scores
                for note in sorted_notes[:60]:
                    octave = (note.pitch // 12) - 1
                    pitch_class = pitch_classes[note.pitch % 12]
                    key = f"{pitch_class}/{octave}"
                    
                    # Rough duration estimation (assuming 120bpm, 1 beat = 0.5s)
                    duration_sec = note.end - note.start
                    if duration_sec >= 1.0: dur = 'w'
                    elif duration_sec >= 0.5: dur = 'h'
                    elif duration_sec >= 0.25: dur = 'q'
                    elif duration_sec >= 0.125: dur = '8'
                    else: dur = '16'
                    
                    notes.append(f"{key}-{dur}")
        return notes
    except Exception as e:
        print(f"Error parsing MIDI: {e}", file=sys.stderr)
        return ['c/4-q', 'e/4-q', 'g/4-q', 'c/5-q'] # Fallback

def main():
    parser = argparse.ArgumentParser(description="VocalScore Processing Pipeline")
    parser.add_argument("--url", required=True, help="YouTube URL to process")
    args = parser.parse_args()
    
    print(f"Starting pipeline for URL: {args.url}")
    
    # Step 1: Download
    audio_file = download_audio(args.url)
    print(f"Audio downloaded to: {audio_file}")
    
    # Step 2: Isolate
    vocal_file = isolate_vocals(audio_file)
    print(f"Vocals isolated to: {vocal_file}")
    
    # Step 3: Extract Pitch
    midi_file = extract_pitch(vocal_file)
    print(f"MIDI extracted to: {midi_file}")
    
    # Step 4: Convert to VexFlow format
    vexflow_notes = midi_to_vexflow(midi_file)
    
    result = {
        "status": "success",
        "data": {
            "key": "C Major", # Placeholder
            "tempo": 120,     # Placeholder
            "notes": vexflow_notes
        }
    }
    
    # Output JSON block for Node.js to parse
    print("\n===RESULT_JSON_BEGIN===")
    print(json.dumps(result))
    print("===RESULT_JSON_END===")

if __name__ == "__main__":
    main()
