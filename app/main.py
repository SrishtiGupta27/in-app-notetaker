from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
import os
import uuid
import json
from pathlib import Path
from app.services.diarization import DiarizationService
from app.services.privacy import PrivacyService
from app.services.soap import generate_soap_note
from app.services.report import generate_pdf_report
from app.config import settings

app = FastAPI(title="Medical Note-Taking API")

# Ensure upload directory exists
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.results_dir).mkdir(parents=True, exist_ok=True)

# Bypass localtunnel's browser confirmation page for external services like pyannote.ai
@app.middleware("http")
async def bypass_localtunnel(request: Request, call_next):
    response = await call_next(request)
    response.headers["bypass-tunnel-reminder"] = "true"
    return response

# Serve uploaded files statically (for local testing only)
app.mount("/files", StaticFiles(directory=settings.upload_dir), name="files")

@app.get("/")
def root():
    return {
        "message": "Medical Note-Taking API",
        "docs": "/docs",
        "endpoints": {
            "upload": "POST /upload-and-process-local",
            "status": "GET /session/{session_id}",
            "speakers": "GET /session/{session_id}/speakers",
            "soap": "GET /session/{session_id}/soap",
            "report": "GET /session/{session_id}/report",
            "health": "GET /health"
        }
    }

@app.post("/upload-and-process-local")
async def upload_and_process_local(file: UploadFile = File(...)):
    """Upload and process audio file using tunnel service
    
    Requires a tunnel service (LocalTunnel) to make local files public.
    In production, use cloud storage (S3, GCS, etc.)
    """
    
    # Validate file type and provide recommendations
    allowed_extensions = {'.wav', '.mp3', '.m4a', '.ogg', '.flac', '.webm'}
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format. Supported: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (pyannote.ai limit is 1GB)
    content = await file.read()
    file_size_mb = len(content) / (1024 * 1024)
    
    if file_size_mb > 1000:  # 1GB limit
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum size is 1GB."
        )
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Save file securely
    audio_filename = f"{session_id}{file_extension}"
    audio_path = os.path.join(settings.upload_dir, audio_filename)
    
    with open(audio_path, "wb") as buffer:
        buffer.write(content)
    
    # Create public URL using tunnel service (LocalTunnel)
    audio_url = f"{settings.public_url}/files/{audio_filename}"
    
    # Start diarization with medical optimization
    diarization_service = DiarizationService()
    job_id = diarization_service.start_diarization(audio_url)
    
    if not job_id:
        raise HTTPException(status_code=500, detail="Failed to start diarization")
    
    # Save session
    session_file = os.path.join(settings.results_dir, f"{session_id}.json")
    with open(session_file, "w") as f:
        json.dump({
            "session_id": session_id,
            "job_id": job_id,
            "status": "processing",
            "audio_url": audio_url,
            "filename": file.filename
        }, f)
    
    return {
        "session_id": session_id,
        "job_id": job_id,
        "status": "processing",
        "audio_url": audio_url,
        "message": "File uploaded and processing started. This only works if your API is publicly accessible!",
        "check_status": f"GET /session/{session_id}?poll=true"
    }

@app.get("/session/{session_id}/speakers")
def get_session_speakers(session_id: str):
    """Get available speakers for role assignment
    
    Args:
        session_id: The session ID
    """
    
    session_file = os.path.join(settings.results_dir, f"{session_id}.json")
    
    if not os.path.exists(session_file):
        raise HTTPException(status_code=404, detail="Session not found")
    
    with open(session_file, "r") as f:
        session_data = json.load(f)
    
    if not session_data.get("result"):
        raise HTTPException(status_code=400, detail="Session not completed yet")
    
    # Get unique speakers from transcript
    speakers = set()
    for segment in session_data["result"]["transcript"]:
        speaker = segment.get("speaker", "Unknown")
        speakers.add(speaker)
    
    return {
        "session_id": session_id,
        "available_speakers": list(speakers),
        "current_assignment": session_data.get("doctor_speaker"),
        "message": "Use POST /set-speaker-roles/{session_id} to assign roles"
    }



