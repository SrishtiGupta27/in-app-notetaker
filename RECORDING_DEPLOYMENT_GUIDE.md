# Recording & Deployment Architecture Guide

## Current Development Setup

### How It Works Right Now:

```
┌─────────────────────────────────────┐
│  Browser (React Frontend)           │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ MediaRecorder API            │  │
│  │ (Built-in browser API)       │  │
│  │                              │  │
│  │ Records audio directly       │  │
│  │ in browser memory            │  │
│  └────────┬─────────────────────┘  │
└───────────┼────────────────────────┘
            │
            │ Sends WebM blob
            ↓
┌─────────────────────────────────────┐
│  FastAPI Backend                    │
│  POST /upload-and-process-local     │
└────────┬─────────────────────────────┘
         │
         │ Serves file via /files/
         ↓
┌─────────────────────────────────────┐
│  LocalTunnel (Development)          │
│  https://mymedicalapp.loca.lt       │
│                                     │
│  Makes localhost publicly available │
└────────┬─────────────────────────────┘
         │
         │ Provides public HTTPS URL
         ↓
┌─────────────────────────────────────┐
│  Pyannote.ai API                    │
│  Downloads audio from public URL    │
│  Performs diarization               │
└─────────────────────────────────────┘
```

### Key Points:

1. **FFmpeg in README** (line 217-218): 
   ```bash
   ffmpeg -f alsa -i default -ar 16000 -ac 1 -t 300 medical_note.wav
   ```
   - This is **NOT** being used automatically
   - This is just documentation for manual server-side recording
   - Not called when you click "Start Recording"

2. **MediaRecorder API** (AudioRecorder.jsx):
   - This IS what's being used
   - Built-in browser API (no ffmpeg needed)
   - Records audio directly in the browser
   - Converts to WebM format
   - Works in all modern browsers

3. **LocalTunnel** (for development):
   - Makes your local backend publicly accessible
   - Only for development testing
   - NOT used in production

---

## Production Deployment Architecture

### Option 1: Simple Production (No Server-Side Recording Needed)

```
┌─────────────────────────────────────────────────┐
│  Company Website (company.com)                  │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ Browser Frontend (React/Vue/Angular)   │    │
│  │                                        │    │
│  │ MediaRecorder API                      │    │
│  │ Records audio in browser               │    │
│  │ (NO ffmpeg needed)                     │    │
│  └─────┬──────────────────────────────────┘    │
└────────┼──────────────────────────────────────┘
         │
         │ HTTPS POST
         ↓
┌─────────────────────────────────────────────────┐
│  Production Backend Server                      │
│  (company-api.com or company.com/api)           │
│                                                 │
│  FastAPI + Gunicorn                            │
│  ├─ /upload-and-process-local                  │
│  ├─ /session/{id}                              │
│  ├─ /session/{id}/soap                         │
│  └─ /session/{id}/report                       │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ File Storage                           │    │
│  │ AWS S3 / Google Cloud Storage / Azure  │    │
│  │ (NOT local filesystem)                 │    │
│  └────────────────────────────────────────┘    │
└────────┬──────────────────────────────────────┘
         │
         │ Provides S3 URL
         ↓
┌─────────────────────────────────────────────────┐
│  Pyannote.ai API                                │
│  (External Service)                             │
│                                                 │
│  Downloads from S3                              │
│  Processes diarization                          │
│  Returns results                                │
└─────────────────────────────────────────────────┘
```

### Option 2: Server-Side Recording (If Needed)

If the company WANTS server-side recording via ffmpeg:

```
┌────────────────────────────┐
│  Backend Server            │
│                            │
│  FFmpeg (installed)        │
│  Records from mic/input    │
│  Via: ffmpeg -f alsa ...   │
│                            │
│  (Manual trigger or API)   │
└────────┬───────────────────┘
         │
         ↓
   Audio file
```

---

## What Happens When You Click "Start Recording"?

### Current Flow (Development):

```
1. User clicks "Start Recording"
   ↓
2. Browser's MediaRecorder API activates
   - Requests microphone permission
   - Starts capturing audio from user's microphone
   ↓
3. Audio recorded in browser memory as WebM blob
   ↓
4. User clicks "Stop Recording"
   ↓
5. WebM blob sent to backend via POST /upload-and-process-local
   ↓
6. Backend saves file to disk
   ↓
7. Backend creates public URL: https://mymedicalapp.loca.lt/files/{uuid}.webm
   ↓
8. Backend sends URL to Pyannote.ai API
   ↓
9. Pyannote.ai downloads and processes
```

