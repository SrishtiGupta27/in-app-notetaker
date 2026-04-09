# Deployment Guide for Medical Note-Taking System

## Architecture Overview

Your project has a **clear separation of concerns**:
- **Backend**: FastAPI (Python) - Handles all medical logic
- **Frontend**: React/Vite (JavaScript) - User interface
- **Integration Layer**: REST API endpoints

---

## 1. API Endpoints (For Third-Party Frontend Integration)

**Share these endpoints with the company's frontend team.** Use **FastAPI endpoints**, not JavaScript.

### Base URL
```
https://your-company-domain.com/api
```

### Core Endpoints

#### 1. Upload & Process Audio
```
POST /api/upload-and-process-local
Content-Type: multipart/form-data

Request:
- file: Audio file (WAV, MP3, M4A, OGG, FLAC, WEBM)

Response:
{
  "session_id": "uuid-string",
  "job_id": "job-uuid",
  "status": "processing",
  "audio_url": "https://....",
  "message": "File uploaded and processing started",
  "check_status": "GET /session/{session_id}?poll=true"
}
```

#### 2. Check Session Status & Get Transcript
```
GET /api/session/{session_id}
Query Parameters:
  - poll (boolean): If true, waits until processing completes (max 5 mins)

Response:
{
  "session_id": "uuid",
  "status": "processing|succeeded|failed",
  "transcript": {
    "speakers": {
      "Speaker 00": "Speaker 00",  // Will be "Doctor"/"Patient" after role assignment
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
  },
  "audio_url": "/files/session-id.webm"
}
```

#### 3. Get Available Speakers (For Role Assignment)
```
GET /api/session/{session_id}/speakers

Response:
{
  "session_id": "uuid",
  "available_speakers": ["Speaker 00", "Speaker 01"],
  "current_assignment": null,
  "message": "Use POST /set-speaker-roles/{session_id} to assign roles"
}
```

#### 4. Assign Speaker Roles (Doctor/Patient)
```
POST /api/set-speaker-roles/{session_id}
Content-Type: application/json

Request:
{
  "doctor_speaker": "Speaker 01"
}

Response:
{
  "session_id": "uuid",
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

#### 5. Generate SOAP Note (AI-powered)
```
GET /api/session/{session_id}/soap

Response:
{
  "session_id": "uuid",
  "soap": {
    "chief_complaint": "Patient presents with...",
    "history_present_illness": "Detailed paragraph...",
    "assessment_plan": "Clinical assessment...",
    "review_systems": "...",
    "recommended_labs": [
      {
        "test_name": "HbA1c",
        "reason": "Diabetes screening based on symptoms"
      }
    ]
  }
}
```

#### 6. Generate PDF Report
```
GET /api/session/{session_id}/report

Response: Binary PDF file
(Also works as a download link in the frontend)

Headers:
Content-Type: application/pdf
Content-Disposition: attachment; filename=report_session-id.pdf
```

#### 7. Health Check
```
GET /api/health

Response:
{
  "status": "healthy"
}
```

---

## 2. Workflow for Third-Party Frontend

The frontend team should implement this workflow:

```
1. User uploads audio file
   → POST /api/upload-and-process-local
   → Get session_id

2. Display "Processing..." spinner
   → GET /api/session/{session_id}?poll=true (waits for completion)
   → OR GET /api/session/{session_id} (polls manually)

3. Show transcript with generic speaker labels
   → Display transcript segments

4. User assigns roles (Doctor/Patient)
   → POST /api/set-speaker-roles/{session_id}

5. Generate clinical documentation
   → GET /api/session/{session_id}/soap (AI-generated SOAP note)
   → GET /api/session/{session_id}/report (Download PDF)
