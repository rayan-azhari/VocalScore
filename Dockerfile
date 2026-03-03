# Use a lightweight Python base image
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Upgrade pip and install common audio ML dependencies
RUN pip install --no-cache-dir --upgrade pip

# Install machine learning libraries
# We pin numpy<2 to avoid PyTorch compatibility issues
RUN pip install --no-cache-dir \
    "numpy<2" \
    yt-dlp \
    basic-pitch \
    librosa \
    pretty_midi \
    torchcodec \
    openai-whisper \
    git+https://github.com/facebookresearch/demucs

# We don't COPY the source code here because we'll mount the project root
# as a volume to allow for hot-reloading/easy testing.

# Set entrypoint to run the python script
ENTRYPOINT ["python", "/app/python_backend.py"]
