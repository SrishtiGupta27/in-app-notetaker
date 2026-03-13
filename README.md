# Medical Note-Taking API

A FastAPI backend for medical note-taking with speaker diarization using pyannote.ai API.

## Features

- Audio file upload with secure storage
- Speaker diarization (Doctor vs Patient)
- Speech-to-text transcription
- Background job processing with polling
- Basic PII scrubbing for privacy compliance
- PostgreSQL/SQLite database storage

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI endpoints
│   ├── config.py            # Configuration & environment variables
│   ├── database.py          # SQLAlchemy models & database setup
│   └── services/
│       ├── __init__.py
│       ├── diarization.py   # Pyannote.ai API integration
│       └── privacy.py       # PII scrubbing logic
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
PYANNOTE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/medical_notes
UPLOAD_DIR=./uploads
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

### Upload Audio Session
```bash
POST /upload-session
Content-Type: multipart/form-data

# Example with curl:
curl -X POST "http://localhost:8000/upload-session" \
  -F "file=@recording.wav"
```

Response:
```json
{
  "session_id": "uuid-here",
  "status": "processing",
  "message": "Audio uploaded successfully. Diarization in progress."
}
```

### Get Session Status
```bash
GET /session/{session_id}

# Example:
curl "http://localhost:8000/session/uuid-here"
```

Response:
```json
{
  "session_id": "uuid-here",
  "status": "succeeded",
  "created_at": "2026-03-13T10:00:00",
  "updated_at": "2026-03-13T10:05:00",
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

## Security & Compliance

- API keys stored in environment variables
- Basic PII scrubbing for phone numbers, emails, SSNs
- Secure file storage with unique identifiers
- Database storage for audit trails

## Production Considerations

1. Replace `file://` URLs with actual hosted URLs (S3, GCS, etc.)
2. Implement more sophisticated PII detection (use libraries like Presidio)
3. Add authentication/authorization
4. Use Celery or similar for background tasks at scale
5. Implement webhook handlers instead of polling
6. Add rate limiting and request validation
7. Enable HTTPS and secure file uploads
8. Implement proper logging and monitoring

## Development

Run with auto-reload:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access API docs at: http://localhost:8000/docs

##ffmpeg

ffmpeg -f alsa -i default -ar 16000 -ac 1 -t 300 medical_note.wav

##Local-tunnel
lt --port 8000 --subdomain mymedicalapp