@app.get("/session/{session_id}")
def get_session_status(session_id: str, poll: bool = False):
    """Get session status and transcript
    
    Args:
        session_id: The session ID
        poll: If True, will poll until completion (default: False)
    """
    
    session_file = os.path.join(settings.results_dir, f"{session_id}.json")
    
    if not os.path.exists(session_file):
        raise HTTPException(status_code=404, detail="Session not found")
    
    with open(session_file, "r") as f:
        session_data = json.load(f)
    
    # If processing and poll=True, wait for completion
    if poll and session_data.get("status") == "processing" and session_data.get("job_id"):
        diarization_service = DiarizationService()
        result = diarization_service.poll_until_complete(session_data["job_id"])
        
        if result.get("status") == "succeeded":
            # Get the output data
            output = result.get("output", {})
            diarization = output.get("diarization", [])
            word_transcription = output.get("wordLevelTranscription", [])
            
            # Convert word-level transcription to segments
            transcript_segments = []
            if word_transcription:
                # Group words by speaker and create segments
                current_segment = None
                
                for word in word_transcription:
                    speaker = word.get("speaker", "UNKNOWN")
                    text = word.get("text", "")
                    start = word.get("start", 0)
                    end = word.get("end", 0)
                    
                    # Map SPEAKER_XX to Speaker X format
                    if speaker.startswith("SPEAKER_"):
                        speaker_num = speaker.replace("SPEAKER_", "")
                        speaker = f"Speaker {speaker_num}"
                    
                    if current_segment is None or current_segment["speaker"] != speaker:
                        # Start new segment
                        if current_segment:
                            transcript_segments.append(current_segment)
                        
                        current_segment = {
                            "speaker": speaker,
                            "text": text,
                            "start": start,
                            "end": end
                        }
                    else:
                        # Continue current segment
                        current_segment["text"] += " " + text
                        current_segment["end"] = end
                
                # Add the last segment
                if current_segment:
                    transcript_segments.append(current_segment)
            
            # Apply PII scrubbing
            scrubbed_transcript = PrivacyService.scrub_transcript(transcript_segments)
            
            session_data["status"] = "succeeded"
            session_data["result"] = {
                "diarization": diarization,
                "transcript": scrubbed_transcript
            }
            
            # Save updated session
            with open(session_file, "w") as f:
                json.dump(session_data, f)
        
        elif result.get("status") == "failed":
            session_data["status"] = "failed"
            session_data["error"] = result.get("error", "Unknown error")
            
            with open(session_file, "w") as f:
                json.dump(session_data, f)
    
    # If processing and poll=False, just check status once
    elif session_data.get("status") == "processing" and session_data.get("job_id"):
        diarization_service = DiarizationService()
        result = diarization_service.check_status(session_data["job_id"])
        
        if result.get("status") == "succeeded":
            # Get the output data
            output = result.get("output", {})
            diarization = output.get("diarization", [])
            word_transcription = output.get("wordLevelTranscription", [])
            
            # Convert word-level transcription to segments
            transcript_segments = []
            if word_transcription:
                # Group words by speaker and create segments
                current_segment = None
                
                for word in word_transcription:
                    speaker = word.get("speaker", "UNKNOWN")
                    text = word.get("text", "")
                    start = word.get("start", 0)
                    end = word.get("end", 0)
                    
                    # Map SPEAKER_XX to Speaker X format
                    if speaker.startswith("SPEAKER_"):
                        speaker_num = speaker.replace("SPEAKER_", "")
                        speaker = f"Speaker {speaker_num}"
                    
                    if current_segment is None or current_segment["speaker"] != speaker:
                        # Start new segment
                        if current_segment:
                            transcript_segments.append(current_segment)
                        
                        current_segment = {
                            "speaker": speaker,
                            "text": text,
                            "start": start,
                            "end": end
                        }
                    else:
                        # Continue current segment
                        current_segment["text"] += " " + text
                        current_segment["end"] = end
                
                # Add the last segment
                if current_segment:
                    transcript_segments.append(current_segment)
            
            # Apply PII scrubbing
            scrubbed_transcript = PrivacyService.scrub_transcript(transcript_segments)
            
            session_data["status"] = "succeeded"
            session_data["result"] = {
                "diarization": diarization,
                "transcript": scrubbed_transcript
            }
            
            # Save updated session
            with open(session_file, "w") as f:
                json.dump(session_data, f)
        
        elif result.get("status") == "failed":
            session_data["status"] = "failed"
            session_data["error"] = result.get("error", "Unknown error")
            
            with open(session_file, "w") as f:
                json.dump(session_data, f)
    
    response = {
        "session_id": session_data["session_id"],
        "status": session_data["status"]
    }
    
    if session_data.get("result"):
        doctor_speaker = session_data.get("doctor_speaker")
        response["transcript"] = format_transcript(session_data["result"], doctor_speaker)
    
    if session_data.get("error"):
        response["error"] = session_data["error"]
    
    # Include audio URL for frontend playback
    if session_data.get("audio_url"):
        # Convert the public URL to local path
        audio_url = session_data["audio_url"]
        if "/files/" in audio_url:
            filename = audio_url.split("/files/")[-1]
            response["audio_url"] = f"/files/{filename}"
    
    return response

