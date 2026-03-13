from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
import os
import uuid
import json
from pathlib import Path
from app.services.diarization import DiarizationService
from app.services.privacy import PrivacyService
from app.config import settings

app = FastAPI(title="Medical Note-Taking API")

# Ensure upload directory exists
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.results_dir).mkdir(parents=True, exist_ok=True)

# Serve uploaded files statically (for local testing only)
app.mount("/files", StaticFiles(directory=settings.upload_dir), name="files")

@app.get("/")
def root():
    return {
        "message": "Medical Note-Taking API",
        "docs": "/docs",
        "endpoints": {
            "upload": "POST /upload-and-process-local",
            "process": "POST /process-url",
            "status": "GET /session/{session_id}",
            "set_roles": "POST /set-speaker-roles/{session_id}",
            "health": "GET /health"
        }
    }

@app.post("/upload-and-process-local")
async def upload_and_process_local(file: UploadFile = File(...)):
    """Upload and process audio file using tunnel service
    
    Requires a tunnel service (LocalTunnel, ngrok, etc.) to make local files public.
    In production, use cloud storage (S3, GCS, etc.)
    """
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Save file securely
    file_extension = os.path.splitext(file.filename)[1]
    audio_filename = f"{session_id}{file_extension}"
    audio_path = os.path.join(settings.upload_dir, audio_filename)
    
    with open(audio_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create public URL using tunnel service (LocalTunnel)
    audio_url = f"{settings.public_url}/files/{audio_filename}"
    
    # Start diarization
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

@app.post("/set-speaker-roles/{session_id}")
def set_speaker_roles(session_id: str, doctor_speaker: str):
    """Set which speaker is the doctor for a session
    
    Args:
        session_id: The session ID
        doctor_speaker: Which speaker is the doctor ("Speaker 00" or "Speaker 01")
    """
    
    session_file = os.path.join(settings.results_dir, f"{session_id}.json")
    
    if not os.path.exists(session_file):
        raise HTTPException(status_code=404, detail="Session not found")
    
    with open(session_file, "r") as f:
        session_data = json.load(f)
    
    if not session_data.get("result"):
        raise HTTPException(status_code=400, detail="Session not completed yet")
    
    # Re-format transcript with correct speaker assignment
    session_data["doctor_speaker"] = doctor_speaker
    
    with open(session_file, "w") as f:
        json.dump(session_data, f)
    
    return {
        "session_id": session_id,
        "doctor_speaker": doctor_speaker,
        "message": "Speaker roles updated successfully"
    }

@app.post("/process-url")
def process_audio_url(audio_url: str):
    """Process diarization directly from a URL (for testing)
    
    Args:
        audio_url: Public URL where pyannote.ai can access the audio file
                   Example: https://files.pyannote.ai/marklex1min.wav
    """
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    diarization_service = DiarizationService()
    
    # Start diarization
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
            "audio_url": audio_url
        }, f)
    
    return {
        "session_id": session_id,
        "job_id": job_id,
        "status": "processing",
        "message": "Diarization started. Use /session/{session_id} to check status."
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
    
    return response

def format_transcript(result_data: dict, doctor_speaker: str = None) -> dict:
    """Format transcript with speaker labels
    
    Args:
        result_data: The diarization result
        doctor_speaker: Which speaker is the doctor (e.g., "Speaker 00" or "Speaker 01")
                       If None, uses default assumption
    """
    
    if not result_data or "transcript" not in result_data:
        return {}
    
    # Default assumption (may be wrong for different conversations)
    default_mapping = {
        "Speaker 00": "Patient",
        "Speaker 01": "Doctor",
        "Speaker 0": "Patient", 
        "Speaker 1": "Doctor"
    }
    
    # If doctor_speaker is specified, create custom mapping
    if doctor_speaker:
        if doctor_speaker in ["Speaker 00", "Speaker 0"]:
            mapping = {
                "Speaker 00": "Doctor",
                "Speaker 01": "Patient", 
                "Speaker 0": "Doctor",
                "Speaker 1": "Patient"
            }
        else:
            mapping = default_mapping
    else:
        mapping = default_mapping
    
    formatted = {
        "speakers": mapping,
        "segments": []
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

@app.get("/health")
def health_check():
    return {"status": "healthy"}