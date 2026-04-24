#!/bin/bash
set -e

# Install system dependencies for mp3TuneUp
echo "Installing ffmpeg and yt-dlp..."
apt-get update -qq && apt-get install -y -qq ffmpeg python3 python3-pip > /dev/null 2>&1 || true
pip3 install --break-system-packages -q yt-dlp 2>/dev/null || pip install -q yt-dlp

echo "Starting mp3TuneUp backend..."
exec node dist/index.js