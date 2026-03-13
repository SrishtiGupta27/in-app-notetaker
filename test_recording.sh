#!/bin/bash

echo "🎤 Medical Note-Taking Audio Test"
echo "================================="

# Check if LocalTunnel is running
if ! pgrep -f "lt --port 8000" > /dev/null; then
    echo "❌ LocalTunnel not running. Start it with: lt --port 8000"
    exit 1
fi

# Get the tunnel URL from .env
TUNNEL_URL=$(grep PUBLIC_URL .env | cut -d'=' -f2)

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ PUBLIC_URL not set in .env file"
    exit 1
fi

echo "🌐 Using tunnel: $TUNNEL_URL"
echo ""

# Record audio
echo "🎙️  Recording audio for 30 seconds..."
echo "   Speak as doctor and patient for testing"
echo "   Press Ctrl+C to stop early"
echo ""

arecord -f cd -t wav -d 30 test_recording.wav

echo "✅ Recording saved as test_recording.wav"
echo ""

# Upload and process
echo "📤 Uploading and processing..."
RESPONSE=$(curl -s -X POST "$TUNNEL_URL/upload-and-process-local" \
  -F "file=@test_recording.wav")

SESSION_ID=$(echo $RESPONSE | grep -o '"session_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
    echo "❌ Upload failed:"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Upload successful! Session ID: $SESSION_ID"
echo ""

# Check results
echo "⏳ Waiting for diarization results..."
curl -s "$TUNNEL_URL/session/$SESSION_ID?poll=true" | jq '.'

echo ""
echo "🎉 Test complete!"