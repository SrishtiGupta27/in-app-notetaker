import requests
import time
from typing import Dict, Optional
from app.config import settings

class DiarizationService:
    def __init__(self):
        self.api_url = settings.pyannote_api_url
        self.api_key = settings.pyannote_api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def start_diarization(self, audio_url: str) -> Optional[str]:
        """Start diarization job with transcription enabled"""
        data = {
            "url": audio_url,
            "transcription": True
        }
        
        print(f"Starting diarization for: {audio_url}")
        print(f"API URL: {self.api_url}")
        print(f"Headers: {self.headers}")
        print(f"Data: {data}")
        
        response = requests.post(self.api_url, headers=self.headers, json=data)
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return None
        
        result = response.json()
        print(f"Job started with result: {result}")
        return result.get("jobId")
    
    def check_status(self, job_id: str) -> Dict:
        """Poll job status"""
        # Use the correct status endpoint
        status_url = f"https://api.pyannote.ai/v1/jobs/{job_id}"
        print(f"Checking status at: {status_url}")
        
        # Remove Content-Type for GET request
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(status_url, headers=headers)
        
        print(f"Status response: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code != 200:
            return {"status": "error", "message": response.text}
        
        result = response.json()
        print(f"Parsed result: {result}")
        return result
    
    def poll_until_complete(self, job_id: str, max_attempts: int = 60, interval: int = 5) -> Dict:
        """Poll until job completes or max attempts reached"""
        for attempt in range(max_attempts):
            result = self.check_status(job_id)
            status = result.get("status")
            
            if status == "succeeded":
                return result
            elif status == "failed":
                return {"status": "failed", "error": result.get("error", "Unknown error")}
            
            time.sleep(interval)
        
        return {"status": "timeout", "error": "Max polling attempts reached"}
