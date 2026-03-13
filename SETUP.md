# Setup Instructions

## 1. Get Your Pyannote.ai API Key

1. Go to https://www.pyannote.ai/
2. Sign up or log in to your account
3. Navigate to your dashboard/API section
4. Copy your API key

## 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
PYANNOTE_API_KEY=your_actual_api_key_here
UPLOAD_DIR=./uploads
RESULTS_DIR=./results
```

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## 4. Run the Server

```bash
uvicorn app.main:app --reload
```

The server will start at http://localhost:8000

## 5. Test the API

### Step 1: Upload an audio file
```bash
curl -X POST "http://localhost:8000/upload-session" \
  -F "file=@your_audio.wav"
```

Response:
```json
{
  "session_id": "abc-123-def",
  "status": "uploaded",
  "message": "Audio uploaded successfully..."
}
```

### Step 2: Process the audio with diarization

You need to provide a publicly accessible URL where pyannote.ai can download your audio.

Option A - Use their test file:
```bash
curl -X POST "http://localhost:8000/process-session/abc-123-def?audio_url=https://files.pyannote.ai/marklex1min.wav"
```

Option B - Host your file (e.g., on ngrok, S3, etc.) and use that URL:
```bash
curl -X POST "http://localhost:8000/process-session/abc-123-def?audio_url=https://your-domain.com/audio.wav"
```

### Step 3: Check the status and get results
```bash
curl "http://localhost:8000/session/abc-123-def"
```

Response when complete:
```json
{
  "session_id": "abc-123-def",
  "status": "succeeded",
  "transcript": {
    "speakers": {
      "Speaker 0": "Doctor",
      "Speaker 1": "Patient"
    },
    "segments": [
      {
        "speaker": "Speaker 0",
        "speaker_label": "Doctor",
        "text": "How are you feeling today?",
        "start": 0.5,
        "end": 2.3
      }
    ]
  }
}
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Notes

- The audio file must be accessible via a public URL for pyannote.ai to process it
- For local testing, you can use their sample file: `https://files.pyannote.ai/marklex1min.wav`
- For production, upload files to S3/GCS and use those URLs
- Results are stored as JSON files in the `./results` directory