def format_transcript(result_data: dict, doctor_speaker: str = None) -> dict:
    """Format transcript with speaker labels
    
    Args:
        result_data: The diarization result
        doctor_speaker: Which speaker is the doctor (e.g., "Speaker 00" or "Speaker 01")
                       If None, leaves speakers unlabeled for manual assignment
    """
    
    if not result_data or "transcript" not in result_data:
        return {}
    
    # Get all unique speakers from the transcript
    speakers_in_transcript = set()
    for segment in result_data["transcript"]:
        speaker = segment.get("speaker", "Unknown")
        speakers_in_transcript.add(speaker)
    
    # Create mapping based on doctor_speaker assignment
    mapping = {}
    if doctor_speaker and doctor_speaker in speakers_in_transcript:
        # Assign roles based on user's choice
        for speaker in speakers_in_transcript:
            if speaker == doctor_speaker:
                mapping[speaker] = "Doctor"
            else:
                mapping[speaker] = "Patient"
    else:
        # No assignment - leave as generic speaker labels
        for speaker in speakers_in_transcript:
            mapping[speaker] = speaker  # Keep original speaker ID
    
    formatted = {
        "speakers": mapping,
        "segments": [],
        "needs_role_assignment": doctor_speaker is None  # Flag to indicate manual assignment needed
    }
    
    for segment in result_data["transcript"]:
        speaker = segment.get("speaker", "Unknown")
        speaker_label = mapping.get(speaker, speaker)
        
        formatted["segments"].append({
            "speaker": speaker,
            "speaker_label": speaker_label,
            "text": segment.get("text", ""),
            "start": segment.get("start"),
            "end": segment.get("end")
        })
    
    return formatted

@app.get("/session/{session_id}/soap")
def get_soap_note(session_id: str):
    """Generate a SOAP note from the session transcript using OpenAI"""

    session_file = os.path.join(settings.results_dir, f"{session_id}.json")

    if not os.path.exists(session_file):
        raise HTTPException(status_code=404, detail="Session not found")

    with open(session_file, "r") as f:
        session_data = json.load(f)

    if session_data.get("status") != "succeeded":
        raise HTTPException(status_code=400, detail="Session not completed yet")

    transcript = session_data.get("result", {}).get("transcript", [])

    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript available")

    doctor_speaker = session_data.get("doctor_speaker")
    formatted = format_transcript(session_data["result"], doctor_speaker)
    segments = formatted.get("segments", [])

    soap = generate_soap_note(segments)

    return {
        "session_id": session_id,
        "soap": soap
    }


@app.get("/session/{session_id}/report")
def get_report(session_id: str):
    """Generate and download a PDF medical report for the session"""

    session_file = os.path.join(settings.results_dir, f"{session_id}.json")

    if not os.path.exists(session_file):
        raise HTTPException(status_code=404, detail="Session not found")

    with open(session_file, "r") as f:
        session_data = json.load(f)

    if session_data.get("status") != "succeeded":
        raise HTTPException(status_code=400, detail="Session not completed yet")

    # Get formatted transcript
    doctor_speaker = session_data.get("doctor_speaker")
    formatted = format_transcript(session_data["result"], doctor_speaker)
    segments = formatted.get("segments", [])

    # Generate SOAP note
    soap = None
    if segments:
        soap = generate_soap_note(segments)

    # Generate PDF
    pdf_bytes = generate_pdf_report(
        session_id=session_id,
        filename=session_data.get("filename", "N/A"),
        status=session_data["status"],
        transcript=segments,
        soap=soap,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{session_id}.pdf"}
    )


@app.get("/health")
def health_check():
    return {"status": "healthy"}