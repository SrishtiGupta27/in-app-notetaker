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

Response (before role assignment):
```json
{
  "session_id": "uuid-here",
  "status": "succeeded",
  "transcript": {
    "speakers": {
      "Speaker 00": "Speaker 00",
      "Speaker 01": "Speaker 01"
    },
    "segments": [
      {
        "speaker": "Speaker 00",
        "speaker_label": "Speaker 00",
        "text": "How are you feeling today?",
        "start": 0.5,
        "end": 2.3
      }
    ],
    "needs_role_assignment": true
  }
}
```

### Get Available Speakers
```bash
GET /session/{session_id}/speakers

# Example:
curl "http://localhost:8000/session/uuid-here/speakers"
```

Response:
```json
{
  "session_id": "uuid-here",
  "available_speakers": ["Speaker 00", "Speaker 01"],
  "current_assignment": null,
  "message": "Use POST /set-speaker-roles/{session_id} to assign roles"
}
```

### Assign Speaker Roles
```bash
POST /set-speaker-roles/{session_id}
Content-Type: application/json

{
  "doctor_speaker": "Speaker 01"
}
```

Response after role assignment:
```json
{
  "session_id": "uuid-here",
  "status": "succeeded",
  "transcript": {
    "speakers": {
      "Speaker 00": "Patient",
      "Speaker 01": "Doctor"
    },
    "segments": [
      {
        "speaker": "Speaker 01",
        "speaker_label": "Doctor",
        "text": "How are you feeling today?",
        "start": 0.5,
        "end": 2.3
      }
    ]
  }
}
```

## Frontend Integration

### React/Next.js Audio Recording

FFmpeg won't work directly in React/Next.js browsers. Use these alternatives:

1. **MediaRecorder API** (Recommended)
   ```javascript
   const stream = await navigator.mediaDevices.getUserMedia({ 
     audio: { sampleRate: 16000, channelCount: 1 } 
   });
   const recorder = new MediaRecorder(stream);
   ```

2. **FFmpeg.wasm** - WebAssembly version for browsers
3. **Server-side processing** - Send audio to backend

See `frontend-example.md` for complete React/Next.js implementation.

## Workflow

1. **Record Audio** → Browser MediaRecorder or upload file
2. **Upload** → `POST /upload-and-process-local`
3. **Process** → Pyannote.ai diarization + transcription
4. **Check Status** → `GET /session/{id}` (returns generic speaker labels)
5. **Assign Roles** → `POST /set-speaker-roles/{id}` (specify which speaker is doctor)
6. **Get Final Transcript** → `GET /session/{id}` (returns labeled transcript)

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