```

---

## 3. Production Deployment Architecture

### Option A: Company Server (Recommended for Internal Use)

```
┌─────────────────────────────────────────────┐
│   Company Website Domain                    │
│   (company.com)                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Frontend (React/Next.js/Vue/etc)    │   │
│  │ Built by company's frontend team    │   │
│  └────────────┬────────────────────────┘   │
│               │                            │
│               ↓ (REST API calls)           │
│  ┌─────────────────────────────────────┐   │
│  │ FastAPI Backend (Python)            │   │
│  │ - Your Python code                  │   │
│  │ - Diarization service               │   │
│  │ - SOAP generation                   │   │
│  │ - PDF report generation             │   │
│  └──────────┬──────────┬────────────────┘   │
│             │          │                   │
│             ↓          ↓                   │
│        ┌─────────┐  ┌──────────────┐      │
│        │Pyannote │  │OpenAI API    │      │
│        │AI API   │  │(for SOAP)    │      │
│        └─────────┘  └──────────────┘      │
└─────────────────────────────────────────────┘
```

### Option B: Microservices/Containerized (Enterprise Scale)

```
┌─────────────────────────────────────┐
│  Load Balancer / API Gateway        │
├─────────────────────────────────────┤
│                                     │
├─────────────────┬─────────────────┤
│  FastAPI Pod 1  │  FastAPI Pod 2  │
├─────────────────┴─────────────────┤
│                                     │
├─────────────────────────────────────┤
│  Database (PostgreSQL/SQLite)       │
├─────────────────────────────────────┤
│  File Storage (S3/Cloud Storage)    │
└─────────────────────────────────────┘
```

---

## 4. Deployment Steps

### Step 1: Prepare Backend for Deployment

**Update `.env` for production:**
```bash
PYANNOTE_API_KEY=your_api_key
OPENAI_API_KEY=your_openai_key
PUBLIC_URL=https://your-company-domain.com
UPLOAD_DIR=/var/data/uploads  # Absolute path on server
RESULTS_DIR=/var/data/results # Absolute path on server
```

**Key Changes:**
- Replace `PUBLIC_URL` with your actual domain (HTTPS required)
- Use absolute paths for file storage
- Set proper database URL if using PostgreSQL

### Step 2: Choose Deployment Platform

#### Option A: Company Server (Ubuntu/Linux)
```bash
# Install dependencies
pip install -r requirements.txt

# Install Gunicorn (production server)
pip install gunicorn

# Run with Gunicorn
gunicorn app.main:app --workers 4 --bind 0.0.0.0:8000

# Use systemd or supervisor for auto-restart
# Use Nginx as reverse proxy
```

#### Option B: Docker (Recommended)
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/
COPY .env .

CMD ["gunicorn", "app.main:app", "--workers", "4", "--bind", "0.0.0.0:8000"]
```

#### Option C: Cloud Platforms
- **AWS**: EC2 + RDS + S3 for file storage
- **Google Cloud**: Compute Engine + Cloud Storage
- **Azure**: App Service + Blob Storage
- **Heroku**: Easy deployment, pay-as-you-go

### Step 3: Deploy Frontend

The company's frontend team will:
1. Create their own frontend (React, Vue, Angular, etc.)
2. Call your FastAPI endpoints
3. Build and deploy it separately

**Example Frontend Call (Pseudo-code):**
```javascript
// In company's frontend code
async function uploadAndProcess(audioFile) {
  const response = await fetch('https://your-company-domain.com/api/upload-and-process-local', {
    method: 'POST',
    body: audioFile
  });
  const { session_id } = await response.json();
  
  // Poll for completion
  const statusResponse = await fetch(
    `https://your-company-domain.com/api/session/${session_id}?poll=true`
  );
  return await statusResponse.json();
}
```

### Step 4: Setup Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name your-company-domain.com;

    ssl_certificate /path/to/cert;
    ssl_certificate_key /path/to/key;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        # Company's frontend server
        proxy_pass http://frontend-server:3000;
        proxy_set_header Host $host;
    }
}
```

---

## 5. CORS Configuration (For Cross-Domain Requests)

If frontend and backend are on different domains, add CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://company.com", "https://www.company.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 6. Database Migration (Production)

Replace file-based storage with PostgreSQL:

```python
# In config.py
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/medical_notes"
)

# Update models to use SQLAlchemy ORM instead of JSON files
```

---

## 7. What Frontend Team Needs

Share with the company's frontend team:

1. **API Documentation** (this file)
2. **Endpoint Details** (copy from Section 1)
3. **OpenAPI/Swagger Docs**:
   - `https://your-company-domain.com/docs` (auto-generated by FastAPI)
   - `https://your-company-domain.com/redoc` (alternative format)
4. **Sample Requests** (provided above)
5. **Error Handling Examples**
6. **Rate Limiting** (if applicable)

---

## 8. Security Considerations for Production

- ✅ Use HTTPS only
- ✅ Add authentication (JWT tokens, OAuth)
- ✅ Implement rate limiting
- ✅ Validate all file uploads
- ✅ Store API keys in secrets manager (not `.env`)
- ✅ Use environment-specific configurations
- ✅ Add logging and monitoring
- ✅ Implement CORS properly
- ✅ Add input validation on all endpoints
- ✅ Encrypt sensitive data at rest

---

## 9. Summary: API vs JavaScript

| Aspect | Answer |
|--------|--------|
| **What to share with frontend team?** | FastAPI REST endpoints |
| **Do they write JavaScript to call your APIs?** | Yes, they write their own frontend code |
| **Do they import your Python code?** | No - they only make HTTP requests |
| **What language is the backend?** | Python (FastAPI) |
| **What language is the frontend?** | Any (React, Vue, Angular, Svelte, etc.) |

**Key Point**: The company's frontend will be **completely separate** from your Python code. They'll only call your REST API endpoints using standard HTTP requests.