### No FFmpeg Involved! 
- FFmpeg is **NOT** called automatically
- Recording happens in the browser
- Only WebM format conversion (built-in)

---

## Production Changes Required

### 1. Remove LocalTunnel
❌ **Development**: `lt --port 8000 --subdomain mymedicalapp`
✅ **Production**: Use actual domain with SSL

### 2. Replace File Storage
❌ **Development**: Local filesystem (`./uploads/`)
✅ **Production**: Cloud storage (S3, GCS, Azure Blob)

### 3. Update Backend Code

**In `app/main.py`**, replace file serving with S3:

```python
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.aws_access_key,
    aws_secret_access_key=settings.aws_secret_key,
    region_name=settings.aws_region
)

@app.post("/upload-and-process-local")
async def upload_and_process_local(file: UploadFile = File(...)):
    # ... validation code ...
    
    # Generate unique filename
    audio_filename = f"{session_id}{file_extension}"
    
    # Upload directly to S3 (don't save locally)
    try:
        s3_client.upload_fileobj(
            Fileobj=content,
            Bucket=settings.s3_bucket,
            Key=f"audio/{audio_filename}",
            ExtraArgs={'ContentType': file.content_type}
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Failed to upload file")
    
    # Use S3 URL (no local tunnel needed)
    audio_url = f"https://{settings.s3_bucket}.s3.amazonaws.com/audio/{audio_filename}"
    
    # Rest of code continues...
    diarization_service = DiarizationService()
    job_id = diarization_service.start_diarization(audio_url)
    
    return {
        "session_id": session_id,
        "job_id": job_id,
        "status": "processing",
        "audio_url": audio_url,
        "message": "File uploaded successfully"
    }
```

### 4. Update Config

**In `app/config.py`**, add S3 settings:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # S3 Configuration
    aws_access_key: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    s3_bucket: str = os.getenv("S3_BUCKET", "medical-notes-bucket")
    
    class Config:
        env_file = ".env"
```

### 5. Update .env for Production

```env
# Production
PUBLIC_URL=https://company.com
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET=your-medical-notes-bucket

# No more LocalTunnel!
# No more local file paths!
```

---

## FFmpeg Usage (If Company Wants It)

FFmpeg is **NOT required** for the current implementation because:
- ✅ Recording happens in browser (MediaRecorder API)
- ✅ Audio is already in WebM format
- ✅ Pyannote.ai accepts WebM

FFmpeg would only be needed if:
- ❌ Recording happens on server (not browser)
- ❌ Audio format conversion needed
- ❌ Real-time audio streaming from device

### If Server-Side Recording is Required:

```bash
# Install FFmpeg on production server
sudo apt-get install ffmpeg

# In Python backend:
import subprocess
import os

def record_audio_from_device():
    output_file = "recording.wav"
    cmd = [
        "ffmpeg",
        "-f", "alsa",           # Audio source
        "-i", "default",        # Default microphone
        "-ar", "16000",         # Sample rate 16kHz
        "-ac", "1",             # Mono channel
        "-t", "300",            # Duration 5 minutes
        output_file
    ]
    subprocess.run(cmd)
    return output_file
```

But this is **NOT** how your current system works!

---

## Summary: Development vs Production

| Aspect | Development | Production |
|--------|-------------|-----------|
| **Recording Method** | Browser MediaRecorder | Browser MediaRecorder (No change!) |
| **FFmpeg** | Not used | Not needed (unless server recording required) |
| **File Storage** | Local filesystem | AWS S3 / Google Cloud Storage |
| **URL Generation** | LocalTunnel | S3 signed URLs |
| **Server** | localhost:8000 | company.com/api |
| **HTTPS** | LocalTunnel provides it | SSL Certificate (Let's Encrypt) |
| **Scaling** | Single machine | Load balancer + multiple servers |

---

## Frontend Team Instructions

Share this with the company's frontend team:

### API Behavior:
1. User records audio in browser using **MediaRecorder API**
2. Audio is sent to backend as file upload
3. Backend uploads to cloud storage
4. Backend sends cloud URL to diarization service
5. Frontend polls for results

### Frontend Requirements:
- ✅ Use built-in MediaRecorder API (no external libraries needed)
- ✅ Support WebM/MP3/WAV formats
- ✅ Implement polling mechanism for async processing
- ✅ Handle file uploads via multipart/form-data

### No Custom FFmpeg Implementation Needed!

