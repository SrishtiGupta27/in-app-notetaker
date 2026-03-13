#!/bin/bash

echo "🏥 Medical Audio Recording Tool"
echo "=============================="
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not installed. Install with:"
    echo "   sudo apt install ffmpeg"
    exit 1
fi

# List available audio devices
echo "📱 Available audio devices:"
echo "-------------------------"
arecord -l 2>/dev/null || echo "No audio devices found"
echo ""

# Get recording parameters
echo "🎙️  Recording Configuration:"
read -p "Duration in seconds (default: 60): " DURATION
DURATION=${DURATION:-60}

read -p "Output filename (default: medical_recording.wav): " FILENAME
FILENAME=${FILENAME:-medical_recording.wav}

echo ""
echo "Quality options:"
echo "1) Speech optimized (16kHz mono) - smaller file"
echo "2) High quality (44.1kHz stereo) - better for multiple speakers"
echo "3) Professional (48kHz stereo) - best quality"
read -p "Choose quality (1-3, default: 2): " QUALITY
QUALITY=${QUALITY:-2}

# Set FFmpeg parameters based on quality choice
case $QUALITY in
    1)
        PARAMS="-ar 16000 -ac 1 -af highpass=f=80,lowpass=f=8000"
        echo "📊 Using speech-optimized settings"
        ;;
    2)
        PARAMS="-ar 44100 -ac 2 -af highpass=f=80,lowpass=f=8000,loudnorm"
        echo "📊 Using high-quality settings"
        ;;
    3)
        PARAMS="-ar 48000 -ac 2 -af highpass=f=50,lowpass=f=12000,loudnorm"
        echo "📊 Using professional settings"
        ;;
esac

echo ""
echo "🔴 Starting recording..."
echo "   Duration: ${DURATION} seconds"
echo "   Output: ${FILENAME}"
echo "   Press 'q' to stop early"
echo ""
echo "💡 Tips for best results:"
echo "   - Speak clearly and avoid background noise"
echo "   - Keep speakers separated (don't talk over each other)"
echo "   - Position microphone between speakers if possible"
echo ""

# Countdown
for i in 3 2 1; do
    echo "Starting in $i..."
    sleep 1
done

echo "🎙️  RECORDING NOW!"
echo ""

# Start recording with chosen parameters
ffmpeg -f alsa -i default $PARAMS -t $DURATION "$FILENAME" -y

echo ""
if [ -f "$FILENAME" ]; then
    echo "✅ Recording completed: $FILENAME"
    
    # Show file info
    echo ""
    echo "📋 File Information:"
    echo "-------------------"
    ls -lh "$FILENAME"
    
    # Show audio properties
    echo ""
    echo "🎵 Audio Properties:"
    echo "-------------------"
    ffprobe -v quiet -show_format -show_streams "$FILENAME" 2>/dev/null | grep -E "(duration|sample_rate|channels|bit_rate)" || echo "Could not read audio properties"
    
    echo ""
    echo "📤 Ready to upload! Use this command:"
    echo "curl -X POST \"https://your-tunnel-url.loca.lt/upload-and-process-local\" \\"
    echo "  -F \"file=@$FILENAME\""
else
    echo "❌ Recording failed"
fi